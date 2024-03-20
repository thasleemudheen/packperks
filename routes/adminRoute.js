const express=require('express')
const bodyparser=require('body-parser')
const router=express.Router()
const adminController=require('../controllers/adminController')
const adminAuth=require('../middleware/jwt_admin')


router.use(bodyparser.urlencoded({extended:true}))

router.get('/admin/dashboard',adminAuth,adminController.adminDashBoard)
router.get('/admin/login',adminController.adminLogin)
router.post('/admin/login',adminController.adminPostLogin)
router.get('/admin/products',adminAuth,adminController.productsGetPage)
router.get('/admin/user',adminAuth,adminController.UserGetPage)
router.post('/admin/userBlocked',adminController.userBlock)
router.get('/admin/logout',adminAuth,adminController.adminLogoutpage)
router.get('/admin/categorylist',adminController.categoryListPage)
router.get('/admin/addcategory',adminController.addCategoryPage)
router.post('/admin/categoryAdd',adminController.addCategoryPostPage)
router.post('/admin/deleteCategory/:id',adminController.deleteCategory)
router.get('/admin/editCategory/:id',adminController.editCategoryGetPage)
router.post('/admin/editCategory/:id',adminController.editCategoryPostPage)
router.get('/admin/addProduct',adminController.addProductsGetPage)



module.exports = router