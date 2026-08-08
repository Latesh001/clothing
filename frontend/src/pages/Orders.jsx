import { Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const paymentBadge = (status) => {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'awaiting_verification') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [payingOrder, setPayingOrder] = useState(null);
  const [upiQr, setUpiQr] = useState(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [loading, setLoading] = useState(false);

  const loadOrders = () => {
    if (user) orderAPI.getAll().then((res) => setOrders(res.data.orders)).catch(() => {});
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  const openUpiPay = async (order) => {
    setPayingOrder(order);
    setUpiTxnId('');
    try {
      const res = await orderAPI.getUpiQr(order._id);
      setUpiQr(res.data.upiQr);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load QR');
      setPayingOrder(null);
    }
  };

  const confirmPayment = async () => {
    const cleaned = upiTxnId.trim().toUpperCase().replace(/[\s\-_.]/g, '');
    if (cleaned.length < 12) {
      toast.error('Enter the full 12+ character UTR from your payment receipt');
      return;
    }
    setLoading(true);
    try {
      const res = await orderAPI.confirmUpiPayment({
        orderId: payingOrder._id,
        upiTransactionId: cleaned,
        paymentToken: upiQr.paymentToken,
      });
      toast.success(res.data?.message || 'UTR submitted for verification');
      setPayingOrder(null);
      setUpiQr(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl mb-8">My Orders</h1>
      {orders.map((order) => (
        <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border mb-4">
          <div className="flex justify-between mb-4">
            <div>
              <p className="font-bold">#{order.orderNumber}</p>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right space-y-1">
              <span className="capitalize px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                {order.status}
              </span>
              <p className={`text-xs px-2 py-0.5 rounded inline-block capitalize ${paymentBadge(order.paymentStatus)}`}>
                {order.paymentMethod === 'upi_qr' ? 'UPI QR' : 'COD'} ·{' '}
                {order.paymentStatus?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <p className="text-sm mb-2">
            {order.items?.length} items • ₹{order.totalAmount?.toLocaleString('en-IN')}
            <span className="text-gray-500"> · Free shipping</span>
          </p>
          {order.paymentStatus === 'awaiting_verification' && (
            <p className="text-sm text-blue-700 mb-2">
              UTR submitted{order.upiTransactionId ? ` (${order.upiTransactionId.slice(0, 4)}****${order.upiTransactionId.slice(-4)})` : ''}. Waiting for verification.
            </p>
          )}
          <div className="flex flex-wrap gap-4 items-center">
            <Link to={`/track-order/${order.orderNumber}`} className="text-[#8B4513] text-sm font-medium">
              Track Order →
            </Link>
            {order.paymentMethod === 'upi_qr' &&
              ['pending', 'failed'].includes(order.paymentStatus) && (
                <button
                  type="button"
                  onClick={() => openUpiPay(order)}
                  className="text-sm font-medium text-white bg-[#8B4513] px-3 py-1.5 rounded-lg"
                >
                  Pay via UPI QR
                </button>
              )}
          </div>
        </div>
      ))}
      {!orders.length && (
        <p className="text-gray-500">
          No orders yet. <Link to="/shop" className="text-[#8B4513]">Shop now</Link>
        </p>
      )}

      {payingOrder && upiQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl">Pay for #{payingOrder.orderNumber}</h2>
            <div className="flex flex-col items-center gap-2">
              <img src={upiQr.qrImage} alt="UPI QR" className="w-56 h-56 border rounded-xl" />
              <p className="text-xl font-serif text-[#8B4513]">₹{upiQr.amount}</p>
              <p className="text-sm text-[#3D3832] text-center">
                {upiQr.payeeName || 'Manikanta Khadi Handlooms'}
                <br />
                <span className="text-xs text-[#4A433C]">Merchant UPI ID is hidden for security</span>
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Submit the exact UTR from this payment only. Reused or fake IDs are blocked.
            </p>
            <input
              value={upiTxnId}
              onChange={(e) => setUpiTxnId(e.target.value.toUpperCase().replace(/[\s\-_.]/g, ''))}
              placeholder="12-digit UTR"
              maxLength={22}
              autoComplete="off"
              className="w-full px-4 py-3 rounded-lg border font-mono tracking-wider"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPayingOrder(null);
                  setUpiQr(null);
                }}
                className="btn-outline-custom flex-1 py-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={loading}
                className="btn-primary-custom flex-1 py-2 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit UTR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
