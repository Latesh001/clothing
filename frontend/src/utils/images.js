/** Curated saree & handloom imagery for a natural storefront look */

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80',
  story: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1000&q=80',
  festival: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&q=80',
  categories: {
    'pallu-sarees': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
    'plain-sarees': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
    'allover-sarees': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
    'dupattas': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
    'dress-materials': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80',
    'blouses': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80',
  },
  products: [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&q=80',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  ],
  gallery: [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&q=80',
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&q=80',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=500&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
  ],
  about: {
    hero: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1920&q=80',
    introLeft: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80',
    introRight: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80',
    heritage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&q=80',
    spinning: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    weaving: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80',
    finishing: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80',
    mission: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&q=80',
    visit: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=80',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&q=80',
    ],
  },
  fallback: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80',
};

export const getCategoryImage = (slug, index = 0) =>
  IMAGES.categories[slug] || IMAGES.products[index % IMAGES.products.length];

export const getProductImage = (index = 0) =>
  IMAGES.products[index % IMAGES.products.length];
