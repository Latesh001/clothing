import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowRight, FiAward, FiTruck, FiShield, FiHeart } from 'react-icons/fi';
import { productAPI } from '../services/api';
import ProductGrid from '../components/products/ProductGrid';
import { IMAGES, getCategoryImage } from '../utils/images';

const defaultCategories = [
  { name: 'Pallu Sarees', slug: 'pallu-sarees' },
  { name: 'Plain Sarees', slug: 'plain-sarees' },
  { name: 'Allover Sarees', slug: 'allover-sarees' },
  { name: 'Dupattas', slug: 'dupattas' },
  { name: 'Dress Materials', slug: 'dress-materials' },
  { name: 'Blouses', slug: 'blouses' },
];

const Home = () => {
  const [data, setData] = useState({
    featured: [], trending: [], bestSellers: [], newArrivals: [], categories: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getHome()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = data.categories?.length ? data.categories : defaultCategories;

  return (
    <>
      <Helmet>
        <title>Manikanta Khadi & Handlooms | Handwoven Sarees</title>
        <meta
          name="description"
          content="Discover natural khadi sarees, dupattas and dress materials woven with care by Indian artisans."
        />
      </Helmet>

      {/* Full-bleed hero */}
      <section className="relative min-h-[78vh] md:min-h-[88vh] overflow-hidden -mt-[110px] pt-[110px]">
        <img
          src={IMAGES.hero}
          alt="Handwoven saree collection"
          className="absolute inset-0 w-full h-full object-cover object-center hero-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A38]/80 via-[#1F5570]/45 to-[#C26A3D]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(232,184,74,0.22),transparent_55%)]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(78vh-110px)] md:min-h-[calc(88vh-110px)] flex items-center">
          <div className="max-w-xl text-white py-16">
            <p className="fade-up text-[#E8B84A] tracking-[0.28em] uppercase text-xs sm:text-sm mb-4 font-semibold drop-shadow">
              Manikanta Khadi & Handlooms
            </p>
            <h1 className="fade-up fade-up-delay-1 font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-5 text-white leading-[1.1] drop-shadow-md">
              Woven from earth,<br />worn with grace
            </h1>
            <p className="fade-up fade-up-delay-2 text-base sm:text-lg text-white/95 mb-8 max-w-md leading-relaxed">
              Soft khadi sarees and handloom pieces made slowly, naturally, and beautifully.
            </p>
            <div className="fade-up fade-up-delay-3 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary-custom !bg-[#E8B84A] !text-[#123040] hover:!brightness-110 !shadow-[0_10px_28px_rgba(232,184,74,0.4)]">
                Explore Collection <FiArrowRight />
              </Link>
              <Link to="/about" className="btn-outline-custom">
                Our Craft
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">From pallu sarees to soft khadi dress materials</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="category-tile group aspect-[3/4]"
              >
                <img
                  src={getCategoryImage(cat.slug, i)}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E2A38]/85 via-[#1F5570]/25 to-transparent" />
                <span className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white font-[family-name:var(--font-display)] text-sm md:text-base drop-shadow">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ProductGrid
        products={data.newArrivals}
        loading={loading}
        title="New Arrivals"
        subtitle="Fresh from the loom this season"
      />

      <ProductGrid
        products={data.trending}
        loading={loading}
        title="Trending Now"
        subtitle="Pieces our customers love most"
      />

      {/* Festival band */}
      <section className="festival-band relative py-20 md:py-24 overflow-hidden">
        <img src={IMAGES.festival} alt="Festival collection" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
          <p className="text-[#E8B84A] tracking-[0.28em] uppercase text-xs font-bold mb-3">Limited Season Edit</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl mb-4 text-white drop-shadow">
            Festival Weaves
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Celebrate in natural textures and timeless handloom elegance.
          </p>
          <Link to="/shop" className="btn-primary-custom !bg-[#E8B84A] !text-[#123040] hover:!brightness-110">
            View Offers
          </Link>
        </div>
      </section>

      <ProductGrid
        products={data.bestSellers}
        loading={loading}
        title="Best Sellers"
        subtitle="Tried, loved, and worn again"
      />

      <ProductGrid
        products={data.featured}
        loading={loading}
        title="Featured Collection"
        subtitle="A quiet edit of our finest weaves"
      />

      {/* Why us — no heavy cards */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title">Why Choose Us</h2>
          <p className="section-subtitle">Simple values, honest craft</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {[
              { icon: FiAward, title: 'Authentic Handloom', desc: 'Every piece is handwoven by skilled artisans.' },
              { icon: FiTruck, title: 'Careful Delivery', desc: 'Free shipping on all orders across India.' },
              { icon: FiShield, title: 'Quality Assured', desc: 'Checked for weave, finish, and colour honesty.' },
              { icon: FiHeart, title: 'Made with Care', desc: 'Natural fibres and thoughtful craftsmanship.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="text-center px-2">
                <div
                  className="feature-icon w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl mb-2 text-[#1A1714]">{title}</h3>
                <p className="text-sm text-[#3D3832] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="story-panel py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="rounded-[1.75rem] overflow-hidden shadow-xl ring-2 ring-[#E8B84A]/40">
            <img src={IMAGES.story} alt="Artisan handloom weaving" className="w-full h-full object-cover aspect-[4/3]" />
          </div>
          <div>
            <p className="text-[#C26A3D] tracking-[0.2em] uppercase text-xs font-bold mb-3">Our Story</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-5 text-[#1A1714]">
              Preserving the quiet beauty of handloom
            </h2>
            <p className="text-[#3D3832] leading-relaxed mb-4">
              At Manikanta Khadi & Handlooms, every saree and dupatta carries the rhythm of the loom —
              soft cotton, natural dyes, and the patience of craft.
            </p>
            <p className="text-[#3D3832] leading-relaxed mb-7">
              We work with artisans who keep tradition alive, creating pieces that feel natural, elegant, and enduring.
            </p>
            <Link to="/about" className="btn-outline-dark inline-flex items-center gap-2">
              Learn More <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title">Loved by Our Customers</h2>
          <p className="section-subtitle">Words from people who wear our weaves</p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: 'Priya Sharma', text: 'The khadi saree feels soft and graceful. The colour is natural and the weave is beautiful.' },
              { name: 'Lakshmi Reddy', text: 'Thoughtful packaging and true handloom quality. I wear mine for both festive and everyday moments.' },
              { name: 'Anitha Kumar', text: 'Authentic textures and elegant pallu work. It feels special without being loud.' },
            ].map((review) => (
              <blockquote key={review.name} className="review-quote rounded-3xl p-6 md:p-8">
                <p className="text-[#3D3832] leading-relaxed mb-5 italic">“{review.text}”</p>
                <footer className="font-semibold text-[#1F5570]">— {review.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="section-title">From the Loom</h2>
          <p className="section-subtitle">A glimpse of our natural weave stories</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {IMAGES.gallery.map((src, i) => (
              <div key={src} className="aspect-square overflow-hidden rounded-2xl group ring-1 ring-[#E8B84A]/30 hover:ring-2 hover:ring-[#E8B84A]/70 transition-all shadow-sm hover:shadow-lg">
                <img
                  src={src}
                  alt={`Handloom gallery ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
