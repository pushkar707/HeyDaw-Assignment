import mongoose,{Schema} from "mongoose";

const paymentSchema = new Schema({
    payer:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    lastBillingDate:String,
    totalBillings:Number
})

export default mongoose.model("Payment",paymentSchema)