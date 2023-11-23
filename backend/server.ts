import express,{Request,Response} from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt";
import User from "./models/User"
import Coupon from "./models/Coupon"
import * as jwt from "jsonwebtoken"
import cors from "cors"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
require('dotenv').config()


const app = express()

// app.use(session({
//     secret: 'keyboard cat',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }
// }))

app.use(cookieParser());

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
        console.log(metadata);        
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();

});

app.use(express.urlencoded({extended:true}))
app.use(express.json());

app.use(cors({
    origin:process.env.CLIENT_URL, 
    credentials:true,
}))

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY)

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

app.post("/payment",async(req:Request,res:Response) => {
    const {userEmail,mobileNumber,coupon} = req.body
    res.cookie("paymentEmail",userEmail)
    res.cookie("paymentMobileNumber",mobileNumber)
    res.cookie("paymentCoupon",coupon)
    return res.json({redirectUrl: process.env.SERVER_URL + "/create-checkout-session"})
})

app.get("/create-checkout-session",async(req:Request,res:Response) => {
    const paymentCoupon = req.cookies['paymentCoupon']
    const verifyCoupon = await Coupon.findOne({code:paymentCoupon})    
    const amount = verifyCoupon ? Math.floor(83195/2) : 83195

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        success_url:process.env.CLIENT_URL+"/success",
        cancel_url:process.env.CLIENT_URL+"/success"+"/failure",
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
            paymentEmail:req.cookies['paymentEmail'],
            paymentphoneNumber:req.cookies['paymentMobileNumber']
        }
    })

    return res.redirect(session.url)
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

app.listen(8000,() => {
    console.log("Listening on port 8000");    
})