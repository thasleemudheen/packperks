const express=require('express')
const bodyparser=require('body-parser')
const router=express.Router()
const adminController=require('../controllers/adminController')
const adminAuth=require('../middleware/jwt_admin')
const upload=require('../config/multer')


router.use(bodyparser.urlencoded({extended:true}))

router.get('/admin/dashboard',adminAuth,adminController.adminDashBoard)
router.get('/admin/login',adminController.adminLogin)
router.post('/admin/login',adminController.adminPostLogin)
// router.get('/admin/products',adminAuth,adminController.productsGetPage)
router.get('/admin/user',adminAuth,adminController.UserGetPage)
router.post('/admin/userBlocked',adminController.userBlock)
router.get('/admin/logout',adminAuth,adminController.adminLogoutpage)
//category 
router.get('/admin/categorylist',adminAuth,adminController.categoryListPage)
router.get('/admin/addcategory',adminAuth,adminController.addCategoryPage)
router.post('/admin/categoryAdd',adminAuth,adminController.addCategoryPostPage)
router.post('/admin/deleteCategory/:id',adminController.deleteCategory)
router.get('/admin/editCategory/:id',adminController.editCategoryGetPage)
router.post('/admin/editCategory/:id',adminController.editCategoryPostPage)
//products
router.get('/admin/addProduct',adminAuth,adminController.addProductsGetPage)
router.post('/admin/addProduct',adminAuth, upload.array('productImage',4),adminController.addProductPostPage)
router.get('/admin/productlist',adminAuth,adminController.productListPage)
router.post('/admin/disableProduct/:id',adminController.productDisable)
router.get('/admin/editProduct/:id',adminController.editProductGetPage)
router.post('/admin/editProduct/:id',upload.array('newProductImage',4),adminController.editProductPostPage)
//coupon
router.get('/admin/coupon',adminController.couponPageGet)
router.post('/addCoupon',adminController.addCoupon)
router.post('/deleteCoupon/:id',adminController.deleteCoupon)
router.get('/editCoupon/:id',adminController.couponEditGetPage)
router.post('/editCouponData/:id',adminController.couponEditPostPage)

router.get('/admin/order',adminController.orderManagement)

module.exports = router