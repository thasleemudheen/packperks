const jwt=require('jsonwebtoken')
require('dotenv').config()

const adminAuth=(req,res,next)=>{
    const token=req.cookies.admin_jwt
    if(token){
        jwt.verify(token,process.env.JWT_SECRET, (err,decodedToken)=>{
            if(err){
                res.redirect('/admin/login')
            }else{
                req.admin=decodedToken
                next()
            }
        })
    }else{
        res.redirect('/admin/login')
    }
}

module.exports=adminAuth

