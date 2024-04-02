const User=require('../models/users')
const Products=require('../models/products')
const bcrypt=require('bcryptjs')
const passport=require('passport')
const jwt=require('jsonwebtoken')
const cookieparser=require('cookie-parser')
require('dotenv').config()
const nodemailer=require('nodemailer')
const otpService=require('../service/otpservice')


let homePage=async(req,res)=>{
     try{
        let isAuthenticated
        const products=await Products.find()
       if(req.cookies.user_jwt){
        isAuthenticated = req.cookies.user_jwt

        return res.render('user/index',{isAuthenticated,products})
       }
       res.render('user/index',{isAuthenticated,products})
     }catch(error){
        console.log('home page is not found');
        res.status(400).send('home page not found')
     } 
}

// profile page
let profile = async (req, res) => {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    console.log(user,'getting the user details');
    if (!user) {
        return res.status(400).send('User not found');
    }
    res.render('user/profile', {user});
}

let logout= async (req,res) => {

    res.clearCookie('user_jwt')
    res.redirect('/')
}
// user signup page

let signUpPage=(req,res)=>{
    res.render('user/signUp',{passError:''})
}

let loginPage = (req, res) => {
    
    res.render('user/login',{passError:" "});
}



let loginPostPage = async (req, res) => {
    console.log('req.body:', req.body);

    // Get email and password from the request body
    const { email, password } = req.body;

    // Check if email and password are provided
    if (email && password) {
        try {
            // Find the user by email
            const user = await User.findOne({ email });
            // console.log(user,'user not found');

            if (!user) {
                return res.render('user/login', { passError: 'user not found' });
            }
            // Check if the user is blocked
            if (user.blocked) {
                console.log('This account has been restricted by the admin');
                return res.render('user/login', { passError: 'This account has been restricted by the admin' });
            }

            // Compare the password with the hashed password in the database
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    return res.status(500).send('Internal server error');
                }
                if (!result) {
                    return res.status(401).render('user/login', { passError: 'Wrong password' });
                }

                
                    // Generate JWT token
                    const token = jwt.sign({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    }, process.env.JWT_SECRET, {
                        expiresIn: '24h'
                    });
                
                    // Set the JWT token in a cookie
                    res.cookie('user_jwt', token, { httpOnly: true, maxAge: 86400000 });
                
                    console.log('User logged in successfully, token created');
                    // Use the replace method to prevent the user from going back to the login page
                    // res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.render('user/login', { successMessage: 'Logged in successfully' });
                    res.redirect('/');
                   
                         
             });
        } catch (error) {
            console.log('Error on login submit', error);
            res.status(500).send('Internal server error');
        }

    } else {
        // If email or password is not provided, render the login page with an error message
        res.render('user/login', { passError: 'Please provide email and password' });
    }
}


let signupPostpage = async (req, res) => {
    console.log(req.body);
    const { username, email, phonenumber, password, confirmpassword } = req.body;
    try {
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(400).render('user/signUp', { passError: 'User exists with this email' });
        }
        if (!password) {
            res.status(400).send('Password is empty');
        }
        
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, phonenumber, password: hashPassword });
        await newUser.save();
        // console.log(newUser);

        // Generate JWT token
        const token = jwt.sign({ userId: newUser._id }, 'Pack_perks', { expiresIn: '24h' });
        console.log(token,'token created successfully');


        // Set the token in a cookie
        res.cookie('token', token, { httpOnly: true, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });

        res.redirect('/login');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
}

// google authentication


let successGoogleLogin=async(req,res)=>{
     if(!req.user){
      return res.redirect('/failure')
     }
     console.log('google login email :',req.user.email);
      let user=await User.findOne({email:req.user.email})
        if(!user){
            user=new User({
                username:req.user.displayName,
                email:req.user.email
            })
            await user.save()
            console.log('user data saved');
           return res.redirect('/login')
    }
    // else{
    //     if(user.blocked)
    //     console.log('user is blocked');
    //     return res.render('user/login',{passError:'your account has been restricted by the admin'})
    // }
    console.log('login with google');
    const token=jwt.sign({
        id:user._id,
        name:user.username,
        email:user.email,
    },
    process.env.JWT_SECRET,
    {
        expiresIn:'24h',
    }
    );
    res.cookie('user_jwt',token,{httpOnly:true,maxAge:86400000})
    console.log('user logged in successfully: token created');
   return res.redirect('/')
}
let failureGoogleLogin=async(req,res)=>{
     res.send('error')
}

let forgetPasswordGetPage=async(req,res)=>{
    res.render('user/forgetPassword',{error:null})
}

let sendOtp=async(req,res)=>{
    const {email}=req.body
    console.log(email);
    const otp=otpService.generateOTP()
    
    try{
        const user = await User.findOne({email})
        if(!user){
           return res.render('user/forgetPassword',{error:'user not found with this email'})
        }
           await otpService.sendOTP(email,otp)
           console.log("otp send successfully");
           res.cookie('otp',otp.toString(),{maxAge:300000})

           return res.status(200).render('user/loginWithOtp',{email})
          
    }catch(error){
        console.error('there are some error in generating otp', error);
        res.status(500).send('Error sending OTP. Please try again.');
    }
}

let verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const user=await User.findOne({email})
    console.log("userwithotp",user);
    const storedOtp=req.cookies.otp
    console.log(storedOtp);
    try {
        if(storedOtp === otp){
            const token = jwt.sign({
                id: user._id,
                name: user.name,
                email: user.email,
            }, process.env.JWT_SECRET, {
                expiresIn: '24h'
            });
            res.cookie('user_jwt', token, { httpOnly: true, maxAge: 86400000 });
            res.redirect("/")
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send('Error verifying OTP. Please try again.');
    }
}


let shopPage=async(req,res)=>{
    let products=await Products.find()
    res.render('user/shop',{products})
}
let singleProductPage=async(req,res)=>{
    let productId=req.params.id
    let singleProduct=await Products.findById(productId)
    res.render('user/productDetails',{product:singleProduct})
}
let wishListPage=async(req,res)=>{
    res.render('user/wishlist')
}

let cartPage=async(req,res)=>{
    try {
        const token =req.cookies.user_jwt
        // console.log(token);
        if(!token){
           return res.redirect('/login')
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.redirect('/login');
        }
        const userId = decoded.id;
        // console.log('User ID:', userId)
        // console.log(decoded);
        
        const user=await User.findById(userId).populate('cart.product')
        // console.log(user);
        let cartTotal=0

        user.cart.product.forEach(item=>{
            item.total=item.quantity*item.productPrice
            cartTotal+=item.total

        //  console.log(item.productId)
            // console.log(item.total);
            // console.log(cartTotal);
        })
        
          res.render('user/cart-page',{user,cartTotal})
    } catch (error) {
        console.log('cart page not getting');
        res.status(400).send('internal server error')
    }
   
    
}

let addProductCart=async(req,res)=>{
    // console.log(productId);
   try {
    const token=req.cookies.user_jwt
    // console.log(token);
    if(!token){
        return res.redirect('/login')
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
    if(!decoded || !decoded.id){
        return res.redirect('/login')
    }
    const userId=decoded.id
    // console.log(userId);
    const user=await User.findById(userId)
    // console.log(user);
    if(!user){
        return res.status(400).send('user not found')
    }
    const productId=req.params.id
    // console.log(productId);
    const product = await Products.findById(productId)
    // console.log(product);


    if(!product){
        return res.status(400).send('product not found')
    }

    const existingItemIndex=user.cart.product.findIndex(item=>item.productId.toString()===productId)
    if(existingItemIndex!= -1){
        user.cart.product[existingItemIndex].quantity++;
    }else{
        user.cart.product.push({
            productId:productId,
            productImage:product.productImage,
            productName:product.productName,
            productPrice:product.productPrice,
            quantity:1

        })
        // Calculate cart total
        let cartTotal = user.cart.product.reduce((acc, item) => acc + (parseInt(item.productPrice) * parseInt(item.quantity)), 0);
        user.cart.total = cartTotal.toString();
        
    }
    await user.save()
    console.log("workingggg...");
     res.status(200).json({message:'product added to cart'})
  } catch (error) {
    console.log('product not added to the cart');
    res.status(500).send('internal server error')
  }
}

let removeFromCart=async(req,res)=>{
    try {
        const token=req.cookies.user_jwt
        console.log(token);
        if(!token){
           return res.redirect('/login')
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(!decoded || !decoded.id){
            return res.redirect('/login')
        }
        const userId=decoded.id
        const user=await User.findById(userId)
        console.log(user);
        if(!user){
            return res.status(400).send('user not found')
        }
        const productId=req.params.id
        console.log(productId);
        user.cart.product=user.cart.product.filter(item=>item.productId.toString()!==productId)

        // Recalculate cartTotal
        // user.cart.product = user.cart.product.filter(item => item.productId.toString() !== productId);
        let cartTotal = user.cart.product.reduce((acc, item) => acc + (parseInt(item.productPrice) * parseInt(item.quantity)), 0);
        user.cart.total = cartTotal.toString();

        await user.save()
         res.status(200).json({message:'product remove from the cart'})
        
    } catch (error) {
        console.log('not remove from the cart');
        res.status(500).send('product not remove from the cart')
    }
}
let quantityPlus=async(req,res)=>{
    try {
        const token = req.cookies.user_jwt;
        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.redirect('/login');
        }

        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).send('User not found');
        }
        const productId=req.params.id
        const cartItem=user.cart.product.find(item=>item.productId.toString()===productId)
        if(!cartItem){
            return res.status(400).send('product not found in the cart')
        }
         cartItem.quantity++;

         let cartTotal=user.cart.product.reduce((acc,item)=>acc+(parseInt(item.productPrice)*parseInt(item.quantity)),0)
         user.cart.total=cartTotal.toString()
         await user.save()
         res.status(200).json({message:'quantity increased successfully'})
     }catch (error) {
        console.log('failed to increase the quantity');
        res.status(500).send('failed to increase the quantity')
    }

}

let quantityMinus=async(req,res)=>{
    try {
        const token = req.cookies.user_jwt;
        if (!token) {
            return res.redirect('/login');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.redirect('/login');
        }

        const userId = decoded.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).send('User not found');
        }
        const productId=req.params.id
        const cartItem = user.cart.product.find(item => item.productId.toString() === productId);
        if (!cartItem) {
            return res.status(400).send('Product not found in the cart');
        }
        if(cartItem.quantity >1){
            cartItem.quantity--;
            let cartTotal=user.cart.product.reduce((acc,item)=>acc+(parseInt(item.productPrice)*parseInt(item.quantity)),0)
            user.cart.total=cartTotal.toString()
            await user.save()
            res.status(200).json({message:'quantity decreased successfully'})
        }else{
            res.status(400).send('quantity is not one')
        }
    } catch (error) {
        console.log('failedd to decrease the quantity');
        res.status(500).send('failed to decrease the quantity')
    }
}
module.exports={
    homePage,
    signUpPage,
    loginPage,
    signupPostpage,
    loginPostPage,
    profile,
    logout,
    successGoogleLogin,
    failureGoogleLogin,
    forgetPasswordGetPage,
    shopPage,
    singleProductPage,
    sendOtp,
    verifyOtp,
    wishListPage,
    cartPage,
    addProductCart,
    removeFromCart,
    quantityPlus,
    quantityMinus
}