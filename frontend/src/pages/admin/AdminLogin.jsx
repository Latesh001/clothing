import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      toast.error('Enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Clear any stale admin session before login
      localStorage.removeItem('adminToken');

      const res = await adminAPI.login({ email, password });
      const token = res.data?.token;

      if (!token) {
        toast.error('Login failed: no token received');
        return;
      }

      localStorage.setItem('adminToken', token);
      toast.success(res.data?.message || 'Admin login successful');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        (err.message === 'Network Error'
          ? 'Cannot reach server. Is the backend running?'
          : 'Login failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C2E3A] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-[#2A3F4F]">Admin Login</h1>
          <p className="text-[#4A433C] text-sm mt-1">Manikanta Khadi & Handlooms</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Admin Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] text-[#1A1714] focus:outline-none focus:border-[#2A3F4F]"
          />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] text-[#1A1714] focus:outline-none focus:border-[#2A3F4F]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center bg-[#2A3F4F] text-white font-bold py-3 rounded-full hover:bg-[#1C2E3A] transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
