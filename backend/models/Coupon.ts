import mongoose,{Schema} from "mongoose";

const couponSchema = new Schema({
    code:{
        type:String,
        unique:true,
        required:true
    },
    discountPercentage:{
        type:Number,
        default: 50,
    }
})

export default mongoose.model("Coupon",couponSchema)