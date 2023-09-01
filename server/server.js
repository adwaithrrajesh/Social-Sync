const express = require('express');
const cors = require('cors');
const morgan  = require('morgan');
require('./database/config');
const app = express();
const userRouter = require('./routes/userRouter');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

//------------ Requiring DOTENV -----------------
dotenv.config();

//-------------- CORS --------------------

app.use(express.json());
app.use(cors({
    origin: '*',
    methods:['GET','POST','PUT','PATCH','DELETE'],
    credentials:true
}));
app.use(morgan('dev'));

// -------------Cookie Parser--------------
app.use(cookieParser())



//-------------------------------------------- PORT --------------------------------------------

const port = process.env.PORT;

// -------------------------------------------SPECIFYING ROUTE -------------------------------

app.use('/api',userRouter);

//----------------------------------------------- STARTING SERVER -------------------------------------

app.listen(port,()=>{console.log(`server started at port ${port}`);});
