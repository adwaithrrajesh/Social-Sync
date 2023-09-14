const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId;

const messageSchema = mongoose.Schema({
    sender:{
        type:objectId,
        require: true
    },
    reciever:{
        type:objectId,
        require:true 
    },
    message:{
        type:String,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }
});

module.exports = mongoose.model('messages',messageSchema);