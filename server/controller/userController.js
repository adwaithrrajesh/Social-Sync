const otpHelper = require('../helpers/otpHelper');
const userHelper = require('../helpers/userHelper');
const securityHelper = require('../helpers/securityHelper')
const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
const tokenHelper = require('../helpers/tokenHelper');
const jwt = require('jsonwebtoken');
const postModel = require('../model/postModel');
const scheduleDeletionModel = require('../model/scheduleDeletion'); 
const repostModel = require('../model/respostModel')
const Razorpay = require('razorpay');
const messageModel = require('../model/messageModel');
const dailyLifeModel = require('../model/dailyLifeModel');
const mongoose  = require('mongoose')
// Temperory Storage for User Details.
let userPendingForSignup;

module.exports ={
   
    // ---------------------------------------------------------------SIGN UP----------------------------------------------------------------  
    
    sendOtp: async(req,res)=>{
        try {            
            userPendingForSignup = { ...req.body };
            const emailExist = await userModel.findOne({email:userPendingForSignup.email});
            if(emailExist) return res.status(404).json({message:"Email Already Exist"});
            await otpHelper.sendOtp(userPendingForSignup.email).then((otp)=>{
                res.status(200).json({message:'Email Sent Successfully'});
                process.env.OTP = otp;
            });
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})   
        }
    },

    // ------------------------------------------------------VERIFYING OTP && SIGNING UP-------------------------------------------------------------
  
    verifyOtp: async(req,res)=>{
        try {
        const {otp} = req.body;
        if(otp == process.env.OTP){
                await userHelper.doSignup(userPendingForSignup);
                res.status(200).json('User Registered Successfully');
            }else{
                res.status(404).json({message:'Incorrect Otp'});
            }
        } catch (error) {
            res.status(500).json('Internal Server Error');
        }
    },

    // ---------------------------------------------------------------LOGIN----------------------------------------------------------------------------

    login:async(req,res)=>{
        try {     
            const {email,password} = req.body;
            const emailExist = await userModel.findOne({email:email});
            const ipAddress = req.ip

            if(!emailExist) return res.status(404).json({message:"Email Doesnot exist"});
            const passwordCorrect = await bcrypt.compare(password,emailExist.password);
            if(!passwordCorrect) return res.status(404).json({message:"Incorrect Password"});

            // Creating Access and refresh token 
            const accessToken = await tokenHelper.createAccessToken(emailExist._id);
            const refreshToken = await tokenHelper.createRefreshToken(emailExist._id);

            // Assigning refresh token in http-only cookie 
            res.cookie('jwt', refreshToken, { httpOnly: true, 
                sameSite: 'None', secure: true, 
                maxAge: 24 * 60 * 60 * 1000 });
                // Returning Access Token
                res.status(200).json({accessToken:accessToken, message:"Login successful"});

                // Finding The location of the Login attempt and send it to User Email
                const locationData = await securityHelper.findLocationData(ipAddress);
                const googleMapUrl = await securityHelper.getGoogleMapUrl(locationData);
                // Sending Awareness Mail to user
                await securityHelper.sendLoginDetectionMailToUser(locationData,googleMapUrl,email);
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ---------------------------------------------------------------REFRESH TOKEN----------------------------------------------------------------------------

    refreshToken: async(req,res)=>{
        try {
            const cookies = req.cookies;
            if(!cookies?.jwt) res.status(401).json({message:"Unauthorized Please Login again"});
            const refreshToken = cookies.jwt;
            const jwtVerified = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET_KEY);
            if(!jwtVerified) return res.status(401).json({message:"Token Expired Please Login again"});
            const accessToken = await tokenHelper.createAccessToken(jwtVerified._id)
            res.status(200).json({accessToken:accessToken})
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------ADD POST----------------------------------------------------------------------------

    addPost: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const imageUrl = req.body.imageUrl;
            const discription = req.body.discription;
            const postDetails = {userId,imageUrl,discription};
            const createPost = new postModel(postDetails);
            const posted = createPost.save();
            if(!posted) return res.status(404).json({message:"Unable to post your picture"});
            res.status(200).json({message:"Posted Successfully"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------ADD COMMENT----------------------------------------------------------------------------

    addComment : async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const commentText = req.body.commentText
            const postId = req.body.postId
            const commentDetails = {userId,commentText}
            const addComment = await postModel.findOneAndUpdate({_id:postId},{$push:{comments:commentDetails}});
            if(!addComment) return res.status(404).json({message:"unable to add comment"})
            res.status(200).json({message:"Comment Added Successfully"})
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Like Comment----------------------------------------------------------------------------

    likeComment: async(req,res)=>{
        try {
            // requiring Values
            const commentId = req.body.commentId;
            const postId = req.body.postId;
            const userId = req.userDetails._id; 
            const likeComment = await userHelper.likeComment(commentId,postId,userId)
            if(likeComment){
                res.status(200).json({message:"comment liked Successfully"})
            }else{
                res.status(401).json({message:"Already like the comment"})
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Unlike the Comment----------------------------------------------------------------------------

    unlikeComment: async(req,res)=>{
        try {
            // requiring Values
            const commentId = req.body.commentId;
            const postId = req.body.postId;
            const userId = req.userDetails._id; 
            const unlikeComment = await userHelper.unlikeComment(commentId,postId,userId)
            if(unlikeComment){
                res.status(200).json({message:"comment Unliked Successfully"})
            }else{
                res.status(401).json({message:"Already Unliked the comment"})
            }
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Like The Post----------------------------------------------------------------------------

    likePost: async(req,res)=>{
        try {
            const postId = req.body.postId
            const userId = req.userDetails._id
            const likePost = await postModel.findOneAndUpdate({_id:postId,likes:{$ne:userId}},{$addToSet:{likes:userId}})
            if(likePost) return res.status(200).json({message:"You liked this Post"});
            else return res.status(401).json({message:"You have already like this Post"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------UnLike The Post----------------------------------------------------------------------------

    unlikePost: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const userId = req.userDetails._id;
            const unlikePost = await postModel.findOneAndUpdate({_id:postId,likes:userId},{$pull:{likes:userId}});
            if(unlikePost) res.status(200).json({message:"You've Unliked the Post"})
            else return res.status(401).json({message:"You have Already unliked the Post"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Getting all Users--------------------------------------------------------------------------

    getUsers:async(req,res)=>{
        try {
            const users  = await userModel.find()
            res.status(200).json({users:users})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Getting Users with Id--------------------------------------------------------------------------

    getUserWithId:async(req,res)=>{
        try {
            const userId = req.body.userId;
            const user = await userModel.findOne({_id:userId});
            res.status(200).json({userDetails:user})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------Getting Users with Id--------------------------------------------------------------------------
  
    getUserWithToken: async(req,res)=>{
        try {
            const user = req.userDetails
            res.status(200).json({userDetails:user})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------TEMPERORY POST DELETE--------------------------------------------------------------------------

    temperoryPostDelete: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const userId = req.userDetails._id;
            const deletionAlreadyScheduled = await scheduleDeletionModel.findOne({postId:postId});
            if(deletionAlreadyScheduled) return res.status(401).json({message:"You Have already Deleted The Post"})
            const temperoryPostDelete = await postModel.findOneAndUpdate({_id:postId,userId:userId},{$set:{ show:false} });
            const schedulePostDelete = await userHelper.schedulePostDelete(postId,userId);
            if(temperoryPostDelete && schedulePostDelete) return res.status(200).json({message:"Your Post Will be Permenently Deleted After 7 days"});
            else return res.status(401).json({message:'Unable to Delete post'});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------------Recover Post------------------------------------------------------------------------------

    recoverPost: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const changeShowStatus = await postModel.findOneAndUpdate({_id:postId},{$set:{show:true}});
            const removeFromDeletionSchedule = await scheduleDeletionModel.deleteOne({postId:postId});
           if(changeShowStatus && removeFromDeletionSchedule) res.status(200).json({message:"Post recovered"});
           else res.status(404).json({message:"Unable to Recover your post"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------PERMENENT POST DELETE--------------------------------------------------------------------------

    permenentPostDelete: async(req,res)=>{
        try {
            const postId = req.body.postId;
            const postDeleted = await postModel.findOneAndDelete({_id:postId});
            if(postDeleted) return res.status(200).json({message:"Post Deleted Successfully"});
            else return res.status(401).json({message:"Unable to delete the post"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },
    // -----------------------------------------------------------------------FOLLOW-------------------------------------------------------------------------------

    follow:async(req,res)=>{
        try {
            const follower = req.userDetails._id;
            const userId = req.body.userId;
            const followed = await userModel.findOneAndUpdate({_id:userId,followers:{$ne:follower}},{$addToSet:{followers:follower}});
            const following = await userModel.findOneAndUpdate({_id:follower,following:{$ne:userId}},{$addToSet:{following:userId}});
            if(followed && following) res.status(200).json({message:"Followed Successfully"});
            else res.status(401).json({message:"Unable to follow this User"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // -----------------------------------------------------------------------UnFollow-------------------------------------------------------------------------------

    unfollow:async(req,res)=>{
        try {
            const unfollower = req.userDetails._id;
            const userId = req.body.userId;
            const unfollowed = await userModel.findOneAndUpdate({_id:userId,followers:unfollower},{$pull:{followers:unfollower}})
            const unfollowing = await userModel.findOneAndUpdate({_id:unfollower,following:userId},{$pull:{following:userId}})
            if(unfollowed && unfollowing) res.status(200).json({message:"Unfollowed Successful"})
            else res.status(401).json({message:"Unable to unfollow this User"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------GET FOLLOWERS COUNT-------------------------------------------------------------------------

    getFollowersCount:async(req,res)=>{
        try {
            const userId = req.userDetails._id
            const user = await userModel.aggregate([{$match:{_id:userId}},{$project:{followers:{$size:'$followers'}}}]);
            if(user) res.status(200).json({followersCount:user[0].followers});
            else res.status(404).json({message:"Unable to fetch followers count"})
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------GET POSTS COUNT-------------------------------------------------------------------------

    getPostCount : async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const postCount = await postModel.find({userId:userId,show:false}).count()
            if(postCount) res.status(200).json({postCount:postCount})
            else res.status(401).json({message:"No Post Found"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------Change Password-------------------------------------------------------------------------

    changePassword : async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const oldPassword = req.body.oldPassword;
            const newPassword = req.body.newPassword;
            const user = await userModel.findOne({_id:userId});

            const passwordVerification = await bcrypt.compare(oldPassword,user.password);
            const newPasswordMatchOld = await bcrypt.compare(newPassword,user.password);
            if(newPasswordMatchOld) return res.status(401).json({message:"This is your current password"});
            if(!passwordVerification) return res.status(401).json({message:"Old Password is wrong"});
            const hashedPassword = await bcrypt.hash(newPassword,10);
            const updatePassword = await userModel.findOneAndUpdate({_id:userId},{password:hashedPassword});

            if(!updatePassword) return res.status(401).json({message:"can't update the password"});
            else return res.status(200).json({message:"password Updated Successfully"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },
    // ------------------------------------------------------------------GetPostForHomeScreen-------------------------------------------------------------------------

    getPostForHomeScreen: async(req,res)=>{
        try {
            const postsForHomeScreen = await postModel.find({show:true});
            if(postsForHomeScreen) return res.status(200).json({postsForHomeScreen:postsForHomeScreen});
            else return res.status(404).json({message:"No Post available"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------GetDeletionScheduledPosts-------------------------------------------------------------------------

    getDeletionScheduledPosts: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const deletionScheduledPosts = await scheduleDeletionModel.find({userId:userId}).populate('postId');
            if(deletionScheduledPosts) res.status(200).json({deletionScheduledPosts:deletionScheduledPosts});
            else res.status(404).json({message:"No Post Available"})
        } catch (error) {
            console.log(error);
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ---------------------------------------------------------------------------Repost-------------------------------------------------------------------------------
    repost: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const ownerId = req.body.ownerId;
            const postId = req.body.postId;

            const AlreadyReposted = await repostModel.findOne({postId});
            if(AlreadyReposted) return res.status(404).json({message:"Already Reposted this post"})

            if(userId == ownerId) return res.status(401).json({message:"The User and owner cannot be 1 person"});
            const newRepost = new repostModel({
                userId:userId,
                postId:postId,
                ownerId:ownerId
            }); 
            const reposted = await newRepost.save();
            if(reposted) res.status(200).json({message:"Reposted Successfully"});
            else res.status(404).json({message:"Unable to repost"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ---------------------------------------------------------------------------Get Reposts-------------------------------------------------------------------------------

    getReposts: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            const reposts =  await repostModel.find({ userId: userId }).populate('ownerId').populate('postId').exec();
            if(reposts) return res.status(200).json({reposts:reposts});
            else return res.status(404).json({message:"You didn't repost anything"})
        } catch (error) {
            console.log(error);
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ---------------------------------------------------------------------------REMOVE Reposts-------------------------------------------------------------------------------
   
    removeRepost: async(req,res)=>{
        try {
            const repostId = req.body.repostId;
            const removePost = await repostModel.findByIdAndDelete({_id:repostId});
            if(removePost) res.status(200).json({message:"Post Removed Successfully"});
            else res.status(404).json({message:"Unable to remove repost"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // -------------------------------------------------------------------------initializePayment---------------------------------------------------------------------------------------------

    initializePayment: async(req,res)=>{
        try {
            const userId = req.userDetails._id;
            // User exist or not
            const userExist = await userModel.findOne({_id:userId});
            if(!userExist) return res.status(404).json({message:"User DoesNot Exist"});
            if(userExist.verificationBadge) return res.status(404).json({message:"You have already purchased a verification Badge"});
            const order = 699
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
              });
              var options = {
                amount: order * 100,
                currency: "INR",
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  res.status(500).json({ message: "Internal Server Error" });
                }
                res.status(200).json({ order: order });
              });
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // --------------------------------------------------------------------------Getting verified--------------------------------------------------------------------------------------------
    verifyPayment: async(req,res)=>{ 
        try {            
            const userId = req.userDetails._id; 
            const { response } = req.body;
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;
            const today = new Date();
            const expiryDate = today.setDate(today.getDate() + 30);
            const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
            if (razorpay_signature === expectedSignature) {
                const verified = await userModel.findOneAndUpdate({_id:userId},{verificationBadge:expiryDate});
                if(verified) res.status(200).json({message:"You Are now verified"});
                else res.status(404).json({message:"You are not verified"});
            } else {
              res.status(404).json({ message: "Unable to book an Appointment" });
            }
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // -----------------------------------------------------------------------------Add Message------------------------------------------------------------------------------------
    addMessage: async(req,res)=>{
        try {       
            const sender = req.userDetails._id;
            const reciever = req.body.reciever;
            const message = req.body.message;
            if(sender == reciever) return res.status(404).json({message:"Sender and reciever cannot be same"})
            // Inserting message to Database
            const newMessage = new messageModel({sender,reciever,message});
            const messageSaved = newMessage.save()
            if(messageSaved) return res.status(200).json({message:"Message Sent"});
            else return res.status(404).json({message:"Unable to send Message"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"})
        }

    },

    // -----------------------------------------------------------------------------Delete Message------------------------------------------------------------------------------------
    unsendMessage: async(req,res)=>{
        try {
            const messageId = req.body?.messageId ;
            const messageDeleted = await messageModel.deleteOne({_id:messageId});
            if(messageDeleted) return res.status(200).json({message:"Message Unsend Successfully"});
            else return res.status(404).json({message:"Unable to unsend Message"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // -----------------------------------------------------------------------------Get Messages for User-----------------------------------------------------------------------------------

    getMessages: async(req,res)=>{
        try {
            const senderId = req.userDetails._id;
            const receiverId = req.body.userId
            const messages = await messageModel.find({$or: [{ sender: senderId, receiver: receiverId },{ sender: receiverId, receiver: senderId }],}).sort({ createdAt: 1 });
            res.status(200).json({messages})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------------------Daily Life-----------------------------------------------------------------------------------------------------

    createDailyLife: async(req,res)=>{
        try {         
            const content = req.body.content;
            const ownerId = req.userDetails._id;
            const newDailyLife = new dailyLifeModel({ownerId:ownerId,content:content});
            const createdDailyLife = newDailyLife.save();
            if(createdDailyLife) return res.status(200).json({message:"Daily Life Created Successfully"});
            else return res.status(404).json({message:"Unable to create Daily life"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------------------View Daily Life-----------------------------------------------------------------------------------------------------

    viewDailyLife: async(req,res)=>{
        try {
            const viewerId = req.userDetails._id;
            const dailyLifeId = req.body.dailyLifeId;
            const update = await dailyLifeModel.findOneAndUpdate({ _id: dailyLifeId },{ $addToSet: { viewers: viewerId } },{ new: true });
            return res.status(200).json({message:"Daily Life Viewed"})
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
        
    },

    // ------------------------------------------------------------------------------Like Daily Life-----------------------------------------------------------------------------------------------------

    likeDailyLife: async(req,res)=>{
        try {
            const likedUser = req.userDetails._id;
            const dailyLifeId = req.body.dailyLifeId;
            const update = await dailyLifeModel.findOneAndUpdate({_id:dailyLifeId},{$addToSet:{likes:likedUser}},{new:true});
            return res.status(200).json({message:"Daily Life liked"})
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
        
    },

    // ------------------------------------------------------------------------------Get Daily Lifes-----------------------------------------------------------------------------------------------------

    getDailyLife:async(req,res)=>{
        try {
            const getDailyLife = await dailyLifeModel.find().populate('ownerId');
            return res.status(200).json({dailyLives:getDailyLife});
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    },
    
    // ------------------------------------------------------------------------------ Get Daily Life Using Id-----------------------------------------------------------------------------------------------------

    getDailyLifeUsingId: async(req,res)=>{
        try {
            const dailyLifeId = req.body.dailyLifeId;
            const dailyLife = await dailyLifeModel.findOneAndUpdate({_id:dailyLifeId});
            if(dailyLife) return res.status(200).json({dailyLife:dailyLife});
            else return res.status(404).json({message:"No Daily life Found"})
        } catch (error) {
            res.status(500).json({message:"Internal Server error"})
        }
    },

    // ------------------------------------------------------------------------------getDailyLifeWithUserId------------------------------------------------------------------------------------------------------

    getDailyLifeWithUserId: async(req,res)=>{
        try {      
            const ownerId = req.userDetails._id;
            const dailyLife = await dailyLifeModel.find({ownerId:ownerId});
            if(dailyLife) return res.status(200).json({dailyLife:dailyLife});
            else return res.status(404).json({message:"No Daily Life Found"})
        } catch (error) {
            res.status(500).json({message:"Internal Server error"})
        }
    },

    // ------------------------------------------------------------------------------Get daily life likes------------------------------------------------------------------------------------------------------

    getDailyLifeLikes: async(req,res)=>{
        try {
            const dailyLifeId = req.body.dailyLifeId ;
            const dailyLife = await dailyLifeModel.findOne({_id:dailyLifeId}).populate('likes');
            if(dailyLife) return res.status(200).json({dailyLifeLikes:dailyLife.likes});
            else return res.status(404).json({message:"No likes found"})
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    },

    // ------------------------------------------------------------------------------Get daily life Viewers------------------------------------------------------------------------------------------------------
    
    getDailyLifeViews: async(req,res)=>{
        try {
            const dailyLifeId = req.body.dailyLifeId ;
            const dailyLife = await dailyLifeModel.findOne({_id:dailyLifeId}).populate('viewers');
            if(dailyLife) return res.status(200).json({dailyLifeViewers:dailyLife.viewers});
            else return res.status(404).json({message:"No Viewers found"});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
};