import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { wishlistAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const Wishlist = () => {
  const { user, wishlist, refreshWishlist, setShowLoginModal } = useAuth();

  useEffect(() => {
    if (user) refreshWishlist();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <FiHeart size={64} className="mx-auto text-gray-300 mb-4" />
        <button onClick={() => setShowLoginModal(true)} className="btn-primary-custom">Login to view wishlist</button>
      </div>
    );
  }

  const products = wishlist.products || [];

  return (
    <>
      <Helmet><title>Wishlist | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl mb-8">My Wishlist ({products.length})</h1>
        {products.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(p => <ProductCard key={p._id || p} product={typeof p === 'object' ? p : { _id: p }} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <FiHeart size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Your wishlist is empty</p>
            <Link to="/shop" className="btn-primary-custom">Explore Products</Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Wishlist;
