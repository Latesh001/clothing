import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiDownload,
  FiShoppingBag,
  FiHeart,
  FiTruck,
  FiShield,
  FiSmartphone,
  FiShare2,
  FiPlusSquare,
} from 'react-icons/fi';
import { usePwaInstall, isStandaloneDisplay } from '../hooks/usePwaInstall';

/**
 * Shareable app entry: https://your-domain/app
 * Opens the same storefront end-to-end — installable PWA, no Play/App Store.
 * Browser website at / stays unchanged.
 */
const OpenApp = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canInstall, installed, isIos, promptInstall } = usePwaInstall();
  const fromPwa = params.get('source') === 'pwa';

  useEffect(() => {
    // Home-screen launches land here; send straight into the shop experience
    if (fromPwa || isStandaloneDisplay()) {
      const t = setTimeout(() => navigate('/', { replace: true }), 600);
      return () => clearTimeout(t);
    }
  }, [fromPwa, navigate]);

  const openStore = () => {
    sessionStorage.setItem('mk_app_mode', '1');
    navigate('/');
  };

  const handleInstall = async () => {
    const ok = await promptInstall();
    if (ok) navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Open App | Manikanta Khadi & Handlooms</title>
        <meta
          name="description"
          content="Open the Manikanta Khadi app — full shopping, cart, wishlist, checkout and order tracking. No App Store or Play Store download required."
        />
        <link rel="canonical" href="/app" />
      </Helmet>

      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1F6A7A_0%,#123040_45%,#0E2A38_100%)] text-white">
        <div className="max-w-lg mx-auto px-5 py-12 md:py-16 flex flex-col min-h-screen">
          <div className="text-center mb-10">
            <img
              src="/icons/pwa-192.png"
              alt="Manikanta Khadi app icon"
              className="w-24 h-24 mx-auto rounded-[1.35rem] shadow-2xl ring-2 ring-[#E8B84A]/50 mb-6 object-cover"
              width={192}
              height={192}
            />
            <p className="text-[#E8B84A] tracking-[0.28em] uppercase text-xs font-bold mb-3">
              Direct app link
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl leading-tight mb-3">
              Manikanta Khadi<br />&amp; Handlooms
            </h1>
            <p className="text-white/85 text-base leading-relaxed max-w-sm mx-auto">
              The full store in app form — browse, cart, wishlist, UPI/COD checkout, and order tracking.
              Same account as the website. No store download required.
            </p>
          </div>

          <ul className="space-y-3 mb-10">
            {[
              { icon: FiShoppingBag, text: 'Shop sarees, dupattas, dress materials & blouses' },
              { icon: FiHeart, text: 'Wishlist, cart & live search' },
              { icon: FiTruck, text: 'Checkout with UPI QR & COD · free shipping' },
              { icon: FiShield, text: 'Secure login, orders & tracking' },
            ].map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10"
              >
                <span className="w-9 h-9 rounded-full bg-[#E8B84A]/20 text-[#E8B84A] flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </span>
                <span className="text-sm text-white/95">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto space-y-3">
            {canInstall && (
              <button
                type="button"
                onClick={handleInstall}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#E8B84A] text-[#123040] font-bold py-3.5 rounded-full shadow-lg hover:brightness-110 transition"
              >
                <FiDownload size={18} /> Install app
              </button>
            )}

            <button
              type="button"
              onClick={openStore}
              className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#1F5570] font-bold py-3.5 rounded-full hover:bg-[#FFFEF9] transition"
            >
              <FiSmartphone size={18} />
              {installed || fromPwa ? 'Continue to shop' : 'Open app now'}
            </button>

            <Link
              to="/"
              className="block text-center text-sm text-white/70 hover:text-white py-2"
            >
              Continue on website →
            </Link>

            {isIos && !canInstall && !installed && (
              <div className="rounded-2xl bg-white/10 p-4 text-sm text-white/90 ring-1 ring-white/15">
                <p className="font-semibold text-[#E8B84A] mb-2 flex items-center gap-2">
                  <FiShare2 /> Add to Home Screen (iPhone)
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-white/85">
                  <li>
                    Tap <strong>Share</strong> in Safari
                  </li>
                  <li>
                    Choose <strong>Add to Home Screen</strong> <FiPlusSquare className="inline" />
                  </li>
                  <li>Open the Manikanta icon anytime — no App Store</li>
                </ol>
              </div>
            )}

            {!isIos && !canInstall && !installed && (
              <p className="text-center text-xs text-white/60 leading-relaxed px-2">
                On Android Chrome: menu (⋮) → <strong>Install app</strong> or{' '}
                <strong>Add to Home screen</strong>. Share this link:{' '}
                <span className="text-[#E8B84A]">/app</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OpenApp;
