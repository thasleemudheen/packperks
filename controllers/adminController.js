const Admin=require('../models/admin')
const user = require('../models/users')
const User=require('../models/users')
const jwt=require('jsonwebtoken')

let adminLogin=async(req,res)=>{
    // if(req.cookie.admin_jwt){
    //     res.redirect('/dashboard')
    // }
    res.render('admin/signin')
}

let adminPostLogin=async(req,res)=>{
     const {email,password}=req.body
     console.log(email,password)
     if(email&&password){
        try{
           const admin =await Admin.findOne({email:email})
           console.log(admin);
        
           if(!admin){
           return  res.status(400).send({passError:'admin is not found'})
           }if(password!=admin.password){
            return res.status(400).send({passError:'password doesnt match'})
           }else{
            const token=jwt.sign({
                id:admin._id,
                email:admin.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn:'24h'
            }

            )
            res.cookie('admin_jwt',token,{httpOnly:true,maxAge:86400000 })
            console.log('token created successfully :token created');
            return res.redirect("/admin/dashboard")
           }
        }catch(error){
            console.log('Error on login submit :',error);
           return res.status(500).send('internal server error')
        }


     }else{
      return res.render('admin/signin', {passError:'please complete the field'})          //,{category}
     }
}



let adminDashBoard=(req,res)=>{
    res.render('admin/index')
}

let productsGetPage=async(req,res)=>{
    res.render('admin/products')
}

let UserGetPage=async(req,res)=>{
    // let users=[]
    let users =await User.find()
    // console.log(users);
    res.render('admin/userlist',{users:users})
}

let userBlock=async(req,res)=>{
    const userId=req.body.userId
    try{
        const user=await User.findOne({_id:userId})
        console.log(user);
        if(user){
            user.Blocked=!user.Blocked
            await user.save()
            console.log(user.Blocked);
        }
        res.redirect('/admin/user')
    }catch(error){
    res.status(500).send('admin is changing the user status')
    }
}


module.exports={
    adminLogin,
    adminPostLogin,
    adminDashBoard,
    productsGetPage,
    UserGetPage,
    userBlock
    
}