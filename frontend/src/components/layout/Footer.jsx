import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { SITE } from '../../config/site';
import { siteAPI } from '../../services/api';

const quickLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/shop', label: 'Shop All' },
  { to: '/app', label: 'Open App' },
  { to: '/faq', label: 'FAQ' },
  { to: '/track-order', label: 'Track Order' },
  { to: '/contact', label: 'Contact Us' },
];

const categoryLinks = [
  { to: '/category/pallu-sarees', label: 'Pallu Sarees' },
  { to: '/category/plain-sarees', label: 'Plain Sarees' },
  { to: '/category/allover-sarees', label: 'Allover Sarees' },
  { to: '/category/dupattas', label: 'Dupattas' },
  { to: '/category/dress-materials', label: 'Dress Materials' },
  { to: '/category/blouses', label: 'Blouses' },
];

const policyLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/refund-policy', label: 'Refund Policy' },
  { to: '/shipping-policy', label: 'Shipping Policy' },
];

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await siteAPI.subscribe(value);
      toast.success(res.data?.message || 'Subscribed successfully!');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="relative z-20 mt-16 bg-[#123040] text-[#F3EFE6]">
      <div className="footer-cta py-12">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-white mb-3">
            Join Our Handloom Family
          </h3>
          <p className="text-[#FFFEF9]/95 mb-6 max-w-lg mx-auto text-base">
            Soft offers, new weaves, and stories from the loom — straight to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 px-4 py-3 rounded-full border-0 outline-none text-[#1A1714] bg-white placeholder:text-[#5C534A] shadow-md"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-[#E8B84A] text-[#123040] px-6 py-3 rounded-full font-bold hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-[family-name:var(--font-display)] text-xl text-white mb-4">
              {SITE.name}
            </h4>
            <p className="text-sm leading-relaxed text-[#F3EFE6] mb-5">
              Natural weaves, honest craft, and timeless Indian handloom elegance.
            </p>
            <div className="flex gap-4">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-[#F3EFE6] hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram size={20} />
              </a>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#F3EFE6] hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <FaWhatsapp size={20} />
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4">Quick Links</h5>
            <ul className="space-y-1 text-sm">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="relative z-10 inline-flex w-full py-1.5 text-[#F3EFE6] hover:text-white cursor-pointer transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4">Categories</h5>
            <ul className="space-y-1 text-sm">
              {categoryLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="relative z-10 inline-flex w-full py-1.5 text-[#F3EFE6] hover:text-white cursor-pointer transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-4">Customer Support</h5>
            <ul className="space-y-3 text-sm text-[#F3EFE6]">
              <li>
                <a href={`tel:${SITE.phoneTel}`} className="inline-flex items-center gap-2 hover:text-white">
                  <FiPhone size={16} /> {SITE.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="inline-flex items-start gap-2 hover:text-white break-all">
                  <FiMail size={16} className="mt-0.5 shrink-0" /> {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <FiMapPin size={16} className="mt-0.5 shrink-0" />
                <span>{SITE.address}</span>
              </li>
            </ul>
            <div className="mt-5 space-y-1 text-sm">
              {policyLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="relative z-10 block py-1.5 text-[#E8E0D0] hover:text-white cursor-pointer transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/15 py-5 text-center text-sm text-[#E8E0D0]">
        <p>
          &copy; {new Date().getFullYear()} {SITE.name}. Crafted with care for handloom heritage.
        </p>
      </div>

      <a
        href={SITE.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-5 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-105 transition-transform z-40"
        aria-label="WhatsApp"
      >
        <FaWhatsapp size={22} />
      </a>
      <a
        href={`tel:${SITE.phoneTel}`}
        className="fixed bottom-6 right-5 bg-gradient-to-br from-[#1F5570] to-[#1F6A7A] text-white p-3.5 rounded-full shadow-lg hover:scale-105 transition-transform z-40"
        aria-label="Call"
      >
        <FiPhone size={22} />
      </a>
    </footer>
  );
};

export default Footer;
