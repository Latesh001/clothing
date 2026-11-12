import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiTrendingUp, FiAlertTriangle } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { formatPrice } from '../../utils/helpers';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setStats(res.data.stats))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}</div>;
  if (error) return <div className="bg-white rounded-2xl border p-8 text-center text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiPackage} label="Total Products" value={stats?.totalProducts || 0} color="bg-blue-100 text-blue-600" />
        <StatCard icon={FiShoppingCart} label="Total Orders" value={stats?.totalOrders || 0} color="bg-green-100 text-green-600" />
        <StatCard icon={FiUsers} label="Total Customers" value={stats?.totalCustomers || 0} color="bg-purple-100 text-purple-600" />
        <StatCard icon={FiTrendingUp} label="Total Revenue" value={formatPrice(stats?.totalRevenue || 0)} color="bg-[#8B4513]/10 text-[#8B4513]" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Latest Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">Latest Orders</h2>
            <Link to="/admin/orders" className="text-[#8B4513] text-sm">View All</Link>
          </div>
          <div className="space-y-3">
            {stats?.latestOrders?.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-sm">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatPrice(order.totalAmount)}</p>
                  <span className="text-xs capitalize px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-orange-500" /> Low Stock Alerts
          </h2>
          <div className="space-y-3">
            {stats?.lowStockProducts?.length ? stats.lowStockProducts.map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <p className="text-sm font-medium">{p.name}</p>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">{p.stock} left</span>
              </div>
            )) : <p className="text-gray-500 text-sm">All products well stocked</p>}
          </div>
        </div>
      </div>

      {/* Revenue Chart placeholder */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border mt-6">
        <h2 className="font-serif text-xl mb-4">Revenue (Last 30 Days)</h2>
        <div className="h-48 flex items-end gap-1">
          {stats?.revenueChart?.slice(-14).map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#8B4513]/80 rounded-t" style={{ height: `${Math.max(4, (day.revenue / (stats.totalRevenue || 1)) * 150)}px` }} />
              <span className="text-[10px] text-gray-400 rotate-45 origin-left">{day._id?.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
