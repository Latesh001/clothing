import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAPI } from '../../services/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import { IMAGES } from '../../utils/images';
import toast from 'react-hot-toast';

const paymentClass = (status) => {
  if (status === 'paid') return 'bg-green-100 text-green-700';
  if (status === 'awaiting_verification') return 'bg-blue-100 text-blue-700';
  if (status === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [verifyOrder, setVerifyOrder] = useState(null);
  const [upiTxnId, setUpiTxnId] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('all');
  const autoExpanded = useRef(false);

  const isOpen = (id) => expandedIds.has(id);

  const showOrder = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const hideOrder = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const fetchOrders = useCallback(() => {
    adminAPI
      .getOrders({ limit: 100 })
      .then((res) => {
        const list = res.data.orders || [];
        setOrders(list);
        if (!autoExpanded.current) {
          const toOpen = list
            .filter((o) => ['paid', 'awaiting_verification'].includes(o.paymentStatus))
            .map((o) => o._id);
          if (toOpen.length) {
            setExpandedIds(new Set(toOpen));
            autoExpanded.current = true;
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 20000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    try {
      await adminAPI.updateOrderStatus(id, { status, message: `Order ${status}` });
      toast.success('Status updated');
      fetchOrders();
    } catch {
      toast.error('Update failed');
    }
  };

  const verifyUpi = async (approve) => {
    if (approve && !upiTxnId.trim()) {
      toast.error('Enter UTR / transaction ID');
      return;
    }
    try {
      await adminAPI.verifyUpiPayment(verifyOrder._id, {
        upiTransactionId: upiTxnId.trim(),
        notes: notes || (approve ? 'Verified against bank/UPI statement' : 'UTR rejected'),
        approve,
      });
      toast.success(approve ? 'UPI payment verified' : 'Payment rejected');
      showOrder(verifyOrder._id);
      setVerifyOrder(null);
      setUpiTxnId('');
      setNotes('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const filtered = orders.filter((order) => {
    if (filter === 'paid') return order.paymentStatus === 'paid';
    if (filter === 'awaiting') return order.paymentStatus === 'awaiting_verification';
    if (filter === 'pending') return order.paymentStatus === 'pending';
    return true;
  });

  const paidCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const awaitingCount = orders.filter((o) => o.paymentStatus === 'awaiting_verification').length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl mb-1">Orders</h1>
          <p className="text-sm text-gray-500">
            Paid orders show full product details for packing & shipping
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'awaiting', label: `Awaiting UTR (${awaitingCount})` },
            { id: 'paid', label: `Paid (${paidCount})` },
            { id: 'pending', label: 'Unpaid' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                filter === f.id ? 'bg-[#2A3F4F] text-white' : 'bg-white border text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchOrders}
            className="px-3 py-1.5 rounded-full text-sm border bg-white text-[#8B4513]"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">Loading orders...</div>
        ) : !filtered.length ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-gray-500">
            No orders in this filter yet.
          </div>
        ) : (
          filtered.map((order) => {
            const open = isOpen(order._id);

            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  order.paymentStatus === 'paid'
                    ? 'border-green-200'
                    : order.paymentStatus === 'awaiting_verification'
                      ? 'border-blue-200'
                      : 'border-gray-100'
                }`}
              >
                <div className="p-4 md:p-5 flex flex-wrap gap-4 items-start justify-between">
                  <div className="min-w-[160px]">
                    <p className="font-semibold text-[#1A1714]">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm mt-2">
                      {order.user?.name || 'Customer'}
                      <span className="block text-xs text-gray-500">{order.user?.email}</span>
                      {order.user?.phone && (
                        <span className="block text-xs text-gray-500">{order.user.phone}</span>
                      )}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-bold text-[#8B4513]">{formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">Shipping: Free</p>
                    <span
                      className={`inline-block mt-2 text-xs px-2 py-1 rounded capitalize ${paymentClass(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentMethod === 'upi_qr' ? 'UPI QR' : 'COD'} ·{' '}
                      {order.paymentStatus?.replace(/_/g, ' ')}
                    </span>
                    {order.upiTransactionId && (
                      <p className="text-xs font-mono text-gray-600 mt-1">
                        UTR: {order.upiTransactionId}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="text-sm px-2 py-1.5 rounded border bg-white"
                    >
                      {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {order.items?.length || 0} product{(order.items?.length || 0) === 1 ? '' : 's'}
                    </span>
                    {open ? (
                      <button
                        type="button"
                        onClick={() => hideOrder(order._id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-white border border-[#2A3F4F] text-[#2A3F4F] hover:bg-[#F3EFE6]"
                      >
                        Hide ▲
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => showOrder(order._id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[#2A3F4F] text-white hover:bg-[#1C2E3A]"
                      >
                        View ▼
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="border-t bg-[#FAF8F5] px-4 md:px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-[#1A1714]">
                        Ordered products
                        {order.paymentStatus === 'paid' && (
                          <span className="ml-2 text-green-700 font-normal">· Payment completed</span>
                        )}
                        {order.paymentStatus === 'awaiting_verification' && (
                          <span className="ml-2 text-blue-700 font-normal">· Awaiting UTR verification</span>
                        )}
                      </h3>
                      {order.paymentMethod === 'upi_qr' &&
                        ['pending', 'awaiting_verification', 'failed'].includes(order.paymentStatus) && (
                          <button
                            type="button"
                            onClick={() => {
                              setVerifyOrder(order);
                              setUpiTxnId(order.upiTransactionId || '');
                              setNotes('');
                            }}
                            className="text-xs font-medium text-white bg-[#8B4513] px-3 py-1.5 rounded-lg"
                          >
                            {order.paymentStatus === 'awaiting_verification'
                              ? 'Review & Verify UTR'
                              : 'Verify UPI'}
                          </button>
                        )}
                    </div>

                    <div className="space-y-3">
                      {(order.items || []).map((item, idx) => (
                        <div
                          key={`${order._id}-${idx}`}
                          className="flex gap-3 bg-white rounded-xl border border-[#E8E0D0] p-3"
                        >
                          <img
                            src={getImageUrl(item.image) || IMAGES.fallback}
                            alt={item.name}
                            className="w-16 h-20 object-cover rounded-lg bg-[#E8E0D0] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#1A1714] line-clamp-2">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.sku && <span>SKU: {item.sku} · </span>}
                              Qty: {item.quantity}
                              {item.size ? ` · Size: ${item.size}` : ''}
                              {item.color ? ` · Color: ${item.color}` : ''}
                            </p>
                            <p className="text-sm font-semibold text-[#8B4513] mt-1">
                              {formatPrice(item.totalPrice ?? item.offerPrice * item.quantity)}
                              {item.mrp > item.offerPrice && (
                                <span className="ml-2 text-xs text-gray-400 line-through font-normal">
                                  {formatPrice(item.mrp * item.quantity)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                      {!order.items?.length && (
                        <p className="text-sm text-gray-500">No product lines on this order.</p>
                      )}
                    </div>

                    {order.shippingAddress && (
                      <div className="mt-4 pt-3 border-t border-[#E8E0D0] text-sm text-gray-600">
                        <p className="font-medium text-[#1A1714] mb-1">Ship to</p>
                        <p>
                          {order.shippingAddress.fullName}
                          {order.shippingAddress.phone ? ` · ${order.shippingAddress.phone}` : ''}
                        </p>
                        <p>
                          {[
                            order.shippingAddress.addressLine1,
                            order.shippingAddress.addressLine2,
                            order.shippingAddress.city,
                            order.shippingAddress.state,
                            order.shippingAddress.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {verifyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif text-xl">Verify UPI — #{verifyOrder.orderNumber}</h2>
            <p className="text-sm text-gray-600">
              Amount: {formatPrice(verifyOrder.totalAmount)} · Confirm UTR in your UPI/bank app before approving.
            </p>

            <div className="space-y-2 bg-[#FAF8F5] rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">Products in this order</p>
              {(verifyOrder.items || []).map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center text-sm">
                  <img
                    src={getImageUrl(item.image) || IMAGES.fallback}
                    alt=""
                    className="w-10 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-[#8B4513] font-medium">
                    {formatPrice(item.totalPrice ?? item.offerPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <input
              value={upiTxnId}
              onChange={(e) => setUpiTxnId(e.target.value.toUpperCase().replace(/[\s\-_.]/g, ''))}
              placeholder="UTR / UPI Transaction ID"
              className="w-full px-4 py-3 rounded-lg border font-mono"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Admin notes (optional)"
              className="w-full px-4 py-3 rounded-lg border"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVerifyOrder(null)}
                className="btn-outline-custom flex-1 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => verifyUpi(false)}
                className="flex-1 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium"
              >
                Reject
              </button>
              <button type="button" onClick={() => verifyUpi(true)} className="btn-primary-custom flex-1 py-2">
                Approve Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
