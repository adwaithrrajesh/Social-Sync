const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId

const dailyLifeSchema = mongoose.Schema({
    ownerId:{
        type:objectId,
        ref:"users"
    },
    content:{
        type:String,
        require:true
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    viewers:{
        type:Array,
        ref:'users'
    },
    likes:{
        type:Array,
        ref:'users'
    }
});

dailyLifeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
module.exports = mongoose.model('dailyLife',dailyLifeSchema);
