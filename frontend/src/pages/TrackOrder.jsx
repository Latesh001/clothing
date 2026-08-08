import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiPackage } from 'react-icons/fi';
import { orderAPI } from '../services/api';

const TrackOrder = () => {
  const { orderNumber: paramOrderNumber } = useParams();
  const [orderNumber, setOrderNumber] = useState(paramOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.track(orderNumber);
      setOrder(res.data.order);
    } catch {
      setError('Order not found. Please check your order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Track Order | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <FiPackage size={48} className="mx-auto text-[#8B4513] mb-4" />
          <h1 className="font-serif text-3xl mb-2">Track Your Order</h1>
          <p className="text-gray-500">Enter your order number to track delivery status</p>
        </div>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g., MKH12345678)" required
            className="flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:border-[#8B4513]" />
          <button type="submit" disabled={loading} className="btn-primary-custom px-6 flex items-center gap-2">
            <FiSearch /> {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}

        {order && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-bold text-lg">#{order.orderNumber}</p>
                <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="px-3 py-1 bg-[#8B4513]/10 text-[#8B4513] rounded-full text-sm capitalize font-medium">{order.status}</span>
            </div>

            <div className="space-y-4">
              {order.tracking?.map((track, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${i === order.tracking.length - 1 ? 'bg-[#8B4513]' : 'bg-gray-300'}`} />
                    {i < order.tracking.length - 1 && <div className="w-0.5 h-8 bg-gray-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium capitalize">{track.status.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">{track.message}</p>
                    <p className="text-xs text-gray-400">{new Date(track.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#F5F0E8] rounded-xl">
              <p className="text-sm"><strong>Estimated Delivery:</strong> {order.estimatedDelivery}</p>
              <p className="text-sm mt-1"><strong>Total:</strong> ₹{order.totalAmount?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TrackOrder;
