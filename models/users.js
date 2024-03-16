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
    token:{
        type:String,
        default:null
    },
    blocked:{
        type:Boolean,
        default:false
    },
});

// collection part

const user=mongoose.model('user',userSchema);


module.exports=user;