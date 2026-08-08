import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingCart, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const navigate = useNavigate();

  useEffect(() => {
    const current = localStorage.getItem('adminToken');
    setToken(current);
  }, []);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    navigate('/admin/login', { replace: true });
  };

  const links = [
    { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
    { to: '/admin/products', label: 'Products', icon: FiPackage },
    { to: '/admin/orders', label: 'Orders', icon: FiShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1C2E3A] text-white transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-white">Admin Panel</h2>
            <p className="text-xs text-[#E8E0D0] mt-1">Manikanta Khadi</p>
          </div>
          <button
            type="button"
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <FiX size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-white/15 text-white' : 'text-[#F3EFE6] hover:bg-white/10'
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-8 py-3 text-red-300 hover:text-red-200 mt-auto absolute bottom-4 left-0"
        >
          <FiLogOut size={18} /> Logout
        </button>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-4 py-4 flex items-center gap-4 lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <FiMenu size={24} />
          </button>
          <h1 className="font-serif text-lg text-[#1A1714]">Admin Dashboard</h1>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
