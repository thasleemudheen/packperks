const express = require('express');
const path = require('path')
const mongoose = require('mongoose')
const cookieparser = require('cookie-parser')
const session = require('express-session')
const bodyparser = require('body-parser')
const passport = require('passport')
require('dotenv').config()
const passportSetUp = require('./helpers/passport')

const app = express();
app.use(express.json())
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no store');
    next();
});

// setting the view engine and public files
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'views')))
app.use(cookieparser())

// setting the routers in the userroute page
const userRouter = require('./routes/userRoute')
const adminRouter = require('./routes/adminRoute')

// connecting to mongodb
mongoose.connect(process.env.MONGOID)
.then(() => {
    console.log('connected to mongodb');
})
.catch(() => {
    console.error('an error occured');
});


app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
// middlewareusing
app.use('/', userRouter)
app.use('/', adminRouter)
app.use((req, res, next) => {
    res.status(404).render("user/404");
});

app.listen(process.env.PORT||3001, () => {
    console.log('server running in port 3001');
});
