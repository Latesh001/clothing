import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiHeart,
  FiShoppingBag,
  FiStar,
  FiShare2,
  FiTruck,
  FiShield,
  FiMinus,
  FiPlus,
  FiCheck,
} from 'react-icons/fi';
import { productAPI, cartAPI, wishlistAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, calculateDiscount, optimizeImageUrl } from '../utils/helpers';
import { IMAGES } from '../utils/images';
import ProductCard from '../components/products/ProductCard';
import toast from 'react-hot-toast';
import { openAdminWhatsAppIfNeeded } from '../utils/whatsappNotify';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, setShowLoginModal, setCart, refreshCart, refreshWishlist, wishlist } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [infoTab, setInfoTab] = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setSelectedImage(0);
    setQuantity(1);
    setInfoTab('description');

    productAPI
      .getBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        const found = res.data?.product;
        if (!found) {
          toast.error('Product not found');
          return;
        }
        setProduct(found);
        setRelated(res.data.related || []);
        setSelectedSize(found.sizes?.[0] || '');
        setSelectedColor(found.colors?.[0]?.name || '');
        reviewAPI
          .getByProduct(found._id)
          .then((r) => {
            if (!cancelled) setReviews(r.data.reviews || []);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || 'Product not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // After login modal, finish Buy Now if the user started it while logged out
  useEffect(() => {
    if (!user || loading || !product) return;
    const raw = sessionStorage.getItem('pendingBuyNow');
    if (!raw) return;

    let pending;
    try {
      pending = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem('pendingBuyNow');
      return;
    }

    const sameProduct =
      pending.productId === product._id || pending.slug === product.slug || pending.slug === slug;
    if (!sameProduct) return;

    sessionStorage.removeItem('pendingBuyNow');
    let cancelled = false;

    (async () => {
      setBuying(true);
      try {
        const res = await cartAPI.add({
          productId: product._id,
          quantity: pending.quantity || 1,
          size: pending.size || '',
          color: pending.color || '',
        });
        const nextCart = res.data.cart || (await refreshCart());
        if (cancelled) return;
        if (nextCart) setCart(nextCart);
        openAdminWhatsAppIfNeeded(res.data);
        if (!nextCart?.items?.length) {
          toast.error('Could not start checkout. Please try again.');
          return;
        }
        navigate('/checkout', { state: { fromBuyNow: true } });
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Failed to start checkout');
        }
      } finally {
        if (!cancelled) setBuying(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only when auth/product become ready after login
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, product?._id, slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7 aspect-[3/4] skeleton rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-1/2" />
            <div className="h-24 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 px-4">
        <p className="text-lg text-[#6E655C] mb-4">Product not found</p>
        <Link to="/shop" className="btn-primary-custom inline-flex">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discount = product.discount || calculateDiscount(product.mrp, product.offerPrice);
  const isWishlisted = wishlist.products?.some((p) => (p._id || p) === product._id);
  const images = product.images?.length
    ? product.images
    : [{ url: IMAGES.fallback, alt: product.name }];
  const mainImage = optimizeImageUrl(images[selectedImage]?.url || IMAGES.fallback, 1100);

  const specRows = [
    product.category?.name && { label: 'Category', value: product.category.name },
    product.fabric && { label: 'Fabric', value: product.fabric },
    product.material && { label: 'Material', value: product.material },
    product.borderType && { label: 'Border', value: product.borderType },
    product.palluType && { label: 'Pallu', value: product.palluType },
    product.sku && { label: 'SKU', value: product.sku },
    product.weight > 0 && { label: 'Weight', value: `${product.weight} g` },
    product.estimatedDelivery && { label: 'Delivery', value: product.estimatedDelivery },
    ...(product.specifications || []).filter((s) => s?.label && s?.value),
  ].filter(Boolean);

  const addProductToCart = async () => {
    const res = await cartAPI.add({
      productId: product._id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
    const nextCart = res.data.cart || (await refreshCart());
    if (nextCart) setCart(nextCart);
    openAdminWhatsAppIfNeeded(res.data);
    return nextCart;
  };

  const handleAddToCart = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      await addProductToCart();
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      sessionStorage.setItem(
        'pendingBuyNow',
        JSON.stringify({
          productId: product._id,
          quantity,
          size: selectedSize,
          color: selectedColor,
          slug: product.slug || slug,
        })
      );
      setShowLoginModal(true);
      return;
    }

    setBuying(true);
    try {
      const nextCart = await addProductToCart();
      if (!nextCart?.items?.length) {
        toast.error('Could not start checkout. Please try again.');
        return;
      }
      navigate('/checkout', { state: { fromBuyNow: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout');
    } finally {
      setBuying(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    await wishlistAPI.toggle(product._id);
    await refreshWishlist();
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const reloadReviews = async () => {
    if (!product?._id) return;
    try {
      const r = await reviewAPI.getByProduct(product._id);
      setReviews(r.data.reviews || []);
    } catch {
      /* keep current list */
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!reviewForm.rating) {
      toast.error('Please select a star rating');
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error('Please write your review');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewAPI.create({
        productId: product._id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      });
      toast.success('Thank you! Your review was submitted');
      setReviewForm({ rating: 5, title: '', comment: '' });
      await reloadReviews();
      const refreshed = await productAPI.getBySlug(product.slug || slug);
      if (refreshed.data?.product) setProduct(refreshed.data.product);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: `Reviews (${product.totalReviews || reviews.length || 0})` },
  ];

  return (
    <>
      <Helmet>
        <title>{product.name} | Manikanta Khadi & Handlooms</title>
        <meta
          name="description"
          content={product.shortDescription || product.description?.slice(0, 160)}
        />
      </Helmet>

      <div className="bg-[#F7F3EC] min-h-[40vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-[#6E655C] mb-6 flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-[#2A3F4F]">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-[#2A3F4F]">
              Shop
            </Link>
            {product.category?.slug && (
              <>
                <span>/</span>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="hover:text-[#2A3F4F]"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#1A1714] line-clamp-1 max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            {/* Gallery */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[3/4] md:aspect-[4/5] overflow-hidden bg-[#E8E0D0] rounded-sm">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  fetchPriority="high"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = IMAGES.fallback;
                  }}
                />
                {discount > 0 && (
                  <span className="badge-sale absolute top-4 left-4 text-white px-3 py-1 text-xs font-semibold tracking-wide rounded-full">
                    {discount}% OFF
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImage(i)}
                      className={`w-[72px] h-[88px] flex-shrink-0 overflow-hidden border-2 transition-colors ${
                        selectedImage === i
                          ? 'border-[#2A3F4F]'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={optimizeImageUrl(img.url || IMAGES.fallback, 160)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buy panel */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <p className="text-[#C26A3D] text-xs uppercase tracking-[0.2em] font-semibold mb-3">
                {[product.fabric, product.category?.name].filter(Boolean).join(' · ') ||
                  'Handloom'}
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#1A1714] leading-tight mb-4">
                {product.name}
              </h1>

              <button
                type="button"
                onClick={() => {
                  setInfoTab('reviews');
                  document.getElementById('product-info-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-2 mb-5 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={15}
                      className={
                        i < Math.round(product.averageRating || 0)
                          ? 'text-[#C4A35A] fill-[#C4A35A]'
                          : 'text-[#D4CBC0]'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-[#6E655C] underline-offset-2 hover:underline">
                  {product.averageRating
                    ? `${product.averageRating.toFixed(1)} · ${product.totalReviews || reviews.length || 0} reviews`
                    : 'No reviews yet — write one'}
                </span>
              </button>

              <div className="flex flex-wrap items-baseline gap-3 mb-5 pb-5 border-b border-[#E0D6C8]">
                <span className="text-3xl font-semibold text-[#1F5570]">
                  {formatPrice(product.offerPrice)}
                </span>
                {product.mrp > product.offerPrice && (
                  <>
                    <span className="text-lg text-[#9A9086] line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="text-sm font-medium text-[#2F6B4F]">
                      Save {discount}%
                    </span>
                  </>
                )}
              </div>

              {product.shortDescription && (
                <p className="text-[#3D3832] leading-relaxed mb-6 text-[15px]">
                  {product.shortDescription}
                </p>
              )}

              {product.sizes?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-2">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[3rem] px-3 py-2 text-sm border transition-colors ${
                          selectedSize === size
                            ? 'border-[#2A3F4F] bg-[#2A3F4F] text-white'
                            : 'border-[#D4CBC0] text-[#1A1714] hover:border-[#2A3F4F]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors?.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-2">
                    Colour · {selectedColor}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        title={color.name}
                        className={`w-9 h-9 rounded-full border-2 transition-transform ${
                          selectedColor === color.name
                            ? 'border-[#2A3F4F] scale-110'
                            : 'border-[#D4CBC0]'
                        }`}
                        style={{ backgroundColor: color.hex || '#F5F0E8' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6E655C]">
                  Qty
                </p>
                <div className="inline-flex items-center border border-[#D4CBC0]">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2.5 hover:bg-[#EFE9DF]"
                    aria-label="Decrease quantity"
                  >
                    <FiMinus size={16} />
                  </button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.min(Math.max(product.stock, 1), quantity + 1))
                    }
                    className="p-2.5 hover:bg-[#EFE9DF]"
                    aria-label="Increase quantity"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
                <span
                  className={`text-sm ${
                    product.stock > 0 ? 'text-[#2F6B4F]' : 'text-red-600'
                  }`}
                >
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock < 1}
                  className="flex-1 btn-primary-custom flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
                >
                  <FiShoppingBag size={18} /> Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleWishlist}
                  className={`px-3.5 border border-[#D4CBC0] ${
                    isWishlisted ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#FFFEF9]'
                  }`}
                  aria-label="Wishlist"
                >
                  <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 border border-[#D4CBC0] bg-[#FFFEF9]"
                  aria-label="Share"
                >
                  <FiShare2 size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock < 1 || buying}
                className="w-full btn-outline-dark py-3.5 mb-6 disabled:opacity-50 inline-flex items-center justify-center"
              >
                {buying ? 'Starting checkout...' : 'Buy Now'}
              </button>

              <ul className="space-y-3 text-sm text-[#3D3832]">
                <li className="flex items-start gap-3">
                  <FiTruck className="text-[#2A3F4F] mt-0.5 flex-shrink-0" size={18} />
                  <span>
                    Delivery in {product.estimatedDelivery || '5–7 business days'}
                    <span className="block text-[#2F6B4F] font-medium">Free shipping</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <FiShield className="text-[#2A3F4F] mt-0.5 flex-shrink-0" size={18} />
                  <span>100% authentic handloom · Quality checked</span>
                </li>
                <li className="flex items-start gap-3">
                  <FiCheck className="text-[#2A3F4F] mt-0.5 flex-shrink-0" size={18} />
                  <span>Secure UPI QR payment & COD available</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Description / Specs / Reviews */}
      <div id="product-info-tabs" className="bg-[#FFFEF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          <div className="border-b border-[#E0D6C8] flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInfoTab(tab.id)}
                className={`px-4 sm:px-6 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  infoTab === tab.id
                    ? 'border-[#2A3F4F] text-[#2A3F4F]'
                    : 'border-transparent text-[#6E655C] hover:text-[#1A1714]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="pt-8 md:pt-10 max-w-3xl">
            {infoTab === 'description' && (
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#1A1714] mb-4">
                  About this piece
                </h2>
                <div className="text-[#3D3832] text-[15px] leading-[1.75] whitespace-pre-line">
                  {product.description ||
                    product.shortDescription ||
                    'No description available for this product.'}
                </div>
              </div>
            )}

            {infoTab === 'specifications' && (
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#1A1714] mb-6">
                  Specifications
                </h2>
                {specRows.length ? (
                  <dl className="divide-y divide-[#E8E0D0] border border-[#E8E0D0]">
                    {specRows.map((row) => (
                      <div
                        key={`${row.label}-${row.value}`}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 px-4 py-3.5"
                      >
                        <dt className="text-sm font-medium text-[#6E655C]">{row.label}</dt>
                        <dd className="sm:col-span-2 text-sm text-[#1A1714] font-medium">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-[#6E655C]">No specifications listed.</p>
                )}
              </div>
            )}

            {infoTab === 'reviews' && (
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#1A1714] mb-6">
                  Customer reviews
                </h2>

                <form
                  onSubmit={handleSubmitReview}
                  className="mb-10 p-5 sm:p-6 border border-[#E0D6C8] bg-[#F7F3EC]/60 space-y-4"
                >
                  <h3 className="font-semibold text-[#1A1714]">Write a review</h3>
                  {!user && (
                    <p className="text-sm text-[#6E655C]">
                      Please{' '}
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="text-[#1F5570] font-semibold underline"
                      >
                        login
                      </button>{' '}
                      to submit a review.
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#6E655C] mb-2">
                      Your rating
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                          className="p-1"
                          aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <FiStar
                            size={22}
                            className={
                              star <= reviewForm.rating
                                ? 'text-[#C4A35A] fill-[#C4A35A]'
                                : 'text-[#D4CBC0]'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Review title (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-[#E0D6C8] bg-white outline-none focus:border-[#1F5570]"
                    maxLength={120}
                  />
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product"
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-[#E0D6C8] bg-white outline-none focus:border-[#1F5570] resize-y"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary-custom px-6 py-3 disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit review'}
                  </button>
                </form>

                {reviews.length ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <article
                        key={review._id}
                        className="pb-6 border-b border-[#E8E0D0] last:border-0"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              size={14}
                              className={
                                i < (review.rating || 0)
                                  ? 'text-[#C4A35A] fill-[#C4A35A]'
                                  : 'text-[#D4CBC0]'
                              }
                            />
                          ))}
                          <span className="text-sm font-medium text-[#1A1714] ml-1">
                            {review.user?.name || 'Customer'}
                          </span>
                        </div>
                        {review.title && (
                          <p className="font-medium text-[#1A1714] mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-[#3D3832] leading-relaxed">
                          {review.comment}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#6E655C]">
                    No reviews yet. Be the first to share your experience.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="bg-[#F7F3EC] py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#1A1714] mb-2 text-center">
              You may also like
            </h2>
            <p className="text-center text-sm text-[#6E655C] mb-8">
              More pieces from a similar weave
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetail;
