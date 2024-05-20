const Admin=require('../models/admin')
const User=require('../models/users')
const Products=require('../models/products')
const jwt=require('jsonwebtoken')
const cloudinary=require('../config/cloudinary')
const multer=require('multer')
const upload = multer({ dest: 'uploads/' }); 
const mongoose=require('mongoose')
const Excel=require('exceljs')
const path=require('path')
const fs=require('fs')


require('dotenv').config()


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

      return res.render('admin/signin', {passError:'please complete the field'})          
     }
}

let adminLogoutpage=async(req,res)=>{
    res.clearCookie('admin_jwt')
    res.redirect('/admin/login')

}

let adminDashBoard=async(req,res)=>{

    const totalUser = await User.countDocuments()
    const totalOrders = await User.aggregate([
        { $unwind: '$orders' }, 
        { $group: { _id: null, total: { $sum: 1 } } } 
    ]);
    
    const totalOrder = totalOrders.length > 0 ? totalOrders[0].total : 0;
    
    

    const totalOrderedProducts = await User.aggregate([
        { $match: { 'orders.0': { $exists: true } } }, 
        { $unwind: '$orders' }, 
        { $unwind: '$orders.products' }, 
        { $group: { _id: '$orders.products', total: { $sum: 1 } } } 
    ]);
    
    const totalOrderedProduct = totalOrderedProducts.reduce((total, product) => total + product.total, 0);
    
    
    const categoryOrders = await User.aggregate([
        { $match: { 'orders.0': { $exists: true } } }, 
        { $unwind: '$orders' },
        { $unwind: '$orders.products' }, 
        { $group: { _id: '$orders.products.categoryName', count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } }
    ]);
    
    const latestOrders = await User.aggregate([
        { $match: { orders: { $exists: true, $ne: null } }  }, 
        {  $unwind: "$orders" },
        { $project: {
                _id: "$orders._id",
                userId: "$_id",
                paymentMethod: "$orders.paymentMethod",
                orderDate: "$orders.orderDate",
                shippingAddress: "$orders.shippingAddress",
                products: "$orders.products",
                totalAmount: "$orders.totalAmount",
                orderStatus: "$orders.orderStatus"
            } },
        {$sort: { orderDate: -1 } },
        { $limit: 10  }
    ]);
    
    const totalOrderValue = await User.aggregate([
        { $match: { orders: { $exists: true, $ne: null } } }, 
        { $unwind: "$orders" }, 
        { $group: { _id: null, total: { $sum: "$orders.totalAmount" } } } 
    ]);
    
    const totalValue = totalOrderValue.length > 0 ? totalOrderValue[0].total : 0;

    const monthlyOrders = await User.aggregate([
        {$unwind: '$orders' },
        {  $match: {'orders.orderDate': { $exists: true } }},
        { $group: {  _id: {   year: { $year: '$orders.orderDate' }, month: { $month: '$orders.orderDate' }   },
         totalOrders: { $sum: 1 }   } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {  $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            totalOrders: 1
          }
        }
      ]);
      
    const orderStatusCounts = await User.aggregate([
        { $match: { 'orders.0': { $exists: true } } }, 
        { $unwind: '$orders' }, 
        { $unwind: '$orders.products' }, 
        { 
            $group: { 
                _id: { productId: '$orders.products.productId', status: '$orders.products.orderStatus' }, 
                count: { $sum: 1 } 
            } 
        }, 
        { 
            $group: { 
                _id: '$_id.status', 
                totalCount: { $sum: '$count' } 
            } 
        }
    ]);
    
    const statusCounts = {};
    orderStatusCounts.forEach(status => {
        statusCounts[status._id] = status.totalCount;
    });

   
      
    res.render('admin/index',{categoryOrders,totalUser,totalOrderedProduct,totalOrder,latestOrders,totalValue,monthlyOrders,statusCounts})
}



let UserGetPage=async(req,res)=>{
    let users =await User.find()
    res.render('admin/userlist',{users:users})
}

let userBlock=async(req,res)=>{
    const userId=req.body.userId
    try{
        const user=await User.findOne({_id:userId})
        if(user){
            user.blocked=!user.blocked
            await user.save()
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
        let products=await Admin.findOne()
        if(!products){
           return res.status(400).send('admin not found')
        }
        
        products.category.push({categoryName})
       await products.save()

       
       return res.redirect('/admin/categorylist')
    } catch (error) {
       return res.status(500).send('internal server error')
    }
}

let deleteCategory=async(req,res)=>{
        let categoryId=req.params.id
        try{
            let products=await Admin.findOne()
        if(!products){
            return res.status(400).send('admin not found')
        }
        products.category=products.category.filter(cat=>cat.id !=categoryId)
        products.save()
            res.redirect('/admin/categorylist')
        }catch(error){
            res.status(500).send('internal server error')
        }
}
let editCategoryGetPage=async(req,res)=>{
   try{
        let categoryId=req.params.id
        let products=await Admin.findOne({'category._id':categoryId})
        
        let category=products.category.id(categoryId)
        res.render('admin/editcategory',{category})
   }catch(error){
       console.log('category dont get for editing');
       res.status(400).send('category id not defined')
   }
}

let editCategoryPostPage=async(req,res)=>{
   try{
    let categoryId=req.params.id
    let products=await Admin.findOne({'category._id':categoryId})
   let category= products.category.id(categoryId)
   let newName=req.body.editCategoryName
   category.categoryName=newName
   await products.save()

   res.redirect('/admin/categorylist')
   } catch(error){
    res.status(400).send('category not edited')
   }
}

let addProductsGetPage=async(req,res)=>{
    try{
        let category=await Admin.distinct('category.categoryName')
     res.render('admin/addproduct',{category})
    }catch(error){
        console.log('the category is not founded');
        res.status(400).send('internal server error')
    }
      
}

let addProductPostPage=async(req,res)=>{
   try{
    
      const{productId,productName,discription,productPrice,stockQuantity,categoryName,brand}=req.body
      const productImage=req.files
    const imageUrls = [];

    const result = await Promise.all(productImage.map(async (image) => {
        const result = await cloudinary.uploader.upload(image.path);
        imageUrls.push(result.secure_url);
    }));
      const newProduct= new Products({
        productId,
        productName,
        productPrice,
        categoryName,
        stockQuantity,
        brand,
        discription,
        productImage:imageUrls,

      })

      await newProduct.save()
      res.redirect('/admin/productlist')
   }catch(error){
    if(error instanceof multer.MulterError){
        console.error(error.message)
        res.status(400).send('there was an error on uploading image')
    }else{
        console.log('product not added ');
        res.status(400).send('internal server error')
    }      
   }
}

let productListPage=async(req,res)=>{
    try{
        let product=await Products.find()

        res.render('admin/products',{product})
    }catch(error){
        console.log('product not listed in the tabel');
        res.status(400).send('internal server error')
    }  
}

let productDisable=async(req,res)=>{
      let productId=req.body.productId
      try {
        const product=await Products.findOne({_id:productId})
        if(product){
            product.isDisabled=!product.isDisabled
            await product.save()
            console.log('product disabled');
        }
        res.redirect('/admin/productlist')
      } catch (error) {
        console.log('product not disabled ');
        res.status(400).send('internal server error')
        
      }     
}
let editProductGetPage=async(req,res)=>{
    try{
         let productId=req.params.id
         const product=await Products.findById(productId)
         if(!product){
            res.send('product not found')
         }
         let category=await Admin.distinct('category.categoryName')
         res.render('admin/editProduct',{category,product})
    }catch(error){
            console.log('product not found for edit');
            res.status(400).send('internal server error')
    }   
}

// let editProductPostPage = async (req, res) => {
//     try {
//         let productId = req.params.id;
//         const product = await Products.findById(productId);
//         if (!product) {
//             res.send('Product not found');
//             return;
//         }

//         product.productId = req.body.productId;
//         product.productName = req.body.productName;
//         product.productPrice = req.body.productPrice;
//         product.categoryName = req.body.categoryName;
//         product.discription = req.body.discription;
//         product.brand = req.body.brand;
//         product.stockQuantity = req.body.stockQuantity;

//         if (req.files && req.files.length > 0) {
//        const newProductImages = req.files;
//             console.log(req.files);
//             const imageUrls = [];
//             for (const image of newProductImages) {
//                 const result = await cloudinary.uploader.upload(image.path);
//                 imageUrls.push(result.secure_url);
//             }
//             product.productImage = imageUrls;
//         }

//         await product.save();
//         res.redirect('/admin/productlist');
//     } catch (error) {
//         console.log('Product not updated:', error);
//         res.status(500).send('Internal server error');
//     }
// }


let editProductPostPage=async(req,res)=>{

    try{
        let categoryId=req.params.id
        const product=await Products.findById(categoryId)
        if(!product){
            res.send('product not found')
            return 
        }
        product.productId=req.body.productId
        product.productName=req.body.productName
        product.productPrice=req.body.productPrice
        product.categoryName=req.body.categoryName
        product.discription=req.body.discription
        product.brand=req.body.brand
        product.stockQuantity=req.body.stockQuantity

        const newProductImage = req.files;
            const imageUrls = [];
            for (const image of newProductImage) {
                const result = await cloudinary.uploader.upload(image.path);
    
                imageUrls.push(result.secure_url);
            }
            product.productImage = imageUrls;

        await product.save()
        res.redirect('/admin/productlist')
    }catch(error){
        console.log('product not updated now also');
        res.status(400).send('internal server error')
    }

}

let addCoupon=async(req,res)=>{
    const {couponCode,couponType,discountValue,endDate,couponStatus}=req.body
    try{
        let admin=await Admin.findOne()    
        admin.coupon.push({
            couponCode,
            couponType,
            discountValue,
            endDate,
            couponStatus
        })
        await admin.save()
        console.log('coupon added successfully')
        res.redirect('/admin/coupon')
    }catch(error){
        console.error(error)
        res.status(500).send('failed to add coupon')
    }
    
}
let couponPageGet=async(req,res)=>{

    let admin=await Admin.findOne()
    let coupon=admin.coupon
    res.render('admin/coupon',{coupon})
}

let deleteCoupon=async(req,res)=>{
    let deletedId=req.params.id
try{
    let admin=await Admin.findOne()
    admin.coupon=admin.coupon.filter(coupon=>coupon.id != deletedId)
    admin.save()
    console.log('coupon deleted successfully')
    res.status(200).redirect('/admin/coupon')
}catch(error){
    console.error(error)
    res.status(500).send('coupon not deleted ')
}
}

let couponEditGetPage=async(req,res)=>{
    let couponEditId=req.params.id

    let admin=await Admin.findOne()
    let coupon= admin.coupon.find(coupon=>coupon.id===couponEditId)
    res.render('admin/editCoupon',{coupon})
}

let couponEditPostPage = async (req, res) => {
    let editCouponId = req.params.id;
    try {
        let admin = await Admin.findOne();
        let coupon = admin.coupon.find(coupon => coupon.id === editCouponId);
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }
        coupon.couponCode = req.body.couponCode;
        coupon.couponType = req.body.couponType;
        coupon.discountValue = req.body.discountValue;
        coupon.endDate = req.body.endDate;
        coupon.couponStatus = req.body.couponStatus;

        await admin.save();
        console.log('Coupon updated successfully');
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error(error);
        res.status(500).send('Coupon not updated');
    }
}

let orderManagement=async(req,res)=>{
    const usersWithOrders = await User.find({ 'orders.0': { $exists: true } }).sort({'orders.orderDate':-1})
    res.render('admin/orders',{usersWithOrders})
}

let orderReport = async (req, res) => {
    let { startDate, endDate } = req.body;
    let result = await User.aggregate([
        { $unwind: "$orders" },
        {
            $match: {
                "orders.orderDate": {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        }
    ]);

    let orderDetails = result.map(user => user.orders);

    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('sales report');

    worksheet.columns = [
        { header: 'Order ID', key: '_id', width: 25 },
        {header:'orderDate',key:'orderDate',widht:15},
        {header:'orderAmount',key:'totalAmount',width:15},
        {header:'paymentMethod',key:'paymentMethod',width:20},
        {header:'productName',key:'productName',width:20},
        {header:'productPrice',key:'productPrice',width:15}
    ];

    orderDetails.forEach(order => {
        order.products.forEach(product=>{
            worksheet.addRow({
                _id: order._id,
                orderDate:order.orderDate.toLocaleDateString(),
                totalAmount:order.totalAmount,
                paymentMethod:order.paymentMethod,
                productName:product.productName,
                productPrice:product.productPrice,
            });
        })
        
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment;filename=sales_report.xlsx');

    workbook.xlsx.write(res)
    .then(() => {
        res.end();
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error in generating Excel');
    });
};

let updateOrderStatus=async(req,res)=>{
            let {productId,orderId}=req.params
            let {status}=req.body
try {
    let user=await User.findOne({'orders._id':orderId})
    if(!user){
        return res.status(400).send('user not found')
    }
    let orderIndex=user.orders.findIndex(order=>order._id.toString()===orderId)
    if(orderIndex === -1){
        return res.status(400).send('order not found')
    }
    let productIndex=user.orders[orderIndex].products.findIndex(product=>product.productId.toString()===productId)
    if(productIndex === -1){
        return res.status(400).send('product not found in the orders')
    }

    let product = user.orders[orderIndex].products[productIndex];
    if (status === 'cancelled' && product.orderStatus !== 'cancelled') {
        let findProduct = await Products.findById(productId);
        if (findProduct) {
            findProduct.stockQuantity += product.quantity;
            await findProduct.save();
        }
    }

    user.orders[orderIndex].products[productIndex].orderStatus=status
    await user.save()
    res.status(200).json({message:'order status updated successfully'})
} catch (error) {
    res.status(500).send('order status not updated')
    console.error(error)
}
           
}

let changeHomePageImage=async(req,res)=>{
    res.render('admin/banner')
}

module.exports={
    adminLogin,
    adminPostLogin,
    adminDashBoard,
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
    productListPage,
    addProductPostPage,
    productDisable,
    editProductGetPage,
    editProductPostPage,
    couponPageGet,
    addCoupon,
    deleteCoupon,
    couponEditGetPage,
    couponEditPostPage,
    orderManagement,
    updateOrderStatus,
    orderReport,
    changeHomePageImage
    
}