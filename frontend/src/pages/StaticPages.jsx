import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { SITE } from '../config/site';
import { siteAPI } from '../services/api';

const StaticPage = ({ title, children }) => (
  <>
    <Helmet>
      <title>{title} | Manikanta Khadi & Handlooms</title>
    </Helmet>
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="font-serif text-4xl mb-8 text-center text-[#1A1714]">{title}</h1>
      <div className="prose prose-lg max-w-none text-[#2C2620] leading-relaxed space-y-4">
        {children}
      </div>
    </div>
  </>
);

export const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill name, email, and message');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await siteAPI.contact(form);
      toast.success(res.data?.message || 'Message sent successfully!');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaticPage title="Contact Us">
      <div className="grid md:grid-cols-2 gap-10 not-prose">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder="Your Name"
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] bg-white text-[#1A1714] placeholder:text-[#5C534A] focus:outline-none focus:border-[#2A3F4F]"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] bg-white text-[#1A1714] placeholder:text-[#5C534A] focus:outline-none focus:border-[#2A3F4F]"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="Phone"
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] bg-white text-[#1A1714] placeholder:text-[#5C534A] focus:outline-none focus:border-[#2A3F4F]"
          />
          <textarea
            name="message"
            value={form.message}
            onChange={onChange}
            placeholder="Your Message"
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-[#D4CBC0] bg-white text-[#1A1714] placeholder:text-[#5C534A] focus:outline-none focus:border-[#2A3F4F]"
            required
          />
          <button
            type="submit"
            disabled={loading || !form.name.trim() || !form.email.trim() || !form.message.trim()}
            className="btn-primary-custom w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>

        <div className="space-y-5 text-[#2C2620]">
          <div>
            <h3 className="font-serif text-xl mb-2 text-[#1A1714]">Get in Touch</h3>
            <p className="leading-relaxed">
              We&apos;d love to hear from you. Reach out for orders, custom requests, or wholesale
              inquiries.
            </p>
          </div>
          <div>
            <strong className="text-[#1A1714]">Phone:</strong>{' '}
            <a href={`tel:${SITE.phoneTel}`} className="text-[#2A3F4F] font-medium underline-offset-2 hover:underline">
              {SITE.phoneDisplay}
            </a>
          </div>
          <div>
            <strong className="text-[#1A1714]">Email:</strong>{' '}
            <a href={`mailto:${SITE.email}`} className="text-[#2A3F4F] font-medium underline-offset-2 hover:underline break-all">
              {SITE.email}
            </a>
          </div>
          <div>
            <strong className="text-[#1A1714]">Address:</strong>
            <p className="mt-1 leading-relaxed">{SITE.address}</p>
          </div>
          <div>
            <strong className="text-[#1A1714]">Hours:</strong> {SITE.hours}
          </div>
        </div>
      </div>
    </StaticPage>
  );
};

export const FAQ = () => (
  <StaticPage title="Frequently Asked Questions">
    {[
      {
        q: 'Are your products authentic handloom?',
        a: 'Yes, every product is 100% authentic handwoven by skilled artisans using traditional techniques.',
      },
      {
        q: 'What is your return policy?',
        a: 'We offer 7-day returns for unused products in original packaging. See our Refund Policy for details.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes, free shipping on all orders across India.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 5-7 business days. Express delivery available in select cities.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes, use the Track Order page with your order number to see real-time status updates.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept UPI via dynamic QR (GPay, PhonePe, Paytm, BHIM) and Cash on Delivery.',
      },
    ].map(({ q, a }) => (
      <details key={q} className="bg-white rounded-xl p-4 border border-[#E0D6C8] not-prose mb-3">
        <summary className="font-semibold cursor-pointer text-[#1A1714]">{q}</summary>
        <p className="mt-2 text-[#2C2620] leading-relaxed">{a}</p>
      </details>
    ))}
  </StaticPage>
);

export const PrivacyPolicy = () => (
  <StaticPage title="Privacy Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>
      Manikanta Khadi & Handlooms respects your privacy. We collect information you provide during
      registration, orders, and inquiries. This includes name, email, phone, and shipping address.
    </p>
    <p>
      We use this data to process orders, send updates, and improve our services. We do not sell your
      personal information to third parties.
    </p>
    <p>
      Payments are made via UPI dynamic QR codes. We only store the UTR/transaction ID you submit for
      order confirmation — card details are never collected on our site.
    </p>
    <p>
      Contact: {SITE.email} · {SITE.phoneDisplay}
    </p>
  </StaticPage>
);

export const Terms = () => (
  <StaticPage title="Terms & Conditions">
    <p>
      By using our website, you agree to these terms. All products are subject to availability. Prices
      are in INR and inclusive of applicable taxes unless stated otherwise.
    </p>
    <p>
      Product images are representative; slight color variations may occur due to handloom nature. We
      reserve the right to modify these terms at any time.
    </p>
  </StaticPage>
);

export const RefundPolicy = () => (
  <StaticPage title="Refund Policy">
    <p>
      Returns accepted within 7 days of delivery for unused products in original packaging with tags
      intact.
    </p>
    <p>
      Refunds processed within 5-7 business days after return inspection. Shipping charges are
      non-refundable unless the return is due to our error.
    </p>
    <p>Custom or altered products are not eligible for return.</p>
  </StaticPage>
);

export const ShippingPolicy = () => (
  <StaticPage title="Shipping Policy">
    <p>We ship across India. Standard delivery: 5-7 business days. Free shipping on all orders.</p>
    <p>
      Orders are processed within 1-2 business days. You will receive tracking information via email
      and SMS once shipped.
    </p>
    <p>
      International shipping available on request. Contact us at {SITE.email} or {SITE.phoneDisplay}.
    </p>
  </StaticPage>
);

export default StaticPage;
