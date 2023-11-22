import express,{Request,Response} from "express"
import mongoose from "mongoose"
import bcrypt from "bcrypt";
import User from "./models/User"
import * as jwt from "jsonwebtoken"
import cors from "cors"
require('dotenv').config()

const app = express()

app.use(express.urlencoded({extended:true}))
app.use(express.json());

app.use(cors({
    origin:"http://localhost:3000", 
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
            return res.json({success:true, id:user.id,token})
        }
    }
})

app.listen(8000,() => {
    console.log("Listening on port 8000");    
})