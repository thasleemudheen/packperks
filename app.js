const express = require('express');
const path=require('path')
const mongoose=require('mongoose')
const cookieparser=require('cookie-parser')
const session=require('express-session')
const bodyparser=require('body-parser')
const passport=require('passport')
require('dotenv').config()
const passportSetUp=require('./helpers/passport')

const app = express();

// setting the view engine and public files
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views')))
app.use(cookieparser())

// setting the routers in the userroute page
const userRouter=require('./routes/userRoute')
const adminRouter=require('./routes/adminRoute')

// connecting to mongodb
mongoose.connect("mongodb://localhost:27017/PackPerks")
.then(()=>{
    console.log('connected to mongodb');
})
.catch(()=>{
    console.log('an error occured');
})


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
app.use(passport.session());
// middlewareusing
app.use('/',userRouter)
app.use('/',adminRouter)

app.listen(2001, () => {
    console.log('server running in port 2001');
});
