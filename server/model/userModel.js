const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    firstName: {
        type:String,
        require: true
    },
    lastName:{
        type:String,
        require:true
    },
    phoneNumber:{
        type:Number,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    followers:{
        type:Array,
        ref:'users'
    },
    following:{
        type:Array,
        ref:'users'
    },
    verificationBadge:{
        type:Date
    },
    profilePhoto:{
        type:String,
        default:'https://static.vecteezy.com/system/resources/previews/008/442/086/original/illustration-of-human-icon-user-symbol-icon-modern-design-on-blank-background-free-vector.jpg'
    },
    createdAt:{
        type:Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('users', userSchema);