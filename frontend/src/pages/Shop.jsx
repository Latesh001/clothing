import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFilter, FiX } from 'react-icons/fi';
import { productAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fabric: searchParams.get('fabric') || '',
    color: searchParams.get('color') || '',
    availability: searchParams.get('availability') || '',
    search: searchParams.get('search') || '',
    page: 1,
  });

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    productAPI.getAll(params)
      .then(res => {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    setSearchParams(searchParams);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Sort By</label>
        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#8B4513]">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="popularity">Popularity</option>
          <option value="discount">Discount</option>
          <option value="rating">Rating</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Price Range</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#8B4513]" />
          <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#8B4513]" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Fabric</label>
        <select value={filters.fabric} onChange={(e) => updateFilter('fabric', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200">
          <option value="">All Fabrics</option>
          <option value="Khadi">Khadi</option>
          <option value="Cotton">Cotton</option>
          <option value="Silk">Silk</option>
          <option value="Silk Blend">Silk Blend</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Availability</label>
        <select value={filters.availability} onChange={(e) => updateFilter('availability', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200">
          <option value="">All</option>
          <option value="in_stock">In Stock</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <Helmet><title>Shop All Products | Manikanta Khadi & Handlooms</title></Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">Shop All</h1>
            <p className="text-gray-500 mt-1">{pagination.total || 0} products found</p>
          </div>
          <button onClick={() => setFiltersOpen(true)} className="lg:hidden flex items-center gap-2 btn-outline-custom py-2 px-4">
            <FiFilter /> Filters
          </button>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-serif text-lg mb-4">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {loading ? [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[3/4] skeleton" />
                  <div className="p-4"><div className="h-4 skeleton rounded mb-2" /><div className="h-4 skeleton rounded w-2/3" /></div>
                </div>
              )) : products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button key={i} onClick={() => setFilters(prev => ({ ...prev, page: i + 1 }))}
                    className={`w-10 h-10 rounded-lg ${filters.page === i + 1 ? 'bg-[#8B4513] text-white' : 'bg-white border'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}><FiX size={24} /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
