const express=require('express')
const router=express.Router()
const userController=require('../controllers/userController')
const bodyparser=require('body-parser')
const userAuth=require('../middleware/jwt_user')
const passport=require('passport')
const user = require('../models/users')
const preventBack=require('../middleware/preventback')

router.use(bodyparser.urlencoded({extended:true}))
// app.use(preventCache);

// user routes

router.get('/',preventBack,userController.homePage)
router.get('/signup',preventBack,userController.signUpPage)
router.post('/user/signup',userController.signupPostpage)
router.get('/login',preventBack,userController.loginPage)
router.post('/user/login',userController.loginPostPage)
router.get('/logout',userController.logout)


router.get('/profile',userAuth,userController.profile)
router.post('/addAddress',userController.addAddressPage)
router.get('/editAddress/:id',userController.editAddressGet)
router.post('/editAddress/:id',userController.editAddressPost)
router.post('/deleteAddress/:id',userController.deleteAddress)



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
router.get('/search',userController.searchForProducts)

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

module.exports=router