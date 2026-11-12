const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');

const isPlaceholder = (value = '') => {
  const v = String(value).trim().toLowerCase();
  return !v || v.startsWith('your_') || v.includes('example.com') || v === 'changeme';
};

/** Supports SMTP_* and Flask-style MAIL_* env names */
const smtpUser = () => process.env.SMTP_USER || process.env.MAIL_USERNAME || '';
const smtpPass = () => process.env.SMTP_PASS || process.env.MAIL_PASSWORD || '';
const smtpHost = () => process.env.SMTP_HOST || process.env.MAIL_SERVER || 'smtp.gmail.com';
const smtpPort = () => parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || '587', 10);
const mailFrom = () =>
  process.env.EMAIL_FROM ||
  process.env.MAIL_DEFAULT_SENDER ||
  smtpUser() ||
  'Manikanta Khadi & Handlooms <lateshk169@gmail.com>';

const smtpConfigured = () => !isPlaceholder(smtpUser()) && !isPlaceholder(smtpPass());

const createTransporter = () => {
  const useTls = String(process.env.MAIL_USE_TLS || 'true').toLowerCase() !== 'false';
  return nodemailer.createTransport({
    host: smtpHost(),
    port: smtpPort(),
    secure: smtpPort() === 465,
    requireTLS: useTls && smtpPort() === 587,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth: {
      user: smtpUser(),
      pass: smtpPass(),
    },
  });
};

const brandWrap = (inner) => `
  <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 640px; margin: 0 auto; padding: 0; background: #F6F0E4;">
    <div style="background: linear-gradient(105deg, #1F5570 0%, #1F6A7A 45%, #C26A3D 100%); padding: 28px 32px; text-align: center;">
      <h1 style="color: #FFFEF9; margin: 0; font-size: 24px; font-weight: 600;">Manikanta Khadi &amp; Handlooms</h1>
      <p style="color: #E8B84A; margin: 8px 0 0; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase;">Handwoven · Natural · Indian</p>
    </div>
    <div style="padding: 32px; background: #FFFEF9; color: #1A1714;">
      ${inner}
    </div>
    <div style="padding: 20px 32px; text-align: center; color: #4A433C; font-size: 12px; border-top: 1px solid #EADFC8;">
      <p style="margin: 0 0 6px;">Questions? Call <a href="tel:+918074181510" style="color:#1F5570;">+91 80741 81510</a>
      · <a href="mailto:lateshk169@gmail.com" style="color:#1F5570;">lateshk169@gmail.com</a></p>
      <p style="margin: 0;">© ${new Date().getFullYear()} Manikanta Khadi &amp; Handlooms</p>
    </div>
  </div>
`;

const sendEmail = async ({ to, subject, html, template, userId, metadata }) => {
  if (!to) return { success: false, error: 'No recipient' };

  let log;
  try {
    log = await EmailLog.create({
      to,
      subject,
      body: html,
      template,
      user: userId,
      status: 'pending',
      metadata,
    });
  } catch (err) {
    console.warn('Email log skipped:', err.message);
  }

  try {
    if (!smtpConfigured()) {
      console.log(`📧 Email (dev mode): To: ${to}, Subject: ${subject}`);
      if (log) {
        log.status = 'sent';
        await log.save();
      }
      return { success: true, message: 'Email logged (dev mode)' };
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: mailFrom(),
      to,
      subject,
      html,
    });

    if (log) {
      log.status = 'sent';
      await log.save();
    }
    return { success: true };
  } catch (error) {
    if (log) {
      log.status = 'failed';
      log.error = error.message;
      await log.save().catch(() => {});
    }
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendWelcomeEmail = async (user) => {
  if (!user?.email) return { success: false };
  const name = user.name || 'Customer';
  const html = brandWrap(`
    <p style="font-size: 16px; line-height: 1.8; margin: 0 0 12px;">Dear ${name},</p>
    <p style="font-size: 16px; line-height: 1.8; margin: 0 0 12px;">
      <strong>Welcome to Manikanta Khadi &amp; Handlooms!</strong>
    </p>
    <p style="font-size: 16px; line-height: 1.8; margin: 0 0 12px;">
      We are delighted to have you with us. Explore authentic handwoven sarees, dupattas,
      dress materials and blouses — crafted with care by Indian artisans.
    </p>
    <p style="font-size: 18px; line-height: 1.8; margin: 24px 0; color: #1F5570; font-weight: 600;">
      Happy Shopping!
    </p>
    <p style="font-size: 15px; line-height: 1.8; margin: 0; color: #4A433C;">
      Regards,<br/><strong>Team Manikanta Khadi &amp; Handlooms</strong>
    </p>
  `);

  return sendEmail({
    to: user.email,
    subject: 'Welcome to Manikanta Khadi & Handlooms — Happy Shopping!',
    html,
    template: 'welcome',
    userId: user._id,
  });
};

exports.sendOTPEmail = async (user, otp) => {
  const html = brandWrap(`
    <h2 style="color: #1F5570; margin-top: 0;">Your verification code</h2>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1A1714;">${otp}</p>
    <p style="color: #4A433C;">Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes. Do not share this code.</p>
  `);

  return sendEmail({
    to: user.email,
    subject: 'Your OTP - Manikanta Khadi & Handlooms',
    html,
    template: 'otp',
    userId: user._id,
  });
};

/** Full bill / receipt with tracking for purchases */
exports.sendOrderConfirmationEmail = async (user, order) => {
  if (!user?.email && !order?.shippingAddress?.email) {
    return { success: false, error: 'No recipient email' };
  }
  const to = user?.email || order.shippingAddress?.email;
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #EADFC8;">${item.name}${item.size ? ` (${item.size})` : ''}${item.color ? ` · ${item.color}` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EADFC8; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EADFC8; text-align: right;">₹${item.totalPrice ?? item.offerPrice * item.quantity}</td>
    </tr>`
    )
    .join('');

  const addr = order.shippingAddress || {};
  const addressHtml = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
    addr.phone,
  ]
    .filter(Boolean)
    .join('<br/>');

  const trackingHtml = (order.tracking || [])
    .map(
      (t) =>
        `<li style="margin-bottom: 6px;"><strong>${String(t.status || '').toUpperCase()}</strong> — ${t.message || ''}${t.location ? ` (${t.location})` : ''}</li>`
    )
    .join('');

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const trackUrl = `${clientUrl}/track-order/${order.orderNumber}`;

  const html = brandWrap(`
    <h2 style="color: #1F5570; margin-top: 0;">Order receipt / bill</h2>
    <p style="font-size: 15px; line-height: 1.7;">Dear ${user?.name || addr.fullName || 'Customer'},</p>
    <p style="font-size: 15px; line-height: 1.7;">Thank you for your purchase. Here is your bill and tracking summary.</p>

    <div style="background: #F6F0E4; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 6px;"><strong>Order #</strong> ${order.orderNumber}</p>
      <p style="margin: 0 0 6px;"><strong>Date</strong> ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}</p>
      <p style="margin: 0 0 6px;"><strong>Payment</strong> ${String(order.paymentMethod || '').toUpperCase()}</p>
      <p style="margin: 0;"><strong>Status</strong> ${String(order.status || 'pending').toUpperCase()}</p>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #1F5570; color: #fff;">
          <th style="padding: 10px; text-align: left;">Product</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <p style="margin: 4px 0; text-align: right;">Subtotal: ₹${order.subtotal ?? order.totalAmount}</p>
    <p style="margin: 4px 0; text-align: right;">Discount: ₹${order.discount || 0}</p>
    <p style="margin: 4px 0; text-align: right;">Shipping: ₹${order.shippingCharges || 0}</p>
    <p style="font-size: 18px; font-weight: bold; text-align: right; color: #1F5570;">Total: ₹${order.totalAmount}</p>

    ${addressHtml ? `<h3 style="color:#1F5570; margin-top: 28px;">Shipping address</h3><p style="line-height:1.7;">${addressHtml}</p>` : ''}

    <h3 style="color:#1F5570; margin-top: 28px;">Tracking</h3>
    <p style="margin: 0 0 8px;">Estimated delivery: <strong>${order.estimatedDelivery || '5–7 business days'}</strong></p>
    <ul style="padding-left: 18px; line-height: 1.6;">${trackingHtml || '<li>Order placed — processing soon</li>'}</ul>
    <p style="margin-top: 16px;">
      <a href="${trackUrl}" style="display:inline-block;background:#1F5570;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">
        Track your order
      </a>
    </p>
    <p style="margin-top: 24px; color: #4A433C;">Happy Shopping!<br/>— Manikanta Khadi &amp; Handlooms</p>
  `);

  return sendEmail({
    to,
    subject: `Bill & receipt #${order.orderNumber} — Manikanta Khadi & Handlooms`,
    html,
    template: 'order_confirmation',
    userId: user?._id,
    metadata: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

/** Status / delivery updates with tracking details */
exports.sendOrderStatusEmail = async (user, order, statusLabel) => {
  const to = user?.email;
  if (!to) return { success: false };

  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const trackUrl = `${clientUrl}/track-order/${order.orderNumber}`;
  const latest = order.tracking?.[order.tracking.length - 1];
  const isDelivered = String(order.status).toLowerCase() === 'delivered';

  const html = brandWrap(`
    <h2 style="color: #1F5570; margin-top: 0;">
      ${isDelivered ? 'Your order has been delivered' : 'Order tracking update'}
    </h2>
    <p>Dear ${user.name || 'Customer'},</p>
    <p>Order <strong>#${order.orderNumber}</strong> is now <strong>${(statusLabel || order.status || '').toUpperCase()}</strong>.</p>
    ${latest?.message ? `<p style="background:#F6F0E4;padding:12px 16px;border-radius:10px;">${latest.message}${latest.location ? ` · ${latest.location}` : ''}</p>` : ''}
    <p>Estimated delivery: <strong>${order.estimatedDelivery || '5–7 business days'}</strong></p>
    <p><a href="${trackUrl}" style="color:#1F5570;font-weight:600;">View full tracking →</a></p>
    <p style="margin-top: 24px;">Thank you for shopping with Manikanta Khadi &amp; Handlooms.</p>
  `);

  return sendEmail({
    to,
    subject: isDelivered
      ? `Delivered: Order #${order.orderNumber} — Manikanta Khadi`
      : `Update: Order #${order.orderNumber} is ${order.status}`,
    html,
    template: 'order_status',
    userId: user._id,
    metadata: { orderId: order._id, status: order.status },
  });
};

exports.sendEmail = sendEmail;
exports.smtpConfigured = smtpConfigured;
