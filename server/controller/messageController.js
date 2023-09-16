const messageModel = require('../model/messageModel');

module.exports={
      // -----------------------------------------------------------------------------Add Message------------------------------------------------------------------------------------
      addMessage: async(req,res)=>{
        try {       
            const sender = req.userDetails._id;
            const reciever = req.body.reciever;
            const message = req.body.message;
            if(sender == reciever) return res.status(404).json({message:"Sender and reciever cannot be same"})
            // Inserting message to Database
            const newMessage = new messageModel({sender,reciever,message});
            const messageSaved = newMessage.save()
            if(messageSaved) return res.status(200).json({message:"Message Sent"});
            else return res.status(404).json({message:"Unable to send Message"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }

    },

    // -----------------------------------------------------------------------------Delete Message------------------------------------------------------------------------------------
    unsendMessage: async(req,res)=>{
        try {
            const messageId = req.body?.messageId ;
            const messageDeleted = await messageModel.deleteOne({_id:messageId});
            if(messageDeleted) return res.status(200).json({message:"Message Unsend Successfully"});
            else return res.status(404).json({message:"Unable to unsend Message"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // -----------------------------------------------------------------------------Get Messages for User-----------------------------------------------------------------------------------

    getMessages: async(req,res)=>{
        try {
            const senderId = req.userDetails._id;
            const receiverId = req.body.userId;
            const messages = await messageModel.find({$or: [{ sender: senderId, receiver: receiverId },{ sender: receiverId, receiver: senderId }],}).sort({ createdAt: 1 });
            res.status(200).json({messages});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    }
}