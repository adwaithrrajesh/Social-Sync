const scheduleDeletionModel = require('../model/scheduleDeletion');
const cron = require('node-cron');
const mongoose = require('mongoose')
const postModel = require('../model/postModel')

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
})


module.exports = cron