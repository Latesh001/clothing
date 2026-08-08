import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, cartAPI, wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cart, setCart] = useState({ items: [], savedForLater: [] });
  const [wishlist, setWishlist] = useState({ products: [] });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const loadUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const [profileRes, cartRes, wishlistRes] = await Promise.all([
        authAPI.getProfile(),
        cartAPI.get().catch(() => ({ data: { cart: { items: [] } } })),
        wishlistAPI.get().catch(() => ({ data: { wishlist: { products: [] } } })),
      ]);
      setUser(profileRes.data.user);
      setCart(cartRes.data.cart || { items: [] });
      setWishlist(wishlistRes.data.wishlist || { products: [] });
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Show login popup when the app opens and the user is not logged in
  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (sessionStorage.getItem('loginShown') === 'true') return;

    const timer = setTimeout(() => {
      setShowLoginModal(true);
      sessionStorage.setItem('loginShown', 'true');
    }, 400);

    return () => clearTimeout(timer);
  }, [loading, user]);

  const login = async (credentials, type = 'credentials') => {
    try {
      let res;
      if (type === 'google') {
        res = await authAPI.googleLogin(credentials);
      } else if (type === 'otp-verify') {
        res = await authAPI.verifyOTP(credentials);
      } else {
        res = await authAPI.login(credentials);
      }
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setShowLoginModal(false);
      await loadUserData();
      toast.success(res.data.message || 'Login successful');
      return res.data;
    } catch (err) {
      const data = err.response?.data;
      const firstValidation = data?.errors?.[0]?.message;
      toast.error(firstValidation || data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (data) => {
    try {
      const res = await authAPI.register(data);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setShowLoginModal(false);
      toast.success('Welcome to Manikanta Khadi & Handlooms!');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const sendOTP = async (data) => {
    const res = await authAPI.sendOTP(data);
    toast.success(res.data.message);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCart({ items: [] });
    setWishlist({ products: [] });
    toast.success('Logged out successfully');
  };

  const refreshCart = async () => {
    if (!user) return;
    const res = await cartAPI.get();
    setCart(res.data.cart);
  };

  const refreshWishlist = async () => {
    if (!user) return;
    const res = await wishlistAPI.get();
    setWishlist(res.data.wishlist);
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist.products?.length || 0;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, sendOTP,
      showLoginModal, setShowLoginModal,
      cart, setCart, refreshCart, cartCount,
      wishlist, setWishlist, refreshWishlist, wishlistCount,
      theme, toggleTheme,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
