const mongoose = require('mongoose')
require('dotenv').config()

// Connecting mongoose 
mongoose.connect(process.env.MONGO_URL)

const connection = mongoose.connection

connection.on('connected',()=>{
    console.log('Database Connected Successfully')
})

connection.on('error',(error)=>{
    console.log("There is an error in mongodb config")
})

module.exports = mongoose;