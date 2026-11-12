import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiFilter, FiX } from 'react-icons/fi';
import { productAPI } from '../services/api';
import ProductCard from '../components/products/ProductCard';

const filterInputClass =
  'w-full px-3 py-2.5 rounded-xl border border-[#1F5570]/18 bg-[#FFFEF9] text-[#1A1714] focus:outline-none focus:border-[#1F5570] focus:ring-2 focus:ring-[#E8B84A]/35 transition-shadow';

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
  const [priceDraft, setPriceDraft] = useState({
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    let cancelled = false;
    productAPI
      .getAll(params)
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  useEffect(() => {
    setPriceDraft({ minPrice: filters.minPrice, maxPrice: filters.maxPrice });
  }, [filters.minPrice, filters.maxPrice]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const updatePriceDraft = (key, value) => {
    setPriceDraft((prev) => ({ ...prev, [key]: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateFilter(key, value);
    }, 400);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-[#1A1714] mb-2">Sort By</label>
        <select
          value={filters.sort}
          onChange={(e) => updateFilter('sort', e.target.value)}
          className={filterInputClass}
        >
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
        <label className="block text-sm font-semibold text-[#1A1714] mb-2">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceDraft.minPrice}
            onChange={(e) => updatePriceDraft('minPrice', e.target.value)}
            className={filterInputClass}
          />
          <input
            type="number"
            placeholder="Max"
            value={priceDraft.maxPrice}
            onChange={(e) => updatePriceDraft('maxPrice', e.target.value)}
            className={filterInputClass}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#1A1714] mb-2">Fabric</label>
        <select
          value={filters.fabric}
          onChange={(e) => updateFilter('fabric', e.target.value)}
          className={filterInputClass}
        >
          <option value="">All Fabrics</option>
          <option value="Khadi">Khadi</option>
          <option value="Cotton">Cotton</option>
          <option value="Silk">Silk</option>
          <option value="Silk Blend">Silk Blend</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#1A1714] mb-2">Availability</label>
        <select
          value={filters.availability}
          onChange={(e) => updateFilter('availability', e.target.value)}
          className={filterInputClass}
        >
          <option value="">All</option>
          <option value="in_stock">In Stock</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Shop All Products | Manikanta Khadi & Handlooms</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[#C26A3D] tracking-[0.22em] uppercase text-xs font-bold mb-2">Collection</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl text-[#1A1714]">
              Shop All
            </h1>
            <p className="text-[#4A433C] mt-2">{pagination.total || 0} products found</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 btn-outline-dark !py-2 !px-4"
          >
            <FiFilter /> Filters
          </button>
        </div>

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="shop-filter-panel sticky top-28">
              <h3 className="font-[family-name:var(--font-display)] text-xl mb-5 text-[#1A1714]">Filters</h3>
              {filterPanel}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden">
                      <div className="aspect-[3/4] skeleton" />
                      <div className="p-4">
                        <div className="h-4 skeleton rounded mb-2" />
                        <div className="h-4 skeleton rounded w-2/3" />
                      </div>
                    </div>
                  ))
                : products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>

            {!loading && products.length === 0 && (
              <div className="text-center py-20">
                <p className="text-[#4A433C] text-lg mb-4">No products match these filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      sort: 'newest',
                      minPrice: '',
                      maxPrice: '',
                      fabric: '',
                      color: '',
                      availability: '',
                      search: '',
                      page: 1,
                    });
                    setSearchParams({});
                  }}
                  className="btn-primary-custom"
                >
                  Clear filters
                </button>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="flex justify-center flex-wrap gap-2 mt-12">
                {[...Array(pagination.pages)].map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, page: i + 1 }))}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-all ${
                      filters.page === i + 1
                        ? 'bg-gradient-to-br from-[#1F5570] to-[#1F6A7A] text-white shadow-md'
                        : 'bg-[#FFFEF9] border border-[#1F5570]/20 text-[#1A1714] hover:border-[#E8B84A]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0E2A38]/55 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[min(20rem,92vw)] bg-[#FFFEF9] p-6 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-[family-name:var(--font-display)] text-xl">Filters</h3>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <FiX size={24} />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
