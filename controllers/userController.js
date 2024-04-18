const User=require('../models/users')
const Products=require('../models/products')
const bcrypt=require('bcryptjs')
const passport=require('passport')
const jwt=require('jsonwebtoken')
const cookieparser=require('cookie-parser')
require('dotenv').config()
const nodemailer=require('nodemailer')
const otpService=require('../service/otpservice')

let homePage = async (req, res) => {
    try {
        let isAuthenticated = false;
        let wishlistProducts = [];

        const products = await Products.find().sort({ createdAt: -1 }).limit(8);

        if (req.cookies.user_jwt) {
            isAuthenticated = true;
            const token = req.cookies.user_jwt;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;
            const user = await User.findById(userId);

            wishlistProducts = await User.findById(userId, 'wishlist').populate('wishlist').lean();
        }

        res.render('user/index', { isAuthenticated, products, user: req.user, wishlistProducts });

    } catch (error) {
        console.log('Home page is not found');
        res.status(400).send('Home page not found');
    }
}


// profile page
let profile = async (req, res) => {
    let userId = req.user.id;
    let user = await User.findOne({ _id: userId });
    // console.log(userId);
    // console.log(user,'getting the user details');
    if (!user) {
        return res.status(400).send('User not found');
    }
    res.render('user/profile', {user});
}

let addAddressPage=async(req,res)=>{
    try {

        if (req.headers.referer) {
            const refererUrl = new URL(req.headers.referer);
            const pathName = refererUrl.pathname;
    
            // Redirect based on the referer
            if (pathName === '/profile') {
                res.redirect('/profile');
            } else if (pathName === '/checkOutPage') {
                res.redirect('/checkOutPage');
            } else {
                // Default redirection if referer is unknown
                res.redirect('/');
            }
        } else {
            // Default redirection if no referer
            res.redirect('/');
        }
            let {name,houseNumber,city,street,pincode,phoneNumber}=req.body

            let token =req.cookies.user_jwt
            let decoded=jwt.verify(token,process.env.JWT_SECRET)
            let userId=decoded.id
            let user=await User.findById(userId)

            user.address.push({
                name:name,
                houseNumber:houseNumber,
                city:city,
                street:street,
                pincode:pincode,
               phonenumber:phoneNumber
            })
            console.log('details are here');
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
    // console.log(userIdToEdit);
    let address = user.address.find(addr => addr._id.toString() === userIdToEdit);
        // console.log(address);
     
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
    //    let updateAddress=req.body
    //    console.log(updateAddress);
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
            // Save the updated user object
            
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
// user signup page

let signUpPage=(req,res)=>{
    res.render('user/signUp',{passError:''})
}

let loginPage = (req, res) => {
    
    res.render('user/login',{passError:" "});
}



let loginPostPage = async (req, res) => {
    // console.log('req.body:', req.body);

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
                    // res.render('user/login', { successMessage: 'Logged in successfully' });
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
    // console.log(req.body);
    const { username, email, phonenumber, password, confirmpassword } = req.body;
    try {
        const userExist = await User.findOne({ email: email });
        if (userExist) {
            return res.status(400).render('user/signUp', { passError: 'User exists with this email' });
        }
        if (!password) {
            res.status(400).send('Password is empty');
        }
        //generate otp for signup

        const otp=otpService.generateOTP()

        //send otp to the users mail adddress

        await otpService.sendOTP(email,otp)

        req.session.userDetails={username,email,phonenumber,password,confirmpassword}

        // otpService.otpMap.set(email,otp)
        res.cookie('otp',otp,{httpOnly:true,expires:new Date(Date.now()+5*60*1000)})

        // const hashPassword = await bcrypt.hash(password, 10);
        // const newUser = new User({ username, email, phonenumber, password: hashPassword });
        // await newUser.save();
        // console.log(newUser);

    
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
        // const newUser=await User.findOne({email:email})
        console.log('password before hashing',password)
        const hashPassword=await bcrypt.hash(password,10)
        console.log(hashPassword)
        const newUser=new User({username,email,phonenumber,password:hashPassword})
        console.log(newUser)
        await newUser.save()
        const token=jwt.sign({userId:newUser._id},'Pack_perks',{expiresIn:'24h'})

        res.cookie('token',token,{httpOnly:true,expires:new Date(Date.now()+24*60*60*1000)})
        res.redirect('/')
    }catch(error){
        console.error(error)
        res.status(500).send('internal server error')
    }
}



// google authentication
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



// let successGoogleLogin=async(req,res)=>{
//      if(!req.user){
//       return res.redirect('/failure')
//      }
//     //  console.log('google login email :',req.user.email);
//       let user=await User.findOne({email:req.user.email})
//         if(!user){
//             user=new User({
//                 username:req.user.displayName,
//                 email:req.user.email
//             })
//             await user.save()
//             console.log('user data saved');
//            return res.redirect('/login')
//     }
//     // else{
//     //     if(user.blocked)
//     //     console.log('user is blocked');
//     //     return res.render('user/login',{passError:'your account has been restricted by the admin'})
//     // }
//     console.log('login with google');
//     const token=jwt.sign({
//         id:user._id,
//         name:user.username,
//         email:user.email,
//     },
//     process.env.JWT_SECRET,
//     {
//         expiresIn:'24h',
//     }
//     );
//     res.cookie('user_jwt',token,{httpOnly:true,maxAge:86400000})
//     console.log('user logged in successfully: token created');
//    return res.redirect('/')
// }


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
    // console.log("userwithotp",user);
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
    
    try{
    let token=req.cookies.user_jwt
    let user=null
    if(token){
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        user=await User.findById(userId)
    }
   
    let products=await Products.find()

        res.render('user/shop',{products,user})
    }catch(error){
        console.error(error)
        res.status(500).send('internal server error')
    }
   

}


let singleProductPage=async(req,res)=>{
    let productId=req.params.id
    let singleProduct=await Products.findById(productId)
    let wishlist=await User.find(singleProduct)
    // console.log(wishlist);
    res.render('user/productDetails',{product:singleProduct,wishlist:wishlist})
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
    console.log(decoded);
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
    // console.log("workingggg...");
     res.status(200).json({message:'product added to cart'})
  } catch (error) {
    console.log('product not added to the cart');
    res.status(500).send('internal server error')
  }
}

let removeFromCart=async(req,res)=>{
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
        const user=await User.findById(userId)
        // console.log(user);
        if(!user){
            return res.status(400).send('user not found')
        }
        const productId=req.params.id
        // console.log(productId);
        user.cart.product=user.cart.product.filter(item=>item.productId.toString()!==productId)

        // Recalculate cartTotal
        // user.cart.product = user.cart.product.filter(item => item.productId.toString() !== productId);
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
        // console.log(token);
        let decoded=jwt.verify(token,process.env.JWT_SECRET)
        let userId=decoded.id
        if(!userId){
            return res.status(400).send('user not found')
        }
        // console.log(userId);
        let user=await User.findById(userId)
        // console.log(user);
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
            return res.redirect('/login')
        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const userId=decoded.id
        const user=await User.findById(userId)

        const productId=req.params.id
        // console.log(productId);

        const product=await Products.findById(productId)
        // console.log(product);
 // Check if the product already exists in the wishlist
        const existingProductIndex = user.wishlist.findIndex(item => item.productId.toString() === productId);
        // console.log(existingProductIndex);
        if (existingProductIndex !== -1) {
            user.wishlist=user.wishlist.filter(item=>item.productId.toString()!==productId)
           await user.save()
           return res.status(201).json({message:'product removed from the wishlist'})
            // Product already exists in the wishlist
            // user.wishlist.splice(existingProductIndex,1)

            // await user.save()
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

        let address=user.address
        // console.log(address);
        // let shippingCharge=45
        let cart=user.cart.product
        let cartTotal=user.cart.total
        
        
        

        // console.log(cartTotal)
        // console.log(cart)

        res.render('user/checkout',{user:user,address:address,cart:cart,cartTotal})
    } catch (error) {
        
    }
    
 }

 let searchForProducts=async(req,res)=>{
    const query=req.params.inputValue
    console.log(query)
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
       
        // if(productsSearch.length===0){
        //     return res.status(404).json({message:'sorry no result found'})
        // }
        console.log(productsSearch)
        res.status(200).json({message:'productsSearch',productsSearch,user})
       
    } catch (error) {
        console.error(error)
        res.status(500).send('internal server error')
        
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
    searchForProducts

}