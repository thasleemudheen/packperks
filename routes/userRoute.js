const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const bodyparser=require('body-parser')
const userAuth=require('../middleware/jwt_user')
const passport=require('passport')
const user = require('../models/users')
const {preventBack,disableCache}=require('../middleware/preventback')

router.use(bodyparser.urlencoded({extended:true}))
// app.use(preventCache);

// user routes

router.get('/',disableCache,userController.homePage)
router.get('/signup',disableCache,preventBack,userController.signUpPage)
router.post('/user/signup',preventBack,userController.signupPostpage)
router.get('/login',disableCache,preventBack,userController.loginPage)
router.post('/user/login',preventBack,userController.loginPostPage)
router.get('/logout',userController.logout)


router.get('/profile',userAuth,userController.profile)
router.post('/addAddress',userController.addAddressPage)
router.get('/editAddress/:id',userController.editAddressGet)
router.post('/editAddress/:id',userController.editAddressPost)
router.post('/deleteAddress/:id',userController.deleteAddress)



//forget password 
router.get('/loginWithOtp',disableCache,preventBack,userController.forgetPasswordGetPage)
router.post('/sendOtp',preventBack,userController.sendOtp)
router.post('/verifyOtp',preventBack,userController.verifyOtp)

router.get('/verifyOtpForSign',disableCache,preventBack,userController.signUpverifyPage)

router.post('/verify-otp',preventBack,userController.verifyOtpForSignup)


//google login authentication

router.get('/auth/google',passport.authenticate('google',{scope:['email','profile']}))

router.get('/google/callback',
passport.authenticate('google',{successRedirect:'/success',failureRedirect:'/failure'}))

router.get('/success',userController.successGoogleLogin)
router.get('/failure',userController.failureGoogleLogin)


router.get('/shop',userController.shopPage)
router.get('/singleProduct/:id',userController.singleProductPage)
router.get('/search/:inputValue',userController.searchForProducts)

router.get('/wishlist',userAuth,userController.wishListPage)
router.post('/addWishlist/:id',userController.productAddedToWishlist)
router.post('/removeWishlist/:id',userController.removeProductFromWishlist)

//cart page
router.get('/cart',userAuth,userController.cartPage)
router.post('/addToCart/:id',userController.addProductCart)
router.post('/removeFromCart/:id',userController.removeFromCart)
router.post('/quantityPlus/:id',userController.quantityPlus)
router.post('/quantityMinus/:id',userController.quantityMinus)


router.get('/checkOutPage',userController.checkOutGetPage)

router.get('/product/category/:categoryName',userController.showProductBasedOnCategory)

router.post('/couponApply',userController.applyCouponCode)

router.post('/order',userController.orderProduct)

router.get('/ordersGet',userController.ordersGetPage)

module.exports=router