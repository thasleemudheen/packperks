const Admin=require('../models/admin')
const User=require('../models/users')
const jwt=require('jsonwebtoken')

let adminLogin=async(req,res)=>{
   
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

let adminLogoutpage=async(req,res)=>{
    res.clearCookie('admin_jwt')
    res.redirect('/admin/login')

}

let adminDashBoard=(req,res)=>{
    res.render('admin/index')
}

let productsGetPage=async(req,res)=>{
    res.render('admin/products')
}

let UserGetPage=async(req,res)=>{
    let users =await User.find()
    res.render('admin/userlist',{users:users})
}

let userBlock=async(req,res)=>{
    const userId=req.body.userId
    try{
        const user=await User.findOne({_id:userId})
        console.log(user);
        if(user){
            user.blocked=!user.blocked
            await user.save()
            console.log("block stts :",user.blocked);
        }
        res.redirect('/admin/user')
    }catch(error){
    res.status(500).send('admin is changing the user status')
    }
}

let categoryListPage=async(req,res)=>{
    let admin=await Admin.findOne()
    if(!admin){
       return res.status(400).send('user not found')
    }
    let category=admin.category.map(category=>category)
     res.render('admin/categorylist',{category})
}

let addCategoryPage=async(req,res)=>{
    res.render('admin/addCategory')
}

let addCategoryPostPage=async(req,res)=>{

    try {
        let {categoryName}=req.body
        if(!categoryName){
            return res.status(400).send('category name required')
        }
        let admin=await Admin.findOne()
        if(!admin){
           return res.status(400).send('admin not found')
        }
        admin.category.push({categoryName})
       await admin.save()
       return res.redirect('/admin/categorylist')
    } catch (error) {
        console.log(error);
       return res.status(500).send('internal server error')
    }
}

let deleteCategory=async(req,res)=>{
        let categoryId=req.params.id
        try{
            let admin=await Admin.findOne()
        if(!admin){
            return res.status(400).send('admin not found')
        }
        admin.category=admin.category.filter(cat=>cat.id !=categoryId)
        admin.save()
            res.redirect('/admin/categorylist')
        }catch(error){
            console.log('not deleting the category');
            res.status(500).send('internal server error')
        }
}
let editCategoryGetPage=async(req,res)=>{
    let categoryId=req.params.id
    // console.log(categoryId );
    if(!categoryId){
        res.status(400).send('category id not found')
    }
    let admin=await Admin.findOne()
    // console.log(admin);
    if(!admin){
        res.status(400).send('admin not found')
    }
    let editCategory=admin.categoryId.find()

    res.render('admin/editcategory')
}

let editCategoryPostPage=async(req,res)=>{
   
}

module.exports={
    adminLogin,
    adminPostLogin,
    adminDashBoard,
    productsGetPage,
    UserGetPage,
    userBlock,
    adminLogoutpage,
    categoryListPage,
    addCategoryPage,
    addCategoryPostPage,
    deleteCategory,
    editCategoryGetPage,
    editCategoryPostPage
    
}