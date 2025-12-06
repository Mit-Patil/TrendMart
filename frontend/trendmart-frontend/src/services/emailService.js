const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "mitpatil412@gmail.com",        // your Gmail
    pass: "iiej msqb yjzj mrwe",    // Gmail App Password
  },
});

// Send welcome email
const sendWelcomeEmail = async (to, name) => {
  try {
    await transporter.sendMail({
      from: '"TrendMart" <mitpatil412@gmail.com>',
      to: to,
      subject: "Welcome to TrendMart",
      html: `<h3>Hello ${name},</h3><p>Welcome to our E-commerce platform. We're glad to have you!</p>`,
    });
    console.log("Email sent successfully!");
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = { sendWelcomeEmail };
