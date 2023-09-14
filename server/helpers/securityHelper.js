const axios = require('axios');
const nodemailer = require('nodemailer');

module.exports = {

    // -----------------------------------------------------------Finding Location using Ip Address-----------------------------------------------------------
    findLocationData: (ipAddress)=>{
        return new Promise(async(resolve,reject)=>{
            try {        
                const response = await axios.get(`https://ipinfo.io/${ipAddress}/json`);
                const locationData = response.data;
                resolve(locationData)
            } catch (error) {
                console.log(error)
            }
        })
    },

    // ------------------------------------------------------------------markLocationInGoogleMap-------------------------------------------------------------

    getGoogleMapUrl:(locationData)=>{
        return new Promise(async(resolve,reject)=>{
            try {
                const [latitude, longitude] = locationData.loc.split(',');
                const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                resolve(googleMapsUrl)
            } catch (error) {
                console.log(error)
            }
        })
    },
// -----------------------------------------------------------------------------sendLoginDetectionToUser----------------------------------------------------------
    sendLoginDetectionMailToUser:(locationData,googleMapUrl,email)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(googleMapUrl)
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.OTP_EMAIL,
                        pass: process.env.OTP_PASSWORD,
                    },
                });
                const mailOptions = {
                    from: process.env.OTP_EMAIL,
                    to: email,
                    subject: `New Login Detected From ${locationData.city}, ${locationData.region}`,
                    html: `
                    <body style="margin: 0; padding: 0; text-align: center; padding-top: 20px;">
                      <img src='https://www.handytrac.com/wp-content/uploads/2018/03/cybersecurity-pic-circle-300x300.png' height='300px' />
                      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: bold; font-size: 30px; color: black; padding-top: 20px;">
                        New Login Detected
                      </div>
                    
                      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: light; font-size: 20px; color: darkred; padding-top: 10px;">
                        (New login detected from IP: ${locationData.ip})
                      </div>
                    
                      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #333; padding-top: 30px; margin: 0 auto; max-width: 750px; text-align: left;">
                        Our system has identified a recent login attempt from an unfamiliar IP address. Your security is paramount to us. If you have any suspicions of unauthorized access or harbor security concerns, please take immediate action. You can ensure your account's safety by initiating a password reset using your registered email address. Your proactive approach will help maintain the integrity of your account and data.
                      </div>

                      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-weight: bold; font-size: 30px; color: black; padding-top: 20px;">
                      <button style="background-color: #007AFF; border-radius: 8px; padding: 10px 20px; border: none; color: white; font-weight: bold; font-size: 16px;"><a href=${googleMapUrl} style="color:white; decoration:none;">View Location</button>
                    </div>
                    
                    </body>`,
                };
                  const sendMail = await transporter.sendMail(mailOptions);
                  resolve(sendMail)
            } catch (error) {
                console.log(error)
            }
        })
    }

}