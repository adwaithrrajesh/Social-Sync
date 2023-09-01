const bcrypt = require('bcrypt');
const userModel = require('../model/userModel');
const postModel = require('../model/postModel');

module.exports ={

    // ---------------------------------------------------------------Signup-------------------------------------------------------------------------
   
    doSignup:(user)=>{
        return new Promise((resolve)=>{
            const newUser = new userModel(user);
            const saltRounds = 10;
            bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.save().then(() => {
                    resolve(true);
                }).catch((error) => {
                    resolve(error);
                });
            }); 
        });
    },

    // --------------------------------------------------------------Like Comment---------------------------------------------------------------------

    likeComment:(commentId,postId,userId)=>{
        return new Promise(async(resolve)=>{
            const likeComment = await postModel.findOneAndUpdate({_id:postId,'comments._id':commentId,'comments.likes':{$ne:userId}},{
                $addToSet:{
                    'comments.$.likes':userId
                }
            })
            resolve(likeComment)
        })
    },

    // --------------------------------------------------------------Like Comment---------------------------------------------------------------------

       unlikeComment:(commentId,postId,userId)=>{
        return new Promise(async(resolve)=>{
            const unlikeComment = await postModel.findOneAndUpdate({_id:postId,'comments._id':commentId,'comments.likes':userId},{
                $pull:{
                    'comments.$.likes':userId
                }
            })
            resolve(unlikeComment)
        })
    }
};