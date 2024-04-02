const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const bodyparser=require('body-parser')
const userAuth=require('../middleware/jwt_user')
const passport=require('passport')
const user = require('../models/users')

router.use(bodyparser.urlencoded({extended:true}))

// user routes

router.get('/',userController.homePage)
router.get('/signup',userController.signUpPage)
router.post('/user/signup',userController.signupPostpage)
router.get('/login',userController.loginPage)
router.post('/user/login',userController.loginPostPage)
router.get('/profile',userAuth,userController.profile)
router.get('/logout',userController.logout)

//forget password 
router.get('/loginWithOtp',userController.forgetPasswordGetPage)
router.post('/sendOtp',userController.sendOtp)
router.post('/verifyOtp',userController.verifyOtp)


//google login authentication

router.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))

router.get('/google/callback',
passport.authenticate('google',{successRedirect:'/success',failureRedirect:'/failure'}))

router.get('/success',userController.successGoogleLogin)
router.get('/failure',userController.failureGoogleLogin)


router.get('/shop',userController.shopPage)
router.get('/singleProduct/:id',userController.singleProductPage)

router.get('/wishlist',userController.wishListPage)

//cart page
router.get('/cart',userController.cartPage)
router.post('/addToCart/:id',userController.addProductCart)
router.post('/removeFromCart/:id',userController.removeFromCart)
router.post('/quantityPlus/:id',userController.quantityPlus)
router.post('/quantityMinus/:id',userController.quantityMinus)

module.exports=router