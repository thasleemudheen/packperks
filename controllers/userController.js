const User=require('../models/users')
const Products=require('../models/products')
const Admin=require('../models/admin')
const bcrypt=require('bcryptjs')
const passport=require('passport')
const jwt=require('jsonwebtoken')
const cookieparser=require('cookie-parser')
require('dotenv').config()
const nodemailer=require('nodemailer')
const otpService=require('../service/otpservice')
const mongoose=require('mongoose')
const generatePDF = require('../helpers/generatePDF');
const puppeteer=require('puppeteer')
const razorpay=require('../helpers/razorpay')
const ejs=require('ejs')
const path = require('path'); // Make sure to import the path module
const fs = require('fs');

const Razorpay = require('razorpay');
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});



let homePage = async (req, res) => {
    try {
        let isAuthenticated = false;
        let wishlist;
        const products = await Products.find().sort({ createdAt: -1 }).limit(8);
             let cartLength;
        let categoryName=await Products.distinct('categoryName')
        let product=await Products.find()

        if (req.cookies.user_jwt) {
            isAuthenticated = true;
            const token = req.cookies.user_jwt;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;
            const user = await User.findById(userId);

            wishlist = await User.findById(userId, 'wishlist').populate('wishlist');

         cartLength = user.cart ? user.cart.product.length : 0;
    
        }

        res.render('user/index', { isAuthenticated, products, user: req.user, wishlist,categoryName,product,cartLength });
    } catch (error) {
        console.error('Home page is not found' , error);
        res.status(400).send('Home page not found');
    }
}

let profile = async (req, res) => {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    if (!user) {
        return res.status(400).send('User not found');
    }
    let orders = user.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

      let allProducts=[]

      orders.forEach(order=>{
        order.products.forEach(product=>{
            allProducts.push(product)

        })
      })
    res.render('user/profile', {user,orders,allProducts});
}

let addAddressPage=async(req,res)=>{
    try {

        if (req.headers.referer) {
            const refererUrl = new URL(req.headers.referer);
            const pathName = refererUrl.pathname;
    
            if (pathName === '/profile') {
                res.redirect('/profile');
            } else if (pathName === '/checkOutPage') {
                res.redirect('/checkOutPage');
            } else {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
            let {name,houseNumber,city,street,pincode,phoneNumber}=req.body

            let token =req.cookies.user_jwt
            let decoded=jwt.verify(token,process.env.JWT_SECRET)
            let userId=decoded.id
            let user=await User.findById(userId)

            if (user.address.length >= 3) {
                return res.status(400).send('maximum limit is reached');
              }

            user.address.push({
                name:name,
                houseNumber:houseNumber,
                city:city,
                street:street,
                pincode:pincode,
               phonenumber:phoneNumber
            })
            await user.save()
            console.log('new address saved')
            res.status(200)
        
    } catch (error) {
        console.log('the user address not saved ')
        console.error(error)
        res.status(400).send('user address not saved')
    }
}

let editAddressGet=async(req,res)=>{

    let token=req.cookies.user_jwt
     
    let decoded=jwt.verify(token,process.env.JWT_SECRET)
    let userId=decoded.id
    let user=await User.findById(userId)
    let userIdToEdit=req.params.id
    let address = user.address.find(addr => addr._id.toString() === userIdToEdit);
     
    res.render('user/editAddress',{address:address})
}

let editAddressPost=async(req,res)=>{

    try {
        let token =req.cookies.user_jwt
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        let user=await User.findById(userId)
    
        let userIndex=user.address.findIndex(addr=>addr._id.toString()===req.params.id)
        console.log(userIndex);
        if(userIndex===-1){
            return res.status(404).send('address not found')
    
        }
 
    user.address[userIndex].name=req.body.name
    user.address[userIndex].houseNumber=req.body.houseNumber
    user.address[userIndex].street=req.body.street
    user.address[userIndex].city=req.body.city
    user.address[userIndex].pincode=req.body.pincode
    user.address[userIndex].phonenumber=req.body.phonenumber
    
    console.log(user.address[userIndex].name=req.body.name);
    console.log(user.address[userIndex].houseNumber=req.body.houseNumber);
    console.log(user.address[userIndex].street=req.body.street);
    console.log(user.address[userIndex].city=req.body.city);
    console.log(user.address[userIndex].pincode=req.body.pincode);
    console.log(user.address[userIndex].phonenumber=req.body.phonenumber);

       await user.save()            
        res.redirect('/profile')
    } catch (error) {
        res.status(500).send('internal server error')
    }
   
}

let deleteAddress=async(req,res)=>{
     try {
        let token=req.cookies.user_jwt
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        let user=await User.findById(userId)

        let userIndex=user.address.findIndex(addr=>addr._id.toString()===req.params.id)

    if(userIndex===-1){
        return res.status(404).send('address not found')
    }
    user.address.splice(userIndex,1)
    await user.save()
    res.redirect('/profile')
     } catch (error) {
        res.status(500).send('internal server error')
     }
}

let logout= async (req,res) => {

     res.clearCookie('user_jwt')
     res.redirect('/')
}

let signUpPage=(req,res)=>{
    res.render('user/signUp',{passError:''})
}

let loginPage = (req, res) => {
    
    res.render('user/login',{passError:" "});
}

let loginPostPage = async (req, res) => {
    const { email, password } = req.body;

    if (email && password) {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                return res.render('user/login', { passError: 'user not found' });
            }
            if (user.blocked) {
                console.log('This account has been restricted by the admin');
                return res.render('user/login', { passError: 'This account has been restricted by the admin' });
            }

            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                    return res.status(500).send('Internal server error');
                }
                if (!result) {
                    return res.status(401).render('user/login', { passError: 'Wrong password' });
                }
                        const token = jwt.sign({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    }, process.env.JWT_SECRET, {
                        expiresIn: '24h'
                    });
                    res.cookie('user_jwt', token, { httpOnly: true, maxAge: 86400000 });
                
                    console.log('User logged in successfully, token created');
                    res.redirect('/');           
             });
        } catch (error) {
            console.log('Error on login submit', error);
            res.status(500).send('Internal server error');
        }

    } else {
        res.render('user/login', { passError: 'Please provide email and password' });
    }
}

let signupPostpage = async (req, res) => {
    const { username, email, phonenumber, password, confirmpassword } = req.body;
    try {
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(400).render('user/signUp', { passError: 'User exists with this email' });
        }
        if (!password) {
            res.status(400).send('Password is empty');
        }
        const otp=otpService.generateOTP()
        await otpService.sendOTP(email,otp)
        req.session.userDetails={username,email,phonenumber,password,confirmpassword}
        res.cookie('otp',otp,{httpOnly:true,expires:new Date(Date.now()+5*60*1000)})
    
        res.redirect(`/verifyOtpForSign?email=${encodeURIComponent(email)}`);
    } catch (error) {
        res.status(500).send('Internal server error');
    }
}

let signUpverifyPage=async(req,res)=>{
    const {username,email,phonenumber,password,confirmpassword}=req.session.userDetails || {}
    res.render('user/verifyOtp',{email,username,phonenumber,password,confirmpassword})
}

let verifyOtpForSignup=async(req,res)=>{
    const {username,email,phonenumber,password,otp}=req.body
    console.log(req.body)
    
    if(!username ){
        return res.status(400).send('username is invalid')
    }
    try{
        const storedOTP=req.cookies.otp

        if(!storedOTP || storedOTP !== otp){
            return res.status(400).send('invalid otp . please try again')
        }
          res.clearCookie('otp')
        const hashPassword=await bcrypt.hash(password,10)
        const newUser=new User({username,email,phonenumber,password:hashPassword})
        await newUser.save()
        const token=jwt.sign({userId:newUser._id},'Pack_perks',{expiresIn:'24h'})

        res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+24*60*60*1000)})
        res.redirect('/login')
    }catch(error){
        console.error(error)
        res.status(500).send('internal server error')
    }
}
let successGoogleLogin = async (req, res) => {
    if (!req.user) {
        return res.redirect('/failure');
    }

    let user = await User.findOne({ email: req.user.email });

    if (!user) {
        user = new User({
            username: req.user.displayName,
            email: req.user.email
        });
        await user.save();
        console.log('user data saved');
    }


    console.log('login with google');
    const token = jwt.sign({
        id: user._id,
        name: user.username,
        email: user.email,
    },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h',
        }
    );
      res.cookie('user_jwt', token, { httpOnly: true, maxAge: 86400000 });
    console.log('user logged in successfully: token created');
     res.redirect('/');
     console.log('not redirecting to the home page');
};


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

let shopPage = async (req, res) => {
    try {
        let token = req.cookies.user_jwt;
        let user = null;
        let cartLength = 0;

        if (token) {
            try {
                let decoded = jwt.verify(token, process.env.JWT_SECRET);
                let userId = decoded.id;
                user = await User.findById(userId);

                if (user && user.cart) {
                    cartLength = user.cart.product.length;
                }
            } catch (err) {
                console.error('JWT verification error:', err);
            }
        }

        const PAGE_SIZE = 9;
        let page = parseInt(req.query.page) || 1;
        let skip = (page - 1) * PAGE_SIZE;

        let products = await Products.find().skip(skip).limit(PAGE_SIZE);
        let totalProducts = await Products.countDocuments();
        let totalPages = Math.ceil(totalProducts / PAGE_SIZE);

        let categoryName = await Products.distinct('categoryName');
        let brands = await Products.distinct('brand');

        let sortBy = req.query.sortBy || 'select';

        res.render('user/shop', { 
            products, 
            user, 
            categoryName, 
            brands, 
            currentPage: page, 
            totalPages, 
            sortBy, 
            cartLength 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
let singleProductPage = async (req, res) => {
    let productId = req.params.id;

    try {
        let token = req.cookies.user_jwt;
        let user = null;
        let cartLength = 0;

        if (token) {
            try {
                let decoded = jwt.verify(token, process.env.JWT_SECRET);
                let userId = decoded.id;
                user = await User.findById(userId);

                if (user && user.cart) {
                    cartLength = user.cart.product.length;
                }
            } catch (err) {
                console.error('JWT verification error:', err);
            }
        }

        let singleProduct = await Products.findById(productId);
        let wishlist = user ? await User.find({ _id: user._id, "wishlist.product": productId }) : [];

        res.render('user/productDetails', { 
            product: singleProduct, 
            wishlist: wishlist, 
            cartLength: cartLength, 
            user: user 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

let cartPage=async(req,res)=>{
    try {
        const token =req.cookies.user_jwt
        if(!token){
           return res.redirect('/login')
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.redirect('/login');
        }
        const userId = decoded.id;
        
        const user=await User.findById(userId).populate('cart.product')
        let cartTotal=0

        user.cart.product.forEach(item=>{
            item.total=item.quantity*item.productPrice
            cartTotal+=item.total

        })
        
          res.render('user/cart-page',{user,cartTotal})
    } catch (error) {
        console.log('cart page not getting');
        res.status(400).send('internal server error')
    }
    
}

let addProductCart=async(req,res)=>{
   try {
    const token=req.cookies.user_jwt
    if(!token){
        return res.status(202).json({message:'please login'})
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET)
    console.log(decoded);
    if(!decoded || !decoded.id){
        return res.redirect('/login')
    }
    const userId=decoded.id
    const user=await User.findById(userId)
    if(!user){
        return res.status(400).send('user not found')
    }
    const productId=req.params.id
    const product = await Products.findById(productId)

    if(!product){
        return res.status(400).send('product not found')
    }

    const existingItemIndex=user.cart.product.findIndex(item=>item.productId.toString()===productId)
    if(existingItemIndex!= -1){
        if (user.cart.product[existingItemIndex].quantity >= product.stockQuantity) {
            return res.status(400).send('Cannot add more of this product to cart, stock quantity exceeded')
        }
        user.cart.product[existingItemIndex].quantity++;
    }else{
        user.cart.product.push({
            productId:productId,
            productImage:product.productImage,
            productName:product.productName,
            productPrice:product.productPrice,
            quantity:1

        })
        let cartTotal = user.cart.product.reduce((acc, item) => acc + (parseInt(item.productPrice) * parseInt(item.quantity)), 0);
        user.cart.total = cartTotal.toString();
        
    }
    await user.save()
     res.status(200).json({message:'product added to cart'})
  } catch (error) {
    console.log('product not added to the cart');
    res.status(500).send('internal server error')
  }
}

let removeFromCart=async(req,res)=>{
    try {
        const token=req.cookies.user_jwt
        if(!token){
           return res.redirect('/login')
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(!decoded || !decoded.id){
            return res.redirect('/login')
        }
        const userId=decoded.id
        const user=await User.findById(userId)
        if(!user){
            return res.status(400).send('user not found')
        }
        const productId=req.params.id
        user.cart.product=user.cart.product.filter(item=>item.productId.toString()!==productId)
        let cartTotal = user.cart.product.reduce((acc, item) => acc + (parseInt(item.productPrice) * parseInt(item.quantity)), 0);
        user.cart.total = cartTotal.toString();

        await user.save()
         res.status(200).json({message:'product remove from the cart',cartTotal})
        
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
        const product = await Products.findById(productId);
        if (!product) {
            return res.status(400).send('Product not found')
        }

        if (cartItem.quantity >= product.stockQuantity) {
            return res.status(400).json({message:'Cannot increase quantity'})
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

let wishListPage=async(req,res)=>{
    try {
        let token=req.cookies.user_jwt
        if(!token){
            return res.redirect('/login')
        }
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        if(!userId){
            return res.status(400).send('user not found')
        }
        let user=await User.findById(userId)
       const wishlistData=user.wishlist.map(item=>({
        productId:item.productId,
        productImage:item.productImage,
        productName:item.productName,
        productPrice:item.productPrice
       }))       
        res.render('user/wishlist',{wishlist:wishlistData})
    } catch (error) {
        console.log('wishlist page not getting');
        res.status(400).send('wishlist not get')
    }
    
}

let productAddedToWishlist=async(req,res)=>{
       try {
        const token=req.cookies.user_jwt        
        if(!token){
            return res.status(202).json({message:'please login'})
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        // console.log("decodeddd",decoded)
        const userId=decoded.id
        const user=await User.findById(userId)

        const productId=req.params.id

        const product=await Products.findById(productId)

        const existingProductIndex = user.wishlist.findIndex(item => item.productId.toString() === productId);
        if (existingProductIndex !== -1) {
            user.wishlist=user.wishlist.filter(item=>item.productId.toString()!==productId)
           await user.save()
           return res.status(201).json({message:'product removed from the wishlist'})
        }
        

        user.wishlist.push({
            productId:product._id,
            productImage:product.productImage,
            productName:product.productName,
            productPrice:product.productPrice
        })

        await user.save()
        console.log("added to wishlist")
        res.status(200).json({message:'product added to the wishlist'})

       } catch (error) {
        console.log('product not added to wishlist');
        res.status(400).send('something went wrong')
        
       }
}
 let removeProductFromWishlist=async(req,res)=>{
    console.log('product remove route working')
    try {
        const token=req.cookies.user_jwt
        if(!token){
            return res.redirect('/login')
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const userId=decoded.id
        const user=await User.findById(userId)
        const productId=req.params.id
        user.wishlist=user.wishlist.filter(item=>item.productId.toString()!==productId)
        await user.save()
        res.status(200).json({message:'product removed from the wishlist'})
        
    } catch (error) {
        console.log('product not removed from the wishlist');
        res.status(500).send('internal server error')
    }
 }

 let checkOutGetPage=async(req,res)=>{
    try {

        let token=req.cookies.user_jwt
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        let user=await User.findById(userId)

        let admin=await Admin.findOne()
        let coupon=admin.coupon

        let discountedPrice=0

        let address=user.address
        let cart = user.cart.product
         let productId=cart.map(item=>item.productId)

          let validCart = [];
          let cartTotal=0

        for (let item of cart) {
            let product = await Products.findById(item.productId);
            if (!product.isDisabled && product.stockQuantity > 0) {
                validCart.push(item);
                cartTotal += item.productPrice * item.quantity;
                discountedPrice += (item.productPrice - (item.productPrice * coupon.discount / 100)) * item.quantity;

            }
        }

        res.render('user/checkout',{user:user,address:address,cart:validCart,cartTotal,coupon:coupon,discountedPrice})
    } catch (error) {
        
    }
    
 }

 let searchForProducts=async(req,res)=>{
    const query=req.params.inputValue
    if(!query){
        return res.status(400).json({message:'search query is required'})
    }
    try {
        const productsSearch=await Products.find({
            $or:[
                {productName:{$regex:query,$options:'i'}},
                {brand:{$regex:query,$options:'i'}},
                {categoryName:{$regex:query,$options:'i'}}
            ]
        })
   
       let token=req.cookies.user_jwt
       let user=null
       if(token){
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
         user=await User.findById(userId)
 
       }
       
       
        res.status(200).json({message:'productsSearch',productsSearch,user})
       
    } catch (error) {
        console.error(error)
        res.status(500).send('internal server error')
        
    }

 }


 let applyCouponCode=async(req,res)=>{
           const {couponId,totalValue}=req.body
 
           try{
            const admin=await Admin.findOne()

            
            const token=req.cookies.user_jwt
            const decode=jwt.verify(token,process.env.JWT_SECRET)
            const userId=decode.id
            const user=await User.findById(userId)
         const coupon = admin.coupon.find(coupon=>coupon._id.toString()===couponId)

         if (!coupon) {
             return res.status(404).json({ error: "Coupon not found" });
         }

        if (!coupon || coupon.couponStatus === 'inactive' || new Date(coupon.endDate) < Date.now()) {
            return res.status(400).json({ error: 'Coupon is not valid' });
        }
         let discountedPrice=0;
        
         if(coupon.couponType==='fixedAmount'){
             discountedPrice=totalValue-coupon.discountValue
             discountValue=coupon.discountValue
             return res.status(200).json({message:'coupon applied ',discountedPrice:discountedPrice,discountValue})
         }else if(coupon.couponType==='percentage'){
             discountedPrice=totalValue- totalValue*coupon.discountValue/100;
             discountValue=totalValue*coupon.discountValue/100
            return res.status(200).json({message:'coupon applied',discountedPrice:discountedPrice,discountValue})
         }
    
           }catch(error){
            res.status(500).send('internal server error')
            console.error(error)
           }
          
 }

 let orderProduct=async(req,res)=>{
    const { addressId, paymentMethod, orderTotal, products,wihtOutDiscount } = req.body;
try {
    let token=req.cookies.user_jwt
    let decoded=jwt.verify(token,process.env.JWT_SECRET)
    let userId=decoded.id
    let user=await User.findById(userId)
   

    let address=user.address.find(addr=>addr._id.toString()===addressId)
    if(!address){
     return res.status(400).send('address not found')
    }
    let orderDate=new Date()
    let deliveryDate=new Date(orderDate)
    deliveryDate.setDate(deliveryDate.getDate()+4)
    let productIds=products.map(product=>product.productId)
    let productDetails=[]
   
    for(let i=0;i<productIds.length;i++){
        let cartProduct = user.cart.product.find(cartItem => cartItem.productId.toString() === productIds[i])
        if(!cartProduct){
            return res.status(400).send('product not found')
             }
        let productDetail = await Products.findById(cartProduct.productId);
        if (!productDetail) {
            return res.status(400).send(`Product details for ID ${productIds[i]} not found`);
        }
            productDetails.push({
                productId:cartProduct.productId,
                productName:cartProduct.productName,
                productPrice:cartProduct.productPrice,
                productImage:cartProduct.productImage,
                categoryName:productDetail.categoryName,
                quantity:cartProduct.quantity,
                orderStatus:'pending',
                cancelReason:null
            })
        
    }

    let newOrder={
      orderId:new mongoose.Types.ObjectId(),
      orderDate:orderDate,
      totalAmount:orderTotal,
      products:productDetails,
      shippingAddress:{
          name:address.name,
          houseNumber:address.houseNumber,
          city:address.city,
          street:address.street,
          pincode:address.pincode,
          phonenumber:address.phonenumber,
      },
      paymentMethod,
      expectedDelivery:deliveryDate,
      wihtOutDiscount, 
    }
    user.orders.push(newOrder)
    user.cart.product = []; 

    await user.save()
    for (let i = 0; i < productIds.length; i++) {
        await Products.updateOne(
            { _id: productIds[i] },
            { $inc: { stockQuantity: -products[i].quantity } }
        );
    }
    res.status(200).json({message:'order placed successfully ', newOrder:newOrder})
} catch (error) {
    console.error(error)
    res.status(500).send('order not placed')
}

 }

 let razorpayPayment=async(req,res)=>{
    const { orderTotal } = req.body;

    try {
        const options = {
            amount: orderTotal * 100, 
            currency: 'INR',
            receipt: 'orderId'
        };

        instance.orders.create(options, function (err, order) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(200).json({ razorpayResponse: order,key_id: process.env.RAZORPAY_ID });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

 }

 let ordersGetPage=async(req,res)=>{
      let token=req.cookies.user_jwt
      let decoded=jwt.verify(token,process.env.JWT_SECRET)
      let userId=decoded.id
      let user=await User.findById(userId)
      
      let orders = user.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
 
    res.render('user/orders',{orders})
 }
 let cancelOrder = async (req, res) => {
    const { orderId, productId, cancelReason } = req.body;
    let token = req.cookies.user_jwt;
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    let userId = decoded.id;

    try {
        let user = await User.findById(userId);
        let order = user.orders.id(orderId);
        if (!order) {
            return res.status(400).send('Order not found');
        }

        let product = order.products.id(productId);
        if (!product) {
            return res.status(400).send('Product not found in order');
        }

        order.totalAmount -= product.productPrice;
        order.wihtOutDiscount -= product.productPrice;
        product.orderStatus = 'cancelled';
        product.cancelReason = cancelReason;

        let prdId = product.productId;
        let findProduct = await Products.findById(prdId);
        findProduct.stockQuantity += product.quantity;
        await findProduct.save();

        await user.save();
        console.log('Order cancelled successfully');

        if (req.headers.referer) {
            const refererUrl = new URL(req.headers.referer);
            const pathName = refererUrl.pathname;

            if (pathName === '/profile') {
                return res.redirect('/profile');
            } else if (pathName === '/ordersGet') {
                return res.redirect('/ordersGet');
            }
        }
        res.redirect('/');

    } catch (error) {
        console.error(error);
        res.status(500).send('Order not cancelled');
    }
}
let sortAndFilter = async (req, res) => {
    let { search, sortBy, category, brand, page = 1 } = req.query;
    const PAGE_SIZE = 9;
    let skip = (page - 1) * PAGE_SIZE;

    try {
        const token = req.cookies.user_jwt;
        let user = null;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;
            user = await User.findById(userId);
        }

        let query = {};
        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { categoryName: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.categoryName = category;
        }

        if (brand) {
            query.brand = brand;
        }

        let sortQuery = {};
        switch (sortBy) {
            case 'priceLowToHigh':
                sortQuery = { productPrice: 1 };
                break;
            case 'priceHighToLow':
                sortQuery = { productPrice: -1 };
                break;
            case 'nameAtoZ':
                sortQuery = { productName: 1 };
                break;
            case 'nameZtoA':
                sortQuery = { productName: -1 };
                break;
            default:
                sortQuery = {};
        }

        let products = await Products.find(query).sort(sortQuery).skip(skip).limit(PAGE_SIZE);
        let totalProducts = await Products.countDocuments(query);
        let totalPages = Math.ceil(totalProducts / PAGE_SIZE);

        res.status(200).json({ products, user, currentPage: page, totalPages });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

let getOrderInvoice = async (req, res) => {
    const { orderId, productId } = req.body;
  
    try {
      const token = req.cookies.user_jwt;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      const user = await User.findOne({ _id: userId, 'orders._id': orderId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const order = user.orders.find(order => order._id.toString() === orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
  
      const product = order.products.find(product => product.productId.toString() === productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found in the order' });
      }
  
      if (product.orderStatus !== 'delivered') {
        return res.status(400).send('Cannot download invoice for products with status other than "delivered"');
      }
  
      // Create HTML content for the specified product details
      const templatePath = path.join(__dirname, '..', 'views', 'user', 'invoice.ejs');
      const invoiceHtml = await ejs.renderFile(templatePath, { order, user,product });
    //   console.log(invoiceHtml)

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // console.log(browser)

        const page = await browser.newPage();
        await page.setContent(invoiceHtml);

        // Generate PDF from HTML
        const pdfBuffer = await page.pdf({ format: 'A4' });
        // console.log(pdfBuffer)

        await browser.close();

        // Set response headers to trigger download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
      console.error('Error generating PDF:', err);
      res.status(500).send('Error generating invoice');
    }
  };
  


//  let getOrderInvoice = async (req, res) => {
//     const { orderId, productId } = req.body;
//     // console.log(productId)
//     try {
//         const token = req.cookies.user_jwt;
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const userId = decoded.id;
        
//         const user = await User.findOne({ _id: userId, 'orders._id': orderId });
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const order = user.orders.find(order => order._id.toString() === orderId);
//         if (!order) {
//             return res.status(404).json({ message: "Order not found" });
//         }
//         // console.log(order)
//         const product = order.products.find(product => product.productId.toString() === productId);
//         if (!product) {
//             return res.status(404).json({ message: "Product not found in the order" });
//         }
//         if (product.orderStatus !== 'delivered') {
//             return res.status(400).send('Cannot download invoice for products with status other than "delivered"');
//         }
        
//  ejs.renderFile('views/user/invoice.ejs', { order,product }, (err, html) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send('Error rendering the invoice');
//             }
//             pdf.create(html,{ timeout: 10000 }).toBuffer((err, buffer) => {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).send('Error generating PDF');
//                 }

//                 res.setHeader('Content-Type', 'application/pdf');
//                 res.setHeader('Content-Disposition', 'attachment; filename=order_summary.pdf');
//                 res.send(buffer);
//             });
//         });
//         console.log('before')
       
//     } catch (error) {
//         console.error(error);
//         res.status(400).send('Failed to download PDF');
//     }
// };



let editProfilePost=async(req,res)=>{
    console.log(req.body)
    const {editname,editemail,editnumber}=req.body
    try {
         const token=req.cookies.user_jwt
         const decoded=jwt.verify(token,process.env.JWT_SECRET)
         const userId=decoded.id
         const user = await User.findByIdAndUpdate(userId, {
            username: editname,
            email: editemail,
            phonenumber: editnumber
        }, { new: true });

        res.status(200).json(user)

    } catch (error) {
        console.log(error)
        res.status(500).send('failed to update the user detials')
    }
}

let aboutPage=async(req,res)=>{
    res.render('user/about')
}

let contactPage=async(req,res)=>{
    res.render('user/contact')
}

let contactFormSubmitted=async(req,res)=>{
         console.log(req.body)
         const{name,email,subject,message}=req.body
        try {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'packperks45@gmail.com',
                    pass:  'shwe ksot eoqy kluv'
                }
            });

            let mailOptions = {
                from: email,
                to:'packperks45@gmail.com' ,
                subject: `Contact Form Submission: ${subject}`,
                text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    res.status(500).send('Something went wrong.');
                } else {
                    console.log('Email sent: ' + info.response);
                    res.status(200).json({message:'contact form submitted successfully'});
                }
            });
        } catch (error) {
            console.log(error,'error submitting the response from the user')
            res.status(400).send('something went wrong ')
        }
       
}



module.exports={
    homePage,
    signUpPage,
    loginPage,
    signupPostpage,
    verifyOtpForSignup,
    signUpverifyPage,
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
    cartPage,
    addProductCart,
    removeFromCart,
    quantityPlus,
    quantityMinus,
    wishListPage,
    productAddedToWishlist,
    removeProductFromWishlist,
    checkOutGetPage,
    addAddressPage,
    editAddressGet,
    editAddressPost,
    deleteAddress,
    searchForProducts,
    applyCouponCode,
    orderProduct,
    ordersGetPage,
    cancelOrder,
    razorpayPayment,
    getOrderInvoice,
    editProfilePost,
    aboutPage,
    contactPage,
    contactFormSubmitted,
    sortAndFilter

}