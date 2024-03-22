const mongoose=require('mongoose')


let productSchema=new mongoose.Schema({
    productId:{type:String, required:true},
    productName:{type:String ,required:true},
    discription:{type:String ,required:true},
    productPrice:{type:Number, required:true},
    stockQuantity:{type:Number ,required:true},
    productImage:{type:Array },
    brand:{type:String , required:true},
    categoryName:{type:String}
})

const products=mongoose.model('products',productSchema)

module.exports=products