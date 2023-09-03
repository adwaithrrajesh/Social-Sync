const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId

const repostSchema = new mongoose.Schema({
    userId:{
        type:objectId,
        ref:'users',
        require:true
    },
    postId:{
        type:objectId,
        ref:'posts',
        require:true
    },
    ownerId:{
        type:objectId,
        ref:'users',
        require:true
    }
})

module.exports = mongoose.model('reposts',repostSchema)