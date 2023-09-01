const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

module.exports = {
    sendOtp: async(mail) => {
        return new Promise((resolve) => {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.OTP_EMAIL,
                    pass: process.env.OTP_PASSWORD,
                },
            });

            const OTP = otpGenerator.generate(6, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });

            const mailOptions = {
                from: process.env.OTP_EMAIL,
                to: mail,
                subject: 'OTP Verification',
                html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                <div style="margin:50px auto;width:70%;padding:20px 0">
                  <div style="border-bottom:1px solid #eee">
                    <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Social Sync</a>
                  </div>
                  <p style="font-size:1.1em">Hi,</p>
                  <p>Thank you for choosing Social Sync. Use the following OTP to complete your Sign Up.</p>
                  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
                  <p style="font-size:0.9em;">Regards,<br />Social Sync</p>
                  <hr style="border:none;border-top:1px solid #eee" />
                  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p>Social Sync</p>
                  </div>
                </div>
              </div>`,
            };

            try {
                transporter.sendMail(mailOptions);
                resolve(OTP);
            } catch (error) {
                console.log(error);
            }
        });
    },
};
