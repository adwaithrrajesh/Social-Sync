const jwt = require('jsonwebtoken')
require('dotenv').config
module.exports={
    // Creating Access Token
    createAccessToken:(userId)=>{
        try {          
            return new Promise((resolve)=>{
                const AccessToken = jwt.sign({_id:userId},process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "2m"});
                resolve(AccessToken)
            })
        } catch (error) {
            console.log(error)
        }
    },
    // Creating Refresh Token
    createRefreshToken:(userId)=>{
        try {       
            return new Promise((resolve)=>{
                const refreshToken = jwt.sign({_id:userId},process.env.REFRESH_TOKEN_SECRET_KEY,{expiresIn:"2d"})
                resolve(refreshToken)
            })
        } catch (error) {
            console.log(error)
        }
    }
}