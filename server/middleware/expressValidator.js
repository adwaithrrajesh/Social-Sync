const {body, validationResult} = require('express-validator');

module.exports={
    validation:(req,res,next)=>{
        [
            body('email').isEmail().withMessage('Please Enter a valid Email')
        ]
    }
}