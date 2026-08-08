import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { user, cart, refreshCart } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  const [paymentMethod, setPaymentMethod] = useState('upi_qr');
  const [upiQr, setUpiQr] = useState(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [confirming, setConfirming] = useState(false);

  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const discount = cart.couponDiscount || 0;
  const total = subtotal + shipping - discount;

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }

    setLoading(true);
    try {
      const res = await orderAPI.create({ shippingAddress: address, paymentMethod });

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully!');
        await refreshCart();
        navigate('/orders');
        return;
      }

      const qr = res.data.upiQr;
      if (!qr?.qrImage) {
        toast.error('Could not generate payment QR. Please try again.');
        return;
      }

      setUpiQr(qr);
      setStep(4);
      await refreshCart();
      toast.success('Order created — scan the QR to pay');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpiPayment = async () => {
    if (!upiTxnId.trim() || upiTxnId.trim().length < 6) {
      toast.error('Enter the UPI transaction / UTR ID from your payment app');
      return;
    }

    setConfirming(true);
    try {
      const res = await orderAPI.confirmUpiPayment({
        orderId: upiQr.orderId,
        upiTransactionId: upiTxnId.trim(),
        paymentToken: upiQr.paymentToken,
      });
      toast.success(
        res.data?.message || 'UTR submitted securely. Awaiting verification.'
      );
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  const refreshQr = async () => {
    if (!upiQr?.orderId) return;
    try {
      const res = await orderAPI.getUpiQr(upiQr.orderId);
      setUpiQr(res.data.upiQr);
      toast.success('QR refreshed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not refresh QR');
    }
  };

  if (!user || (!items.length && step !== 4)) {
    navigate('/cart');
    return null;
  }

  const paymentLabels = {
    upi_qr: 'UPI QR Code',
    cod: 'Cash on Delivery',
  };

  return (
    <>
      <Helmet><title>Checkout | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-serif text-3xl mb-8">Checkout</h1>

        {step !== 4 && (
          <div className="flex items-center gap-4 mb-8">
            {['Address', 'Payment', 'Review'].map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 ${step > i + 1 ? 'text-[#8B4513]' : step === i + 1 ? 'text-[#8B4513] font-bold' : 'text-gray-400'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= i + 1 ? 'bg-[#8B4513] text-white' : 'bg-gray-200'}`}>
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
                <h2 className="font-serif text-xl mb-4">Shipping Address</h2>
                {['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode'].map((field) => (
                  <input
                    key={field}
                    value={address[field]}
                    onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                    placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    required={field !== 'addressLine2'}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-[#8B4513]"
                  />
                ))}
                <button onClick={() => setStep(2)} className="btn-primary-custom w-full py-3">
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
                <h2 className="font-serif text-xl mb-4">Payment Method</h2>
                {[
                  {
                    id: 'upi_qr',
                    label: 'UPI Dynamic QR',
                    desc: 'Scan a unique QR with any UPI app (GPay, PhonePe, Paytm, BHIM)',
                  },
                  {
                    id: 'cod',
                    label: 'Cash on Delivery',
                    desc: 'Pay when you receive your order',
                  },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === method.id ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </label>
                ))}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-outline-custom flex-1 py-3">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn-primary-custom flex-1 py-3">
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
                <h2 className="font-serif text-xl mb-4">Order Review</h2>
                {items.map((item) => (
                  <div key={item._id} className="flex gap-3 py-3 border-b">
                    <img src={item.product?.images?.[0]?.url} alt="" className="w-16 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product?.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="p-4 bg-[#F5F0E8] rounded-xl text-sm">
                  <p>
                    <strong>Deliver to:</strong> {address.fullName}, {address.addressLine1}, {address.city} -{' '}
                    {address.pincode}
                  </p>
                  <p className="mt-1">
                    <strong>Payment:</strong> {paymentLabels[paymentMethod]}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-outline-custom flex-1 py-3">
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary-custom flex-1 py-3 disabled:opacity-50"
                  >
                    {loading
                      ? 'Processing...'
                      : paymentMethod === 'upi_qr'
                        ? `Generate QR • ${formatPrice(total)}`
                        : `Place Order • ${formatPrice(total)}`}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && upiQr && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-5">
                <div>
                  <h2 className="font-serif text-xl mb-1">Pay with UPI QR</h2>
                  <p className="text-sm text-gray-500">
                    Order <strong>#{upiQr.orderNumber}</strong> — scan with any UPI app
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 py-2">
                  <img
                    src={upiQr.qrImage}
                    alt="UPI payment QR code"
                    className="w-64 h-64 border border-gray-100 rounded-xl bg-white"
                  />
                  <p className="text-2xl font-serif text-[#8B4513]">₹{upiQr.amount}</p>
                  <p className="text-sm text-[#3D3832] text-center">
                    Pay to <strong>{upiQr.payeeName || 'Manikanta Khadi Handlooms'}</strong>
                    <br />
                    <span className="text-xs text-[#4A433C]">
                      Scan with any UPI app — merchant ID is kept private for security
                    </span>
                  </p>
                </div>

                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside bg-[#F5F0E8] rounded-xl p-4">
                  <li>Open GPay, PhonePe, Paytm, or any UPI app</li>
                  <li>Scan this QR code (amount is filled automatically)</li>
                  <li>Complete payment and copy the UTR / transaction ID</li>
                  <li>Enter the UTR below and confirm</li>
                </ol>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button type="button" onClick={refreshQr} className="btn-outline-dark px-4 py-2 text-sm inline-flex">
                    Refresh QR
                  </button>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Enter the exact 12-digit UTR / UPI reference from your payment receipt.
                    Fake or reused IDs are blocked. Payment is confirmed only after verification.
                  </p>
                  <label className="block text-sm font-medium">
                    UPI Transaction / UTR ID
                    <input
                      value={upiTxnId}
                      onChange={(e) => setUpiTxnId(e.target.value.toUpperCase().replace(/[\s\-_.]/g, ''))}
                      placeholder="12-digit UTR e.g. 409512345678"
                      maxLength={22}
                      autoComplete="off"
                      spellCheck={false}
                      className="mt-1 w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-[#8B4513] font-mono tracking-wider"
                    />
                  </label>
                  <button
                    onClick={handleConfirmUpiPayment}
                    disabled={confirming || upiTxnId.replace(/\D/g, '').length < 8}
                    className="btn-primary-custom w-full py-3 disabled:opacity-50"
                  >
                    {confirming ? 'Submitting securely...' : 'Submit UTR for Verification'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/orders')}
                    className="w-full text-sm text-gray-500 hover:text-[#8B4513] py-2"
                  >
                    I'll confirm later from My Orders
                  </button>
                </div>
              </div>
            )}
          </div>

          {step !== 4 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border h-fit">
              <h3 className="font-serif text-lg mb-4">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#8B4513]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Checkout;
