const nodemailer = require('nodemailer');
 // Import your User model

const otpService = {
    otpMap: new Map(),

    generateOTP: function () {
        return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
    },

    sendOTP: async function (email, otp) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'thasleemtrk@gmail.com', // Your Gmail email address
                    pass: 'cryghzzjjembkqbo' // Your Gmail password
                }
            });

            const mailOptions = {
                from: 'thasleemtrk@gmail.com',
                to: email,
                subject: 'Login OTP',
                text:`Your OTP for login is:${otp}`
            };

            await transporter.sendMail(mailOptions);
            console.log('OTP sent successfully.');
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw new Error('Error sending OTP. Please try again.');
        }
    },

    // verifyOTP: function (email, otp) {
    //     const storedOTP = this.otpMap.get(email);
    //     return storedOTP === otp;
    // }
};

module.exports = otpService;