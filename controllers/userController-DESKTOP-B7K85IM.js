// const User=require('../models/users')
// const bcrypt=require('bcryptjs')
// const passport=require('passport')
// const jwt=require('jsonwebtoken')
// const cookieparser=require('cookie-parser')
// require('dotenv').config()


// let homePage=(req,res)=>{
//      try{
//         let isAuthenticated
        
//        if(req.cookies.user_jwt){
//         isAuthenticated = req.cookies.user_jwt
//         res.render('user/index',{isAuthenticated})
//        }
//        res.render('user/index',{isAuthenticated})
       
     
       
//      }catch(error){
//         console.log('home page is not found');
//         res.status(400).send('home page not found')
//      } 
// }

// // profile page
// let profile = async (req, res) => {
//     let userId = req.user.id;
//     let user = await User.findOne({ _id: userId });
//     console.log(user,'getting the user details');
//     if (!user) {
//         return res.status(400).send('User not found');
//     }
//     res.render('user/profile', {user});
// }

// let logout= async (req,res) => {

//     res.clearCookie('user_jwt')
//     res.redirect('/')
// }
// // user signup page

// let signUpPage=(req,res)=>{
//     res.render('user/signUp',{passError:''})
// }

// let loginPage = (req, res) => {
    
//     res.render('user/login',{passError:" "});
// }




// let loginPostPage = async (req, res) => {
//     console.log('req.body:', req.body);

//     // Get email and password from the request body
//     const { email, password } = req.body;

//     // Check if email and password are provided
//     if (email && password) {
//         try {
//             // Find the user by email
//             const user = await User.findOne({ email });
//             // console.log(user,'user not found');

            

//             if (!user) {
//                 return res.render('user/login', { passError: 'user not found' });
//             }
//             // Check if the user is blocked
//             if (user.blocked) {
//                 console.log('This account has been restricted by the admin');
//                 return res.render('user/login', { passError: 'This account has been restricted by the admin' });
//             }

//             // Compare the password with the hashed password in the database
//             bcrypt.compare(password, user.password, (err, result) => {
//                 if (err) {
//                     return res.status(500).send('Internal server error');
//                 }
//                 if (!result) {
//                     return res.status(401).render('user/login', { passError: 'Wrong password' });
//                 }

//                 // Generate JWT token
//                 const token = jwt.sign({
//                     id: user._id,
//                     name: user.name,
//                     email: user.email,
//                 }, process.env.JWT_SECRET, {
//                     expiresIn: '24h'
//                 });
//                 // console.log(token);

//                 // Set the JWT token in a cookie
//                 res.cookie('user_jwt', token, { httpOnly: true, maxAge: 86400000 });

//                 console.log('User logged in successfully, token created');
//                 // Redirect the user to the home page
//                 res.redirect('/');
//             });
//         } catch (error) {
//             console.log('Error on login submit', error);
//             res.status(500).send('Internal server error');
//         }

//     } else {
//         // If email or password is not provided, render the login page with an error message
//         res.render('user/login', { passError: 'Please provide email and password' });
//     }
// }



// let signupPostpage = async (req, res) => {
//     console.log(req.body);
//     const { username, email, phonenumber, password, confirmpassword } = req.body;
//     try {
//         const userExist = await User.findOne({ email: email });
//         if (userExist) {
//             return res.status(400).render('user/signUp', { passError: 'User exists with this email' });
//         }
//         if (!password) {
//             res.status(400).send('Password is empty');
//         }
        
//         const hashPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({ username, email, phonenumber, password: hashPassword });
//         await newUser.save();
//         // console.log(newUser);

//         // Generate JWT token
//         const token = jwt.sign({ userId: newUser._id }, 'Pack_perks', { expiresIn: '24h' });
//         console.log(token,'token created successfully');


//         // Set the token in a cookie
//         res.cookie('token', token, { httpOnly: true, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) });

//         res.redirect('/login');
//     } catch (error) {
//         res.status(500).send('Internal server error');
//     }
// }

// // google authentication


// let successGoogleLogin=async(req,res)=>{
//      if(!req.user){
//       return res.redirect('/failure')
//      }
//      console.log('google login email :',req.user.email);
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
// let failureGoogleLogin=async(req,res)=>{
//      res.send('error')
// }





// module.exports={
//     homePage,
//     signUpPage,
//     loginPage,
//     signupPostpage,
//     loginPostPage,
//     profile,
//     logout,
//     successGoogleLogin,
//     failureGoogleLogin
// }