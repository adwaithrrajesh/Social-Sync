const jwt = require('jsonwebtoken');
const userModel = require('../model/userModel')
require('dotenv').config


module.exports={
    userAuthentication: async(req,res,next)=>{
        try {      
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];
            // Verifying Token
            try {     
                const tokenVerified = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET_KEY);
                req.userDetails =  await userModel.findOne({_id:tokenVerified._id});
                if(!req.userDetails) return res.status(404).json({message:"User Not Found"});
                next()
            } catch (error) {
                res.status(401).json({message:"Token Expired Please Login Again"});
            }
        } catch (error) {
            res.status(500).json({message:"Internal Server Error"})
        }
    }
}