const otpHelper = require('../helpers/otpHelper');
const userHelper = require('../helpers/userHelper');
const userModel = require('../model/userModel');
const bcrypt = require('bcrypt');
const tokenHelper = require('../helpers/tokenHelper');
const jwt = require('jsonwebtoken')
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

    // ---------------------------------------------------------------REFRESH TOKEN----------------------------------------------------------------------------

};