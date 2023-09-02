const otpHelper = require('../helpers/otpHelper');
const userHelper = require('../helpers/userHelper');
const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
const tokenHelper = require('../helpers/tokenHelper');
const jwt = require('jsonwebtoken');
const postModel = require('../model/postModel');
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
            if(!emailExist) return res.status(404).json({message:"Email Doesnot exist"});
            const passwordCorrect = await bcrypt.compare(password,emailExist.password);
            if(!passwordCorrect) return res.status(404).json({message:"Incorrect Password"});
            const accessToken = await tokenHelper.createAccessToken(emailExist._id);
            const refreshToken = await tokenHelper.createRefreshToken(emailExist._id);
            // Assigning refresh token in http-only cookie 
             res.cookie('jwt', refreshToken, { httpOnly: true, 
             sameSite: 'None', secure: true, 
             maxAge: 24 * 60 * 60 * 1000 });
            // Returning Access Token
            res.status(200).json({accessToken:accessToken, message:"Login successful"})
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
            const temperoryPostDelete = await postModel.findOneAndUpdate({_id:postId,userId:userId},{$set:{ show:false} });
            if(temperoryPostDelete) return res.status(200).json({message:"Your Post Will be Permenently Deleted After 7 days"});
            else return res.status(401).json({message:'Unable to Delete post'});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
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

            if(!updatePassword) res.status(401).json({message:"can't update the password"});
            else res.status(200).json({message:"password Updated Successfully"});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------Update User Model-------------------------------------------------------------------------


};