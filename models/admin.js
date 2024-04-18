const mongoose=require('mongoose')

const adminSchema= new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    },
    category:[{
        categoryName:{
            type:String,
            required:true
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
    }],
    coupon:[{
        couponCode:{
            type:String,
            required:true
        },
        couponStatus:{
            type:String,
            required:true
        },
        couponType:{
            type:String,
            required:true
        },
        discountValue:{
            type:Number,
            required:true
        },
        startDate:{
            type:Date,
            default:Date.now
        },
        endDate:{
            type:Date,
            required:true
        }
    }]
   
})

const admin=mongoose.model('admin',adminSchema)

module.exports=admin