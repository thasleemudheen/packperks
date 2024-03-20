const mongoose=require('mongoose')

let productSchema=new mongoose.Schema({
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