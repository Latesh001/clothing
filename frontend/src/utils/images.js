/** Curated saree & handloom imagery — sized for typical display slots */

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=75&auto=format&fit=crop',
  story: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=900&q=75&auto=format&fit=crop',
  festival: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=75&auto=format&fit=crop',
  categories: {
    'pallu-sarees': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=480&q=75&auto=format&fit=crop',
    'plain-sarees': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=480&q=75&auto=format&fit=crop',
    'allover-sarees': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=480&q=75&auto=format&fit=crop',
    'dupattas': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=480&q=75&auto=format&fit=crop',
    'dress-materials': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=480&q=75&auto=format&fit=crop',
    'blouses': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=480&q=75&auto=format&fit=crop',
  },
  products: [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=75&auto=format&fit=crop',
  ],
  gallery: [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=480&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=480&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=480&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=480&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=480&q=75&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=480&q=75&auto=format&fit=crop',
  ],
  about: {
    hero: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=75&auto=format&fit=crop',
    introLeft: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=700&q=75&auto=format&fit=crop',
    introRight: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&q=75&auto=format&fit=crop',
    heritage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200&q=75&auto=format&fit=crop',
    spinning: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=700&q=75&auto=format&fit=crop',
    weaving: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&q=75&auto=format&fit=crop',
    finishing: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=700&q=75&auto=format&fit=crop',
    mission: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=75&auto=format&fit=crop',
    visit: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900&q=75&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=700&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=560&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=560&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=560&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=560&q=75&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=700&q=75&auto=format&fit=crop',
    ],
  },
  fallback: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=75&auto=format&fit=crop',
};

export const getCategoryImage = (slug, index = 0) =>
  IMAGES.categories[slug] || IMAGES.products[index % IMAGES.products.length];

export const getProductImage = (index = 0) =>
  IMAGES.products[index % IMAGES.products.length];
