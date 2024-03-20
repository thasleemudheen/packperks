const Admin=require('../models/admin')
const User=require('../models/users')
const Products=require('../models/products')
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
            console.log("block status :",user.blocked);
        }
        res.redirect('/admin/user')
    }catch(error){
    res.status(500).send('admin is changing the user status')
    }
}

let categoryListPage=async(req,res)=>{
    let products=await Products.findOne()
    // console.log(products);
    if(!products){
       return res.status(400).send('user not found')
    }
    let category=products.category.map(category=>category)
    res.render('admin/categorylist',{category})
}

let addCategoryPage=async(req,res)=>{
    res.render('admin/addCategory')
}

let addCategoryPostPage=async(req,res)=>{

    try {
        let {categoryName}=req.body
        // console.log(categoryName);
        if(!categoryName){
            return res.status(400).send('category name required')
        }
        let products=await Products.findOne()
        if(!products){
           return res.status(400).send('admin not found')
        }
        
        products.category.push({categoryName})
       await products.save()

       
       return res.redirect('/admin/categorylist')
    } catch (error) {
        // console.log(error);
       return res.status(500).send('internal server error')
    }
}

let deleteCategory=async(req,res)=>{
        let categoryId=req.params.id
        try{
            let products=await Products.findOne()
        if(!products){
            return res.status(400).send('admin not found')
        }
        products.category=products.category.filter(cat=>cat.id !=categoryId)
        products.save()
            res.redirect('/admin/categorylist')
        }catch(error){
            // console.log('not deleting the category');
            res.status(500).send('internal server error')
        }
}
let editCategoryGetPage=async(req,res)=>{
   try{
        let categoryId=req.params.id
        // console.log(categoryId);
        let products=await Products.findOne({'category._id':categoryId})
        // console.log(products);
        
        let category=products.category.id(categoryId)
        // console.log(category);
        res.render('admin/editcategory',{category})
   }catch(error){
       console.log('category dont get for editing');
       res.status(400).send('category id not defined')
   }
}

let editCategoryPostPage=async(req,res)=>{
   try{
    let categoryId=req.params.id
    console.log(categoryId);
    let products=await Products.findOne({'category._id':categoryId})
    console.log(products);
   let category= products.category.id(categoryId)
    // console.log(category);
   let newName=req.body.editCategoryName
   console.log(newName);
   category.categoryName=newName
   await products.save()

   res.redirect('/admin/categorylist')
   } catch(error){
    console.log('something went wrong in the post request');
    res.status(400).send('edit not updated')
   }
}
let addProductsGetPage=async(req,res)=>{
    try{
        let category=await Products.distinct('category.categoryName')
        console.log(category);
     res.render('admin/addproduct',{category})
    }catch(error){
        console.log('the category is not founded');
        res.status(400).send('internal server error')
    }
      
}
let addProductPostPage=async(req,res)=>{

}

let productListPage=async(req,res)=>{
    res.render('admin/productlist')
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
    editCategoryPostPage,
    addProductsGetPage,
    productListPage
    
}