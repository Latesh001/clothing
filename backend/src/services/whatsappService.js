const twilio = require('twilio');
const WhatsAppLog = require('../models/WhatsAppLog');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const sendWhatsApp = async ({ to, message, userId, type, metadata }) => {
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:+91${to.replace(/^\+91/, '')}`;

  const log = await WhatsAppLog.create({
    to: formattedTo,
    message,
    user: userId,
    type,
    status: 'pending',
    metadata,
  });

  try {
    const client = getClient();
    if (!client) {
      console.log(`📱 WhatsApp (dev mode): To: ${formattedTo}\n${message}`);
      log.status = 'sent';
      await log.save();
      return { success: true, message: 'WhatsApp logged (dev mode)' };
    }

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: formattedTo,
      body: message,
    });

    log.status = 'sent';
    log.twilioSid = result.sid;
    await log.save();
    return { success: true, sid: result.sid };
  } catch (error) {
    log.status = 'failed';
    log.error = error.message;
    await log.save();
    console.error('WhatsApp send error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendCartUpdateWhatsApp = async (user, cart) => {
  if (!user.phone) return { success: false, message: 'No phone number' };

  const productList = cart.items.map((item, i) => {
    const name = item.product?.name || 'Product';
    return `${i + 1}. ${name} x ${item.quantity} - ₹${item.price * item.quantity}`;
  }).join('\n');

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const message = `Hello ${user.name || 'Customer'},

Thank you for shopping with Manikanta Khadi & Handlooms.

The following products have been added to your cart:

${productList}

Total Amount: ₹${total}

Continue Shopping or visit our website to complete your purchase.

Happy Shopping!

- Manikanta Khadi & Handlooms`;

  return sendWhatsApp({
    to: user.phone,
    message,
    userId: user._id,
    type: 'cart_update',
    metadata: { cartId: cart._id },
  });
};

exports.sendOrderConfirmationWhatsApp = async (user, order) => {
  if (!user.phone) return { success: false };

  const message = `Hello ${user.name},

Your order #${order.orderNumber} has been confirmed!

Total: ₹${order.totalAmount}
Payment: ${order.paymentMethod.toUpperCase()}
Estimated Delivery: ${order.estimatedDelivery}

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

exports.sendWhatsApp = sendWhatsApp;
