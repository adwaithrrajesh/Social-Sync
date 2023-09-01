const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId

// Comment Schema
const commentSchema = mongoose.Schema({
    userId:{
        type:objectId
    },
    likes:{
        type: Array,
    },
    commentText:{
        type:String
    }
});

// Post Schema
const postSchema = mongoose.Schema({
    userId:{
        type:objectId,
        require:true
    },
    imageUrl:{
        type:String,
        require:true
    },
    likes:{
        type: Array
    },
    comments:{
        type:[commentSchema]
    },
    discription:{
        type: String
    },
    show:{
        type:Boolean,
        require:true
    }
});

module.exports = mongoose.model('posts',postSchema)