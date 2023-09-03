const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId;

const scheduleDeletionSchema = mongoose.Schema({
    postId:{
        type:objectId,
        ref:'posts',
        require:true
    },
    deletionDate:{
        type:Date
    },
    userId:{
        type:objectId
    }
});

module.exports = mongoose.model('scheduleDeletion',scheduleDeletionSchema);