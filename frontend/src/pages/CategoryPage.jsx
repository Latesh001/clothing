import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';
import { CATEGORY_SLUGS } from '../utils/helpers';
import { getCategoryImage } from '../utils/images';

const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sort: 'newest',
    subcategory: searchParams.get('subcategory') || '',
    minPrice: '', maxPrice: '', fabric: '', page: 1,
  });

  const categoryName = CATEGORY_SLUGS[slug] || slug?.replace(/-/g, ' ');

  useEffect(() => {
    productAPI.getCategories().then(res => {
      const subs = res.data.subcategories.filter(s => s.category?.slug === slug);
      setSubcategories(subs);
    });
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    productAPI.getAll({ category: slug, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) })
      .then(res => setProducts(res.data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, filters]);

  return (
    <>
      <Helmet><title>{categoryName} | Manikanta Khadi & Handlooms</title></Helmet>

      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={getCategoryImage(slug)} alt={categoryName} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A38]/80 via-[#1F5570]/55 to-[#C26A3D]/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl mb-2 text-white drop-shadow">{categoryName}</h1>
          <p className="text-[#E8B84A] font-semibold tracking-wide">Explore our {categoryName.toLowerCase()} collection</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button onClick={() => setFilters(f => ({ ...f, subcategory: '' }))}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!filters.subcategory ? 'bg-gradient-to-r from-[#1F5570] to-[#1F6A7A] text-white shadow-md' : 'bg-[#FFFEF9] text-[#3D3832] hover:bg-[#E8B84A]/25'}`}>
              All
            </button>
            {subcategories.map(sub => (
              <button key={sub._id} onClick={() => setFilters(f => ({ ...f, subcategory: sub._id }))}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filters.subcategory === sub._id ? 'bg-gradient-to-r from-[#1F5570] to-[#1F6A7A] text-white shadow-md' : 'bg-[#FFFEF9] text-[#3D3832] hover:bg-[#E8B84A]/25'}`}>
                {sub.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end mb-6">
          <select value={filters.sort} onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
            className="px-4 py-2 rounded-full bg-[#FFFEF9] text-[#1A1714] outline-none">
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popularity">Popularity</option>
            <option value="discount">Discount</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading ? [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton rounded-2xl" />
          )) : products.length ? products.map(p => (
            <ProductCard key={p._id} product={p} />
          )) : (
            <div className="col-span-full text-center py-20 text-[#6E655C]">
              <p className="text-xl">No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
