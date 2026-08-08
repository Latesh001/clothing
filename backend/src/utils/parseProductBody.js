const parseBool = (value) => value === true || value === 'true' || value === 'on' || value === '1';

const parseList = (value) => {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((v) => v.trim()).filter(Boolean);
    } catch {
      return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
};

/** Normalize multipart/form-data or JSON product payloads */
const parseProductBody = (body = {}) => {
  const mrp = Number(body.mrp) || 0;
  const discount = Number(body.discount) || 0;
  const offerPrice = body.offerPrice
    ? Number(body.offerPrice)
    : Math.round(mrp - (mrp * discount) / 100);

  return {
    name: body.name,
    description: body.description,
    shortDescription: body.shortDescription || '',
    category: body.category || undefined,
    subcategory: body.subcategory || undefined,
    fabric: body.fabric || '',
    material: body.material || '',
    borderType: body.borderType || '',
    palluType: body.palluType || '',
    sizes: parseList(body.sizes).length ? parseList(body.sizes) : ['Free Size'],
    tags: parseList(body.tags),
    stock: Number(body.stock) || 0,
    mrp,
    discount,
    offerPrice,
    sku: body.sku ? String(body.sku).toUpperCase() : undefined,
    weight: Number(body.weight) || 0,
    shippingCharges: Number(body.shippingCharges) || 0,
    estimatedDelivery: body.estimatedDelivery || '5-7 business days',
    status: body.status || 'active',
    isFeatured: parseBool(body.isFeatured),
    isNewArrival: parseBool(body.isNewArrival),
    isBestSeller: parseBool(body.isBestSeller),
    isTrending: parseBool(body.isTrending),
    colors: body.colors
      ? (typeof body.colors === 'string' ? JSON.parse(body.colors) : body.colors)
      : [{ name: 'Natural', hex: '#F5F0E8' }],
  };
};

module.exports = { parseProductBody, parseBool, parseList };
