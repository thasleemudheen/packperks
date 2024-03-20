const mongoose=require('mongoose')


let productSchema=new mongoose.Schema({
    productName:{type:String},
    discription:{type:String},
    price:{type:String},
    stockQuantity:{type:String},
    image:{type:Array},
    category:[{
        categoryName:{
            type:String,
            required:true
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
    }]
})

const products=mongoose.model('products',productSchema)

module.exports=products