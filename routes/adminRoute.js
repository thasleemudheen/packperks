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
router.get('/admin/products',adminAuth,adminController.productsGetPage)
router.get('/admin/user',adminAuth,adminController.UserGetPage)
router.post('/admin/userBlocked',adminController.userBlock)
router.get('/admin/logout',adminAuth,adminController.adminLogoutpage)
//category 
router.get('/admin/categorylist',adminController.categoryListPage)
router.get('/admin/addcategory',adminController.addCategoryPage)
router.post('/admin/categoryAdd',adminController.addCategoryPostPage)
router.post('/admin/deleteCategory/:id',adminController.deleteCategory)
router.get('/admin/editCategory/:id',adminController.editCategoryGetPage)
router.post('/admin/editCategory/:id',adminController.editCategoryPostPage)
//products
router.get('/admin/addProduct',adminController.addProductsGetPage)
router.post('/admin/addProduct', upload.array('productImage',4),adminController.addProductPostPage)
router.get('/admin/productlist',adminController.productListPage)
router.post('/admin/deleteProduct/:id',adminController.productDelete)
router.get('/admin/editProduct/:id',adminController.editProductGetPage)
router.post('/admin/editProduct/:id',upload.array('newProductImage',4),adminController.editProductPostPage)



module.exports = router