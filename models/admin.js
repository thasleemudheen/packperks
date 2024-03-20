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
    }]
})

const admin=mongoose.model('admin',adminSchema)

module.exports=admin