export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/** Resolve product image URLs (supports /uploads from backend) */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
};

export const calculateDiscount = (mrp, offerPrice) => {
  if (!mrp || mrp <= offerPrice) return 0;
  return Math.round(((mrp - offerPrice) / mrp) * 100);
};

export const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

export const CATEGORY_SLUGS = {
  'pallu-sarees': 'Pallu Sarees',
  'plain-sarees': 'Plain Sarees',
  'allover-sarees': 'Allover Sarees',
  'dupattas': 'Dupattas',
  'dress-materials': 'Dress Materials',
  'blouses': 'Blouses',
};

export const POPULAR_SEARCHES = [
  'Khadi Saree', 'Pallu Saree', 'Cotton Dupatta', 'Silk Blend', 'Festive Collection', 'New Arrivals',
];

