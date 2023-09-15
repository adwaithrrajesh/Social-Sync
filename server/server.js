const express = require('express');
const cors = require('cors');
const morgan  = require('morgan');
require('./database/config');
const app = express();
const userRouter = require('./routes/userRouter');
const postRouter = require('./routes/postRouter');
const messageRouter = require('./routes/messageRouter')
const paymentRouter = require('./routes/paymentRoute')
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
app.use(cookieParser());


// -------------------Trusting Proxy to Get the User Ip---------------

app.set('trust proxy', true);


//-------------------------------------------- PORT --------------------------------------------

const port = process.env.PORT;

// -------------------------------------------SPECIFYING ROUTE -------------------------------

app.use('/api',userRouter);
app.use('/api/post',postRouter);
app.use('/api/message',messageRouter);
app.use('/api/payment',paymentRouter);
//----------------------------------------------- STARTING SERVER -------------------------------------

app.listen(port,()=>{console.log(`server started at port ${port}`);});
