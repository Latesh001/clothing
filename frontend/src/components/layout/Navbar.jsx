import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { productAPI } from '../../services/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import { IMAGES } from '../../utils/images';

const categories = [
  { name: 'Pallu Sarees', slug: 'pallu-sarees' },
  { name: 'Plain Sarees', slug: 'plain-sarees' },
  { name: 'Allover Sarees', slug: 'allover-sarees' },
  { name: 'Dupattas', slug: 'dupattas' },
  { name: 'Dress Materials', slug: 'dress-materials' },
  { name: 'Blouses', slug: 'blouses' },
];

const Navbar = () => {
  const { user, cartCount, wishlistCount, setShowLoginModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [shopOpen, setShopOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const res = await productAPI.search(searchQuery);
          setSuggestions(res.data.products || []);
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const linkClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

  return (
    <header className={`site-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-[72px] flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0 leading-tight">
            <span className="block font-[family-name:var(--font-display)] text-[1.55rem] sm:text-[1.75rem] text-[#1F5570] tracking-tight">
              Manikanta
            </span>
            <span className="block text-[0.65rem] sm:text-[0.7rem] uppercase tracking-[0.22em] text-[#C26A3D] font-semibold">
              Khadi & Handlooms
            </span>
          </Link>

          <nav className="hidden xl:flex items-center gap-7">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/about" className={linkClass}>About</NavLink>
            <div
              className="relative"
              onMouseEnter={() => setShopOpen(true)}
              onMouseLeave={() => setShopOpen(false)}
            >
              <NavLink to="/shop" className={linkClass}>Shop</NavLink>
              {shopOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
                  <div className="w-56 bg-[#FFFEF9] rounded-2xl shadow-xl py-2 border-0">
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        to={`/category/${cat.slug}`}
                        className="block px-4 py-2.5 text-sm text-[#3D3832] hover:bg-[#E8B84A]/25 hover:text-[#1F5570] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {categories.slice(0, 3).map((cat) => (
              <NavLink key={cat.slug} to={`/category/${cat.slug}`} className={linkClass}>
                {cat.name}
              </NavLink>
            ))}
            <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="p-2.5 rounded-full text-[#3D3832] hover:bg-[#F3EFE6] transition-colors"
              aria-label="Search"
            >
              <FiSearch size={19} />
            </button>
            <Link to="/wishlist" className="relative p-2.5 rounded-full text-[#3D3832] hover:bg-[#F3EFE6] transition-colors" aria-label="Wishlist">
              <FiHeart size={19} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-[#D4654A] to-[#C26A3D] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2.5 rounded-full text-[#3D3832] hover:bg-[#F3EFE6] transition-colors" aria-label="Cart">
              <FiShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-br from-[#1F5570] to-[#1F6A7A] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link to="/account" className="p-2.5 rounded-full text-[#3D3832] hover:bg-[#F3EFE6] transition-colors" aria-label="Account">
                <FiUser size={19} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="hidden sm:inline-flex btn-primary-custom !py-2 !px-4 !text-sm"
              >
                Login
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="xl:hidden p-2.5 rounded-full text-[#3D3832] hover:bg-[#F3EFE6]"
              aria-label="Menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="pb-4" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees, dupattas, dress materials..."
                className="w-full px-4 py-3 rounded-2xl bg-[#F3EFE6] text-[#1A1714] placeholder:text-[#6E655C] outline-none focus:ring-2 focus:ring-[#E8B84A]/50"
                autoFocus
              />
            </form>
            {suggestions.length > 0 && (
              <div className="mt-2 bg-[#FFFEF9] rounded-2xl shadow-xl overflow-hidden">
                {suggestions.map((p) => (
                  <Link
                    key={p._id}
                    to={`/product/${p.slug || p._id}`}
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F3EFE6]"
                  >
                    <img
                      src={getImageUrl(p.images?.[0]?.url) || IMAGES.fallback}
                      alt={p.name}
                      className="w-11 h-14 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = IMAGES.fallback;
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1714]">{p.name}</p>
                      <p className="text-xs text-[#1F5570] font-semibold">{formatPrice(p.offerPrice)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {mobileOpen && (
          <div className="xl:hidden pb-5">
            <div className="bg-gradient-to-br from-[#FBF3E0] to-[#EADFC8] rounded-2xl p-4 flex flex-col gap-1 border border-[#E8B84A]/50">
              <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
              <NavLink to="/about" onClick={() => setMobileOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>About</NavLink>
              <NavLink to="/shop" onClick={() => setMobileOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>Shop</NavLink>
              {categories.map((cat) => (
                <NavLink
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `mobile-nav-link pl-5 text-sm${isActive ? ' active' : ''}`}
                >
                  {cat.name}
                </NavLink>
              ))}
              <NavLink to="/contact" onClick={() => setMobileOpen(false)} className={({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`}>Contact</NavLink>
              {!user && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setShowLoginModal(true);
                  }}
                  className="btn-primary-custom mt-2 w-full text-center"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
