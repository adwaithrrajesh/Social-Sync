const userModel = require('../model/userModel');
const Razorpay = require('razorpay');

module.exports={
     // -------------------------------------------------------------------------initializePayment---------------------------------------------------------------------------------------------

     initializePayment: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            // User exist or not
            const userExist = await userModel.findOne({_id:userId});
            if(!userExist) return res.status(404).json({message:"User DoesNot Exist"});
            if(userExist.verificationBadge) return res.status(404).json({message:"You have already purchased a verification Badge"});
            const order = 699
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
              });
              var options = {
                amount: order * 100,
                currency: "INR",
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  res.status(500).json({ message: "Internal Server Error" });
                }
                res.status(200).json({ order: order });
              });
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // --------------------------------------------------------------------------Getting verified--------------------------------------------------------------------------------------------
    
    verifyPayment: async(req,res)=>{ 
        try {            
            const userId = req.userDetails._id; 
            const { response } = req.body;
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
            const today = new Date();
            const expiryDate = today.setDate(today.getDate() + 30);
            const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
            if (razorpay_signature === expectedSignature) {
                const verified = await userModel.findOneAndUpdate({_id:userId},{verificationBadge:expiryDate});
                if(verified) res.status(200).json({message:"You Are now verified"});
                else res.status(404).json({message:"You are not verified"});
            } else {
              res.status(404).json({ message: "Unable to book an Appointment" });
            }
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    }
}