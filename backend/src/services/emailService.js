const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, template, userId, metadata }) => {
  const log = await EmailLog.create({
    to,
    subject,
    body: html,
    template,
    user: userId,
    status: 'pending',
    metadata,
  });

  try {
    if (!process.env.SMTP_USER) {
      console.log(`📧 Email (dev mode): To: ${to}, Subject: ${subject}`);
      log.status = 'sent';
      await log.save();
      return { success: true, message: 'Email logged (dev mode)' };
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    log.status = 'sent';
    await log.save();
    return { success: true };
  } catch (error) {
    log.status = 'failed';
    log.error = error.message;
    await log.save();
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #faf8f5;">
      <div style="text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #8B4513; margin: 0;">Manikanta Khadi & Handlooms</h1>
      </div>
      <p style="color: #333; font-size: 16px; line-height: 1.8;">Dear ${user.name || 'Customer'},</p>
      <p style="color: #333; font-size: 16px; line-height: 1.8;">
        Thank you for logging in to Manikanta Khadi & Handlooms.
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.8;">
        We are delighted to have you with us.
      </p>
      <p style="color: #333; font-size: 16px; line-height: 1.8;">Happy Shopping!</p>
      <p style="color: #8B4513; margin-top: 30px;">Regards,<br><strong>Manikanta Khadi & Handlooms</strong></p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Manikanta Khadi & Handlooms',
    html,
    template: 'welcome',
    userId: user._id,
  });
};

exports.sendOTPEmail = async (user, otp) => {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #faf8f5;">
      <h2 style="color: #8B4513;">Your OTP Code</h2>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</p>
      <p style="color: #666;">This OTP is valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.</p>
      <p style="color: #666;">Do not share this code with anyone.</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Your OTP - Manikanta Khadi & Handlooms',
    html,
    template: 'otp',
    userId: user._id,
  });
};

exports.sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${item.totalPrice}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #faf8f5;">
      <h2 style="color: #8B4513;">Order Confirmed!</h2>
      <p>Order #${order.orderNumber}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead><tr style="background: #8B4513; color: white;">
          <th style="padding: 10px;">Product</th><th style="padding: 10px;">Qty</th><th style="padding: 10px;">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size: 18px; font-weight: bold;">Total: ₹${order.totalAmount}</p>
      <p>Estimated Delivery: ${order.estimatedDelivery}</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed #${order.orderNumber} - Manikanta Khadi & Handlooms`,
    html,
    template: 'order_confirmation',
    userId: user._id,
    metadata: { orderId: order._id },
  });
};

exports.sendEmail = sendEmail;
