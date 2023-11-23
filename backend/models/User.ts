import mongoose,{Schema} from "mongoose";

const userSchema = new Schema({
    email:{
        type:String,
        unique:true
    },
    password:String,
    mobileNumber:Number,
    payment:{
        type:Schema.Types.ObjectId,
        ref:"Payment"
    }
})

export default mongoose.model("User",userSchema)