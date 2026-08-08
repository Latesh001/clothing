import ProductCard from './ProductCard';

const ProductGrid = ({ products, loading, title, subtitle }) => {
  if (loading) {
    return (
      <section className="py-14 md:py-16">
        {title && <h2 className="section-title">{title}</h2>}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <div className="aspect-[3/4] skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 skeleton rounded w-1/3" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!products?.length) return null;

  return (
    <section className="py-14 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {title && <h2 className="section-title">{title}</h2>}
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
