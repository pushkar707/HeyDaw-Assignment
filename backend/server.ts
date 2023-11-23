import express,{Request,Response} from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt";
import User from "./models/User"
import Coupon from "./models/Coupon"
import Payment from "./models/Payement"
import * as jwt from "jsonwebtoken"
import cors from "cors"
import bodyParser from "body-parser"
require('dotenv').config()


const app = express()
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)

app.post('/webhook/stripe', bodyParser.raw({ type: 'application/json' }) , async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event:any;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
    } catch (err:any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    

    // Handle the event
    if(event.type === 'checkout.session.completed'){
        // console.log(event.data.object);  
        const metadata = event.data.object.metadata;
        const {paymentEmail,paymentphoneNumber} = metadata
        const user = await User.findOne({email:paymentEmail})
        if(user){
            const payment = await Payment.create({payer:user.id,lastBillingDate:new Date(),totalBillings:1})
            user.premiumUser = true
            user.payment = payment.id
            await user.save()
        }
        // return res.json({success:true,email:user?.email});
    }
    // return res.json({success:false})
    res.send()
    // Return a 200 response to acknowledge receipt of the event
});

app.use(express.urlencoded({extended:true}))
app.use(express.json());

app.use(cors({
    origin:process.env.CLIENT_URL, 
    credentials:true,
}))


mongoose.connect(process.env.MONGO_DB_URI || "")
.then(() => {
  console.log("Connected to Mongodb");
})
.catch((e)=>{
  console.log("Error: "+ e);
  
})

app.get('/',(req:Request,res:Response) => {
    return res.send("hello world")
})

app.post("/login",async(req:Request,res:Response) => {
    
    const {email,password} = req.body    
    if(!email.length || !password.length){
        return res.json({success:false})
    }
    const existingUser = await User.findOne({email})
    if(existingUser && existingUser.password){
        const verifiedUser = bcrypt.compareSync(password,existingUser.password)
        if(verifiedUser && process.env.JWT_SECRET){
            const token = jwt.sign({id: existingUser.id},process.env.JWT_SECRET)
            res.cookie("signInToken",token)
            res.cookie("email",existingUser.email)
            res.cookie("id",existingUser.id)
            return res.json({success:true, id:existingUser.id,token})
        }else{            
            return res.json({success:false})
        }
    }else{
        const salt = bcrypt.genSaltSync(10);
        const user = new User({email,password:bcrypt.hashSync(password, salt)})
        await user.save()
        if(process.env.JWT_SECRET){
            const token = jwt.sign({id: user.id},process.env.JWT_SECRET)
            res.cookie("signInToken",token)
            res.cookie("email",user.email)
            res.cookie("id",user.id)
            return res.json({success:true, id:user.id,email:user.email,token})
        }
    }
})

app.post("/create-checkout-session",async(req:Request,res:Response) => {
    const {userEmail,mobileNumber,coupon} = req.body
    const verifyCoupon = await Coupon.findOne({code:coupon})    
    const amount = verifyCoupon ? Math.floor(83195/2) : 83195

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        success_url:process.env.CLIENT_URL+"/premium",
        cancel_url:process.env.CLIENT_URL+"/dashboard",
        line_items: [{
            quantity:1,
            price_data: {
                currency: "inr",
                product_data: {
                    name: "HeyDaw Pemium Subscriotion",
                },
                recurring:{
                    interval: "month",
                    interval_count:1,
                },
                unit_amount:amount
            }
        }],
        metadata:{
            paymentEmail:userEmail,
            paymentphoneNumber:mobileNumber
        }
    })

    return res.json({redirectUrl:session.url})
})

app.get("/validate-coupon/:code",async(req:Request,res:Response) => {
    const {code} = req.params
    const dbCoupon = await Coupon.findOne({code})
    if(dbCoupon){
        return res.json({success:true})
    }else{
        return res.json({success:false})
    }
})

app.get("/check-premium/:id",async(req:Request,res:Response) => {
    const {id} = req.params
    const user = await User.findById(id)
    if(user?.premiumUser){
        return res.json({premium:true})
    }
    return res.json({premium:false})
})

app.listen(8000,() => {
    console.log("Listening on port 8000");    
})