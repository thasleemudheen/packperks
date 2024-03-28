const mongoose=require('mongoose')


const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    cretedAt:{
        type:Date,
        default:Date.now
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    },
    phonenumber:{
        type:String
    },
   
    blocked:{
        type:Boolean,
        default:false
    },
    cart:{
        product:[{
            productId:{type:mongoose.Schema.ObjectId,
                ref:'product'
            },
            productImage:{
                type:[String]
            },
            productName:{
                type:String
            },
            productPrice:{
                type:String
            },
            quantity:{
                type:String, default:1
            },
        }],
        total:{
            type:String
        }
    }
});

const user=mongoose.model('user',userSchema);


module.exports=user;