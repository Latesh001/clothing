const QRCode = require('qrcode');

/**
 * Build a UPI deep-link for dynamic QR payments.
 * Format: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
 */
exports.buildUpiPaymentLink = ({ amount, orderNumber, transactionNote }) => {
  const upiId = process.env.UPI_ID || 'manikantakhadi@upi';
  const payeeName = process.env.UPI_PAYEE_NAME || 'Manikanta Khadi Handlooms';
  const am = Number(amount).toFixed(2);
  const tn = encodeURIComponent(transactionNote || `Order ${orderNumber}`);
  const pn = encodeURIComponent(payeeName);

  const upiString =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${pn}` +
    `&am=${am}` +
    `&cu=INR` +
    `&tn=${tn}`;

  return { upiId, payeeName, amount: am, upiString };
};

exports.generateUpiQr = async ({ amount, orderNumber }) => {
  const payment = exports.buildUpiPaymentLink({
    amount,
    orderNumber,
    transactionNote: `MKH ${orderNumber}`,
  });

  const qrImage = await QRCode.toDataURL(payment.upiString, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: { dark: '#1C2E3A', light: '#FFFFFF' },
  });

  return {
    ...payment,
    qrImage,
    expiresInMinutes: Number(process.env.UPI_QR_EXPIRE_MINUTES) || 30,
  };
};
