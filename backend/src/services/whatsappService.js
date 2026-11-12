const twilio = require('twilio');
const WhatsAppLog = require('../models/WhatsAppLog');

/** Admin WhatsApp — store owner receives cart / order item lists */
const getAdminPhone = () => {
  const raw = process.env.ADMIN_WHATSAPP_NUMBER || process.env.ADMIN_PHONE || '8074181510';
  return normalizePhone(raw);
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return digits;
  return digits;
};

const toWhatsAppAddress = (phone) => {
  if (!phone) return '';
  if (String(phone).startsWith('whatsapp:')) return phone;
  return `whatsapp:+${normalizePhone(phone)}`;
};

const buildWaMeUrl = (phone, message) => {
  const digits = normalizePhone(phone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

const isTwilioConfigured = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID || '';
  const token = process.env.TWILIO_AUTH_TOKEN || '';
  return Boolean(sid && token && !sid.includes('your_twilio') && !token.includes('your_twilio'));
};

const getClient = () => {
  if (!isTwilioConfigured()) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const formatCartLines = (cart) => {
  const items = cart?.items || [];
  return items
    .map((item, i) => {
      const name = item.product?.name || item.name || 'Product';
      const qty = item.quantity || 1;
      const price = item.price ?? item.offerPrice ?? item.product?.offerPrice ?? 0;
      const size = item.size ? ` | Size: ${item.size}` : '';
      const color = item.color ? ` | Color: ${item.color}` : '';
      return `${i + 1}. ${name}${size}${color}\n   Qty: ${qty} × ₹${price} = ₹${qty * price}`;
    })
    .join('\n');
};

const cartTotal = (cart) =>
  (cart?.items || []).reduce((sum, item) => {
    const price = item.price ?? item.offerPrice ?? item.product?.offerPrice ?? 0;
    return sum + price * (item.quantity || 1);
  }, 0);

const formatOrderLines = (order) => {
  const items = order?.items || [];
  return items
    .map((item, i) => {
      const name = item.name || 'Product';
      const qty = item.quantity || 1;
      const price = item.offerPrice ?? item.price ?? 0;
      const size = item.size ? ` | Size: ${item.size}` : '';
      const color = item.color ? ` | Color: ${item.color}` : '';
      return `${i + 1}. ${name}${size}${color}\n   Qty: ${qty} × ₹${price} = ₹${item.totalPrice ?? qty * price}`;
    })
    .join('\n');
};

const sendWhatsApp = async ({ to, message, userId, type, metadata }) => {
  const formattedTo = toWhatsAppAddress(to);
  const waMeUrl = buildWaMeUrl(to, message);

  const log = await WhatsAppLog.create({
    to: formattedTo || to,
    message,
    user: userId,
    type,
    status: 'pending',
    metadata: { ...metadata, waMeUrl },
  });

  try {
    const client = getClient();
    if (!client) {
      console.log(`📱 WhatsApp (dev / no Twilio): To: ${formattedTo}\n${message}\nLink: ${waMeUrl}`);
      log.status = 'sent';
      await log.save();
      return {
        success: true,
        sentViaTwilio: false,
        message: 'WhatsApp logged (open wa.me link to deliver)',
        waMeUrl,
      };
    }

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formattedTo,
      body: message,
    });

    log.status = 'sent';
    log.twilioSid = result.sid;
    await log.save();
    return { success: true, sentViaTwilio: true, sid: result.sid, waMeUrl };
  } catch (error) {
    log.status = 'failed';
    log.error = error.message;
    await log.save();
    console.error('WhatsApp send error:', error.message);
    return { success: false, sentViaTwilio: false, error: error.message, waMeUrl };
  }
};

/** Customer cart confirmation (optional — needs user phone) */
exports.sendCartUpdateWhatsApp = async (user, cart) => {
  if (!user?.phone) return { success: false, message: 'No phone number' };

  const productList = formatCartLines(cart);
  const total = cartTotal(cart);

  const message = `Hello ${user.name || 'Customer'},

Thank you for shopping with Manikanta Khadi & Handlooms.

Items in your cart:

${productList}

Total Amount: ₹${total}

Continue shopping or complete your purchase on our website.

- Manikanta Khadi & Handlooms`;

  return sendWhatsApp({
    to: user.phone,
    message,
    userId: user._id,
    type: 'cart_update',
    metadata: { cartId: cart._id },
  });
};

/** Admin alert — item list whenever customer adds to cart */
exports.sendAdminCartAlert = async (user, cart, addedProductName) => {
  const adminPhone = getAdminPhone();
  if (!adminPhone) return { success: false, message: 'Admin WhatsApp not configured' };

  const productList = formatCartLines(cart);
  const total = cartTotal(cart);
  const customerName = user?.name || 'Customer';
  const customerPhone = user?.phone ? normalizePhone(user.phone) : 'N/A';
  const customerEmail = user?.email || 'N/A';

  const message = `🛒 *New Cart Update — Manikanta Khadi*

Customer: ${customerName}
Phone: ${customerPhone}
Email: ${customerEmail}
${addedProductName ? `\nJust added: ${addedProductName}\n` : ''}
*Cart items:*
${productList || '(empty)'}

*Cart total: ₹${total}*

Please follow up if needed.`;

  return sendWhatsApp({
    to: adminPhone,
    message,
    userId: user?._id,
    type: 'admin_cart_alert',
    metadata: { cartId: cart?._id, addedProductName },
  });
};

/** Customer order confirmation */
exports.sendOrderConfirmationWhatsApp = async (user, order) => {
  if (!user?.phone) return { success: false };

  const lines = formatOrderLines(order);
  const message = `Hello ${user.name || 'Customer'},

Your order *#${order.orderNumber}* has been confirmed!

${lines}

Total: ₹${order.totalAmount}
Payment: ${(order.paymentMethod || '').toUpperCase()}
Estimated Delivery: ${order.estimatedDelivery || '5-7 business days'}

Track your order on our website.

Thank you for shopping with Manikanta Khadi & Handlooms!`;

  return sendWhatsApp({
    to: user.phone,
    message,
    userId: user._id,
    type: 'order_confirmation',
    metadata: { orderId: order._id },
  });
};

/** Admin alert — full purchase / order item list */
exports.sendAdminOrderAlert = async (user, order) => {
  const adminPhone = getAdminPhone();
  if (!adminPhone) return { success: false, message: 'Admin WhatsApp not configured' };

  const lines = formatOrderLines(order);
  const addr = order.shippingAddress || {};
  const addressLine = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.pincode,
    addr.phone,
  ]
    .filter(Boolean)
    .join(', ');

  const message = `🛍️ *New Order — Manikanta Khadi*

Order: *#${order.orderNumber}*
Customer: ${user?.name || addr.fullName || 'Customer'}
Phone: ${user?.phone ? normalizePhone(user.phone) : addr.phone || 'N/A'}
Email: ${user?.email || 'N/A'}

*Items ordered:*
${lines}

Subtotal: ₹${order.subtotal ?? order.totalAmount}
Discount: ₹${order.discount || 0}
*Total: ₹${order.totalAmount}*
Payment: ${(order.paymentMethod || '').toUpperCase()}
${addressLine ? `\nShip to: ${addressLine}` : ''}
${order.notes ? `\nNotes: ${order.notes}` : ''}

Please process this order.`;

  return sendWhatsApp({
    to: adminPhone,
    message,
    userId: user?._id,
    type: 'admin_order_alert',
    metadata: { orderId: order._id, orderNumber: order.orderNumber },
  });
};

exports.sendWhatsApp = sendWhatsApp;
exports.getAdminPhone = getAdminPhone;
exports.buildWaMeUrl = buildWaMeUrl;
exports.normalizePhone = normalizePhone;
