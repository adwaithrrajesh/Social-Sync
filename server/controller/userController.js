const otpHelper = require('../helpers/otpHelper');
const userHelper = require('../helpers/userHelper');
const securityHelper = require('../helpers/securityHelper');
const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
const tokenHelper = require('../helpers/tokenHelper');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const dailyLifeModel = require('../model/dailyLifeModel');
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
            res.status(500).json({message:"Internal Server Error"}); 
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
            res.status(500).json({message:"Internal Server Error"});
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
            res.status(200).json({accessToken:accessToken});
        } catch (error) {
            console.log(error)
            res.status(500).json({message:"Internal Server Error"});
        }
    },


    // ------------------------------------------------------------------Getting all Users--------------------------------------------------------------------------

    getUsers:async(req,res)=>{
        try {
            const users  = await userModel.find();
            res.status(200).json({users:users});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------Getting Users with Id--------------------------------------------------------------------------

    getUserWithId:async(req,res)=>{
        try {
            const userId = req.body.userId;
            const user = await userModel.findOne({_id:userId});
            res.status(200).json({userDetails:user});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
        }
    },

    // ------------------------------------------------------------------Getting Users with Id--------------------------------------------------------------------------
  
    getUserWithToken: async(req,res)=>{
        try {
            const user = req.userDetails;
            res.status(200).json({userDetails:user});
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"});
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
            const unfollowed = await userModel.findOneAndUpdate({_id:userId,followers:unfollower},{$pull:{followers:unfollower}});
            const unfollowing = await userModel.findOneAndUpdate({_id:unfollower,following:userId},{$pull:{following:userId}});
            if(unfollowed && unfollowing) res.status(200).json({message:"Unfollowed Successful"});
            else res.status(401).json({message:"Unable to unfollow this User"});
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