import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { formatPrice, calculateDiscount, getImageUrl } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { cartAPI, wishlistAPI } from '../../services/api';
import { IMAGES } from '../../utils/images';
import toast from 'react-hot-toast';
import 'react-lazy-load-image-component/src/effects/blur.css';

const ProductCard = ({ product }) => {
  const { user, setShowLoginModal, refreshCart, refreshWishlist, wishlist } = useAuth();
  const [imageIndex, setImageIndex] = useState(0);
  const discount = product.discount || calculateDiscount(product.mrp, product.offerPrice);
  const isWishlisted = wishlist.products?.some((p) => (p._id || p) === product._id);

  const images = useMemo(() => {
    const list = (product.images || [])
      .map((img) => getImageUrl(img?.url))
      .filter(Boolean);
    return list.length ? list : [IMAGES.fallback];
  }, [product.images]);

  const hasMultiple = images.length > 1;
  const currentImage = images[Math.min(imageIndex, images.length - 1)];

  const showPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const showNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + 1) % images.length);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      await cartAPI.add({ productId: product._id, quantity: 1 });
      await refreshCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      await wishlistAPI.toggle(product._id);
      await refreshWishlist();
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const productPath = product?.slug || product?._id;
  if (!productPath) return null;

  return (
    <Link to={`/product/${productPath}`} className="product-card group">
      <div
        className="relative aspect-[3/4] overflow-hidden bg-[#E8E0D0]"
        onMouseEnter={() => {
          if (hasMultiple) setImageIndex((i) => (i === 0 ? 1 : i));
        }}
        onMouseLeave={() => setImageIndex(0)}
      >
        <LazyLoadImage
          src={currentImage}
          alt={`${product.name}${hasMultiple ? ` — angle ${imageIndex + 1}` : ''}`}
          effect="blur"
          className="w-full h-full object-cover transition-opacity duration-300"
        />

        {discount > 0 && (
          <span className="badge-sale absolute top-3 left-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-[1]">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-colors z-[1] ${
            isWishlisted ? 'bg-gradient-to-br from-[#D4654A] to-[#C26A3D] text-white' : 'bg-white/95 text-[#3D3832] hover:text-[#D4654A]'
          }`}
          aria-label="Wishlist"
        >
          <FiHeart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Multi-angle controls */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={showPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-[1] w-8 h-8 rounded-full bg-white/90 text-[#1A1714] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label="Previous angle"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-[1] w-8 h-8 rounded-full bg-white/90 text-[#1A1714] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              aria-label="Next angle"
            >
              <FiChevronRight size={18} />
            </button>

            <div className="absolute bottom-14 left-0 right-0 z-[1] flex justify-center gap-1.5 px-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImageIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === imageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                  }`}
                  aria-label={`View angle ${i + 1}`}
                />
              ))}
            </div>

            <span className="absolute bottom-3 left-3 z-[1] text-[10px] font-semibold uppercase tracking-wider bg-black/45 text-white px-2 py-0.5 rounded-full">
              {imageIndex + 1}/{images.length} angles
            </span>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-[1]">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-[#1F5570] to-[#1F6A7A] text-white py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg"
          >
            <FiShoppingBag size={14} /> Add to Cart
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#C26A3D] mb-1.5 font-semibold">
          {product.fabric || product.category?.name || 'Handloom'}
          {hasMultiple ? ` · ${images.length} views` : ''}
        </p>
        <h3 className="font-semibold text-[0.95rem] text-[#1A1714] line-clamp-2 mb-2 leading-snug group-hover:text-[#1F5570] transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[#1F5570]">{formatPrice(product.offerPrice)}</span>
          {product.mrp > product.offerPrice && (
            <span className="text-sm text-[#4A433C] line-through">{formatPrice(product.mrp)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
