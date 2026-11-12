export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Resolve product/media URLs for the browser.
 * - Absolute http(s)/blob/data URLs are kept as-is
 * - Relative /uploads paths use the API origin (or stay relative when VITE_API_URL is /api so Vite proxy works)
 */
export const getImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  // Same-origin / Vite proxy — keep relative so /uploads is proxied with /api
  if (apiBase.startsWith('/')) {
    return path;
  }

  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${path}`;
};

/** Resize Unsplash / Cloudinary URLs for faster delivery */
export const optimizeImageUrl = (url, width = 800) => {
  const resolved = getImageUrl(url);
  if (!resolved || resolved.startsWith('blob:') || resolved.startsWith('data:')) return resolved;

  try {
    if (resolved.includes('images.unsplash.com')) {
      const u = new URL(resolved);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', '75');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      return u.toString();
    }
    if (resolved.includes('res.cloudinary.com') && resolved.includes('/upload/')) {
      return resolved.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
  } catch {
    /* keep original */
  }
  return resolved;
};

export const imageSrcSet = (url, widths = [400, 800, 1200]) => {
  const resolved = getImageUrl(url);
  if (!resolved || (!resolved.includes('images.unsplash.com') && !resolved.includes('res.cloudinary.com'))) {
    return undefined;
  }
  return widths.map((w) => `${optimizeImageUrl(resolved, w)} ${w}w`).join(', ');
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
