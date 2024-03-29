const postModel = require('../model/postModel');
const scheduleDeletionModel = require('../model/scheduleDeletion')




module.exports={
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

    // --------------------------------------------------------------UnLike Comment---------------------------------------------------------------------

       unlikeComment:(commentId,postId,userId)=>{
        return new Promise(async(resolve)=>{
            const unlikeComment = await postModel.findOneAndUpdate({_id:postId,'comments._id':commentId,'comments.likes':userId},{
                $pull:{
                    'comments.$.likes':userId
                }
            })
            resolve(unlikeComment)
        })
    },

    // --------------------------------------------------------------SCHEDULE POST DELETE---------------------------------------------------------------------
   
    schedulePostDelete:(postId,userId)=>{
        // Inserting the schedule details in database
        return new Promise(async(resolve,reject)=>{
            try {      
                const currentDate = new Date();
                const scheduledTime = currentDate.setDate(currentDate.getDate() + 7);
                const newSchedule = new scheduleDeletionModel({postId: postId,deletionDate: scheduledTime,userId:userId});
                  const scheduled = await newSchedule.save();
                  resolve(scheduled)
            } catch (error) {
                console.log(error)
            }
        });
    },

    // ---------------------------------------------------------------------------------------------------------------------------------------------------------
}