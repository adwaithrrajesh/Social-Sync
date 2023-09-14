const scheduleDeletionModel = require('../model/scheduleDeletion');
const cron = require('node-cron');
const postModel = require('../model/postModel');
const userModel = require('../model/userModel');

cron.schedule('0 0 * * *', async()=>{
    try {
        const currentTime = Date.now();
        const todaySchedules = await scheduleDeletionModel.find({deletionDate:{$lte:currentTime}});
        if(todaySchedules.length>0){
            todaySchedules.map(async(schedules)=>{
               const postDeleted =  await postModel.deleteOne({_id:schedules.postId});
               const scheduleDelete = await scheduleDeletionModel.deleteOne({postId:schedules.postId})
               if(postDeleted && scheduleDelete) return console.log('Deleted Posts That Scheduled')
            })
        }
    } catch (error) {
        console.log(error)
    }
});

cron.schedule('0 0 * * *', async()=>{
    try {
        const currentTime = Date.now();
        const todaySchedules = await userModel.find({verificationBadge:{$lte:currentTime}});
        if(todaySchedules.length>0){
            todaySchedules.map(async(schedules)=>{
                const verificationUpdate = await userModel.updateOne({_id:schedules._id},{ $unset: { verificationBadge: 1 }});
                if(verificationUpdate) return console.log('Verification Bage Removed')
            })
        }
    } catch (error) {
        console.log(error)
    }
})



module.exports = cron