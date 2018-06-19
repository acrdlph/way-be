var nodemailer = require('nodemailer');

function sendEmail(sendTo) {
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cryptogeeks.berlin@gmail.com',
    pass: 'wayiscool'
  }
});
var linkForMail = 'cryptogeeks.berlin'
var mailOptions = {
  from: 'cryptogeeks.berlin@gmail.com',
  to: `${sendTo}`,
  subject: 'Someone contacted you',
  text: `You have a new message from a cryptogeek and it is probably super important! Go check it out! www.cryptogeeks.berlin`
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log(`Email sent: ${sendTo}` + info.response);
  }
});
};

module.exports = sendEmail;