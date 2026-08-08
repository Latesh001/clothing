import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { cartAPI } from '../services/api';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

const Cart = () => {
  const { user, cart, refreshCart, setShowLoginModal } = useAuth();

  useEffect(() => {
    if (user) refreshCart();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="font-serif text-2xl mb-4">Your cart is waiting</h2>
        <button onClick={() => setShowLoginModal(true)} className="btn-primary-custom">Login to continue</button>
      </div>
    );
  }

  const items = cart.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 0;
  const discount = cart.couponDiscount || 0;
  const total = subtotal + shipping - discount;

  const updateQuantity = async (itemId, quantity) => {
    try {
      await cartAPI.update(itemId, { quantity });
      await refreshCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const removeItem = async (itemId) => {
    await cartAPI.remove(itemId);
    await refreshCart();
    toast.success('Item removed');
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    const code = e.target.coupon.value;
    try {
      await cartAPI.applyCoupon(code);
      await refreshCart();
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  if (!items.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="font-serif text-2xl mb-4">Your cart is empty</h2>
        <Link to="/shop" className="btn-primary-custom">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Shopping Cart | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-8">Shopping Cart ({items.length} items)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item._id} className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border">
                <img src={item.product?.images?.[0]?.url} alt={item.product?.name} className="w-24 h-32 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-medium">{item.product?.name}</h3>
                  <p className="text-sm text-gray-500">{item.size && `Size: ${item.size}`} {item.color && `• Color: ${item.color}`}</p>
                  <p className="font-bold text-[#8B4513] mt-2">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center border rounded-lg">
                      <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="p-1.5"><FiMinus size={14} /></button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="p-1.5"><FiPlus size={14} /></button>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="text-red-500 hover:text-red-700"><FiTrash2 size={18} /></button>
                  </div>
                </div>
                <div className="text-right font-bold">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border h-fit sticky top-24">
            <h3 className="font-serif text-xl mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-{formatPrice(discount)}</span></div>}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span><span className="text-[#8B4513]">{formatPrice(total)}</span>
              </div>
            </div>

            <form onSubmit={applyCoupon} className="flex gap-2 mt-4">
              <input name="coupon" placeholder="Coupon code" className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-[#8B4513]" />
              <button type="submit" className="btn-outline-custom py-2 px-4 text-sm">Apply</button>
            </form>

            <p className="text-xs text-gray-500 mt-3">Estimated delivery: 5-7 business days</p>

            <Link to="/checkout" className="block w-full btn-primary-custom text-center mt-6 py-3">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
