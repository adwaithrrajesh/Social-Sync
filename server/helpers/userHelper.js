const bcrypt = require('bcrypt');
const userModel = require('../model/userModel');

module.exports ={
    doSignup:(user)=>{
        return new Promise((resolve)=>{
            const newUser = new userModel(user);
            const saltRounds = 10;
            bcrypt.hash(newUser.password, saltRounds, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser.save().then(() => {
                    resolve(true);
                }).catch((error) => {
                    resolve(error);
                });
            }); 
        });
    }
};