import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiUser, FiPackage, FiHeart, FiMapPin, FiLogOut, FiEdit2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { authAPI, orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const Account = () => {
  const { user, logout, setShowLoginModal, refreshCart } = useAuth();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
      orderAPI.getAll().then(res => setOrders(res.data.orders)).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiUser size={64} className="mx-auto text-gray-300 mb-4" />
        <button onClick={() => setShowLoginModal(true)} className="btn-primary-custom">Login to view account</button>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(editForm);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'orders', label: 'Orders', icon: FiPackage },
    { id: 'addresses', label: 'Addresses', icon: FiMapPin },
  ];

  return (
    <>
      <Helmet><title>My Account | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-8">My Account</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${tab === id ? 'bg-[#8B4513] text-white' : 'bg-white hover:bg-gray-50'}`}>
                <Icon size={18} /> {label}
              </button>
            ))}
            <Link to="/wishlist" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-50">
              <FiHeart size={18} /> Wishlist
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50">
              <FiLogOut size={18} /> Logout
            </button>
          </div>

          <div className="lg:col-span-3">
            {tab === 'profile' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-serif text-xl mb-6 flex items-center gap-2"><FiEdit2 /> Edit Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Full Name" className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-[#8B4513]" />
                  <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="Email" type="email" className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-[#8B4513]" />
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="Phone" className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-[#8B4513]" />
                  <button type="submit" className="btn-primary-custom py-3 px-8">Save Changes</button>
                </form>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-serif text-xl mb-4">Order History</h2>
                {orders.length ? orders.map(order => (
                  <div key={order._id} className="bg-white rounded-2xl p-6 shadow-sm border">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{order.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{order.items?.length} item(s) • ₹{order.totalAmount?.toLocaleString('en-IN')}</p>
                      <Link to={`/track-order/${order.orderNumber}`} className="text-[#8B4513] text-sm font-medium hover:underline">Track Order</Link>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500">No orders yet. <Link to="/shop" className="text-[#8B4513]">Start shopping</Link></p>
                )}
              </div>
            )}

            {tab === 'addresses' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="font-serif text-xl mb-4">Saved Addresses</h2>
                {user.addresses?.length ? user.addresses.map(addr => (
                  <div key={addr._id} className="p-4 border rounded-xl mb-3">
                    <p className="font-medium">{addr.fullName}</p>
                    <p className="text-sm text-gray-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    {addr.isDefault && <span className="text-xs bg-[#8B4513]/10 text-[#8B4513] px-2 py-0.5 rounded mt-2 inline-block">Default</span>}
                  </div>
                )) : <p className="text-gray-500">No saved addresses</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
