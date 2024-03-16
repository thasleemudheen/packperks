const express=require('express')
const bodyparser=require('body-parser')
const router=express.Router()
const adminController=require('../controllers/adminController')
const adminAuth=require('../middleware/jwt_admin')


router.use(bodyparser.urlencoded({extended:true}))

router.get('/admin/dashboard',adminAuth,adminController.adminDashBoard)
router.get('/admin/login',adminController.adminLogin)
router.post('/admin/login',adminController.adminPostLogin)
router.get('/admin/products',adminController.productsGetPage)
router.get('/admin/user',adminController.UserGetPage)
router.post('/admin/userBlocked',adminController.userBlock)
module.exports = router