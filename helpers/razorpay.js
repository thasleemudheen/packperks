// const Razorpay=require('razorpay')

// const instance=new Razorpay({
//     key_id:process.env.RAZORPAY_ID,
//     key_secret:process.env.RAZORPAY_SECRET_KEY,
// })

// const generaterazorpay=(orderId,total)=>{

//     return new Promise((resolve,reject)=>{
//         const options={
//             amount:total*100,
//             currency:'INR',
//             receipt:'orderId'
//         };
//         instance.orders.create(options,function(err,order){
//             if(err){
//                 reject(err)
//             }else{
//                 resolve(order)
//             }
//         })
//     })
// }

// module.exports={generaterazorpay}