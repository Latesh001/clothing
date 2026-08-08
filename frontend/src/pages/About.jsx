import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiArrowRight, FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';
import { SITE } from '../config/site';
import { IMAGES } from '../utils/images';

const craftSteps = [
  {
    title: 'Spinning & fibre care',
    text: 'Cotton and khadi yarns are prepared with patience — soft, breathable fibres that feel natural against the skin.',
    image: IMAGES.about.spinning,
  },
  {
    title: 'Handloom weaving',
    text: 'On the loom, artisans create pallu borders, jamdani motifs, and plain weaves that carry Ponduru’s quiet signature.',
    image: IMAGES.about.weaving,
  },
  {
    title: 'Colour & finishing',
    text: 'Natural dyes and careful finishing give each saree, dupatta, and dress material lasting colour and drape.',
    image: IMAGES.about.finishing,
  },
];

const values = [
  {
    title: 'Authenticity',
    text: 'Every piece is handwoven — no shortcuts, no machine-made imitation of craft.',
  },
  {
    title: 'Artisan dignity',
    text: 'We work with weavers as partners, honouring skill, time, and fair livelihood.',
  },
  {
    title: 'Natural beauty',
    text: 'Soft khadi, honest texture, and colours that feel rooted in the land.',
  },
  {
    title: 'Timeless wear',
    text: 'Pieces meant for festivals, quiet mornings, and years of graceful wear.',
  },
];

const About = () => (
  <>
    <Helmet>
      <title>About Us | Manikanta Khadi & Handlooms</title>
      <meta
        name="description"
        content="Learn the story of Manikanta Khadi & Handlooms — Ponduru jamdani and handloom weaves from Srikakulam, Andhra Pradesh."
      />
    </Helmet>

    {/* Hero */}
    <section className="relative min-h-[52vh] md:min-h-[62vh] overflow-hidden -mt-[110px] pt-[110px]">
      <img
        src={IMAGES.about.hero}
        alt="Handwoven saree and traditional craft"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A38]/85 via-[#1F5570]/55 to-[#C26A3D]/35" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(52vh-110px)] md:min-h-[calc(62vh-110px)] flex items-center">
        <div className="max-w-2xl text-white py-14">
          <p className="text-[#E8B84A] tracking-[0.28em] uppercase text-xs sm:text-sm mb-4 font-semibold">
            Our Story
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl mb-5 text-white leading-[1.1] drop-shadow">
            Woven in Srikakulam,<br />worn with pride
          </h1>
          <p className="text-white/95 text-base sm:text-lg max-w-xl leading-relaxed">
            Manikanta Khadi & Handlooms brings authentic Ponduru jamdani and handloom textiles
            from Andhra Pradesh to homes across the world.
          </p>
        </div>
      </div>
    </section>

    {/* Intro story */}
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="order-2 md:order-1">
          <p className="text-[#C26A3D] tracking-[0.2em] uppercase text-xs font-bold mb-3">Who we are</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-5 text-[#1A1714]">
            A family rooted in handloom heritage
          </h2>
          <p className="text-[#3D3832] leading-relaxed mb-4">
            Welcome to <strong>Manikanta Khadi & Handlooms</strong>. We are a handloom house from
            Karimillipeta, near Srikakulam in Andhra Pradesh — a region known for soft khadi cotton
            and the celebrated Ponduru jamdani tradition.
          </p>
          <p className="text-[#3D3832] leading-relaxed mb-4">
            Our collection grows from the rhythm of the loom: pallu sarees, plain weaves, allover
            motifs, dupattas, dress materials, and blouses — pieces that feel natural, elegant, and
            enduring.
          </p>
          <p className="text-[#3D3832] leading-relaxed">
            Whether you dress for a festival or an everyday moment, we want every weave to carry
            the quiet beauty of Indian craft into your wardrobe.
          </p>
        </div>
        <div className="order-1 md:order-2 grid grid-cols-2 gap-3">
          <img
            src={IMAGES.about.introLeft}
            alt="Handloom saree detail"
            className="w-full h-64 md:h-80 object-cover rounded-[1.5rem] shadow-lg ring-2 ring-[#E8B84A]/35"
          />
          <img
            src={IMAGES.about.introRight}
            alt="Artisan weaving tradition"
            className="w-full h-64 md:h-80 object-cover rounded-[1.5rem] shadow-lg mt-8 ring-2 ring-[#1F6A7A]/25"
          />
        </div>
      </div>
    </section>

    {/* Heritage band */}
    <section className="relative py-16 md:py-20 overflow-hidden">
      <img
        src={IMAGES.about.heritage}
        alt="Traditional Indian textiles"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0E2A38]/88 via-[#1F5570]/75 to-[#123040]/70" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
        <p className="text-[#E8B84A] tracking-[0.25em] uppercase text-xs font-bold mb-3">Heritage</p>
        <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-5 text-white">
          Ponduru jamdani & Andhra handloom
        </h2>
        <p className="text-white/90 text-lg leading-relaxed">
          Ponduru’s jamdani is admired for its fine cotton, airy texture, and delicate extra-weft
          motifs. We honour that lineage — bringing sarees and weaves that feel light, graceful,
          and true to the loom.
        </p>
      </div>
    </section>

    {/* Craft process */}
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="section-title">From fibre to finished weave</h2>
        <p className="section-subtitle">The quiet journey behind every Manikanta piece</p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {craftSteps.map((step, i) => (
            <article key={step.title} className="group">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] mb-5 shadow-md ring-1 ring-[#E8B84A]/30">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[#E8B84A] text-[#123040] font-bold flex items-center justify-center text-sm shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl mb-2 text-[#1A1714]">
                {step.title}
              </h3>
              <p className="text-sm text-[#3D3832] leading-relaxed">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* Mission + values */}
    <section className="story-panel py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-[#1F5570] tracking-[0.2em] uppercase text-xs font-bold mb-3">Our mission</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-5 text-[#1A1714]">
              Fine handloom for every home — with care for those who weave it
            </h2>
            <p className="text-[#3D3832] leading-relaxed mb-4">
              We bring sarees, dupattas, dress materials, and blouses that celebrate authentic craft,
              while supporting artisan livelihoods and more sustainable textile practices.
            </p>
            <p className="text-[#3D3832] leading-relaxed mb-6">
              Worldwide free shipping helps our weaves travel farther — so more people can experience
              the softness of khadi and the grace of handloom.
            </p>
            <img
              src={IMAGES.about.mission}
              alt="Finished handloom textiles"
              className="w-full aspect-[16/10] object-cover rounded-[1.5rem] shadow-lg ring-2 ring-[#E8B84A]/30"
            />
          </div>
          <div>
            <p className="text-[#C26A3D] tracking-[0.2em] uppercase text-xs font-bold mb-3">Our values</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-8 text-[#1A1714]">
              What guides every order
            </h2>
            <div className="space-y-6">
              {values.map((v) => (
                <div key={v.title} className="border-l-4 border-[#E8B84A] pl-5">
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-[#1F5570] mb-1">
                    {v.title}
                  </h3>
                  <p className="text-[#3D3832] leading-relaxed text-sm sm:text-base">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Photo mosaic */}
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="section-title">Life at the loom</h2>
        <p className="section-subtitle">Textures, colours, and moments from our craft world</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {IMAGES.about.gallery.map((src, i) => (
            <div
              key={src}
              className={`overflow-hidden rounded-2xl ring-1 ring-[#E8B84A]/30 shadow-sm ${
                i === 0 || i === 5 ? 'md:col-span-2 md:row-span-2 aspect-square md:aspect-auto md:min-h-[280px]' : 'aspect-square'
              }`}
            >
              <img
                src={src}
                alt={`Handloom craft moment ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* What we offer */}
    <section className="py-16 md:py-20 bg-[#EADFC8]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="section-title">What you’ll find with us</h2>
        <p className="section-subtitle">A focused collection of everyday and festive weaves</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: 'Pallu Sarees', slug: 'pallu-sarees', desc: 'Statement borders and graceful pallu work for festive occasions.' },
            { name: 'Plain Sarees', slug: 'plain-sarees', desc: 'Clean lines and soft khadi comfort for daily elegance.' },
            { name: 'Allover Sarees', slug: 'allover-sarees', desc: 'Motifs that travel across the body of the saree with quiet richness.' },
            { name: 'Dupattas', slug: 'dupattas', desc: 'Light layers that complete suits and festive looks.' },
            { name: 'Dress Materials', slug: 'dress-materials', desc: 'Handloom lengths ready for your tailor and your style.' },
            { name: 'Blouses', slug: 'blouses', desc: 'Complementary pieces that finish the saree story.' },
          ].map((item) => (
            <Link
              key={item.slug}
              to={`/category/${item.slug}`}
              className="group block rounded-[1.25rem] overflow-hidden bg-[#FFFEF9] shadow-sm ring-1 ring-[#1F5570]/10 hover:ring-[#E8B84A]/60 hover:shadow-lg transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={IMAGES.categories[item.slug]}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-[family-name:var(--font-display)] text-xl text-[#1A1714] mb-1 group-hover:text-[#1F5570]">
                  {item.name}
                </h3>
                <p className="text-sm text-[#3D3832] leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>

    {/* Visit / contact */}
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <div className="rounded-[1.75rem] overflow-hidden shadow-xl ring-2 ring-[#1F6A7A]/25">
          <img
            src={IMAGES.about.visit}
            alt="Visit Manikanta Khadi & Handlooms"
            className="w-full h-full object-cover aspect-[4/3]"
          />
        </div>
        <div>
          <p className="text-[#C26A3D] tracking-[0.2em] uppercase text-xs font-bold mb-3">Visit us</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl mb-5 text-[#1A1714]">
            Come closer to the craft
          </h2>
          <p className="text-[#3D3832] leading-relaxed mb-6">
            We are based in Srikakulam district, Andhra Pradesh. Reach out for orders, custom
            enquiries, or to know more about our latest weaves.
          </p>
          <ul className="space-y-4 text-[#2C2620]">
            <li className="flex gap-3 items-start">
              <FiMapPin className="text-[#1F5570] mt-1 shrink-0" size={18} />
              <span>{SITE.address}</span>
            </li>
            <li className="flex gap-3 items-center">
              <FiPhone className="text-[#1F5570] shrink-0" size={18} />
              <a href={`tel:${SITE.phoneTel}`} className="hover:text-[#1F5570] font-medium">
                {SITE.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3 items-center">
              <FiMail className="text-[#1F5570] shrink-0" size={18} />
              <a href={`mailto:${SITE.email}`} className="hover:text-[#1F5570] font-medium break-all">
                {SITE.email}
              </a>
            </li>
            <li className="flex gap-3 items-center">
              <FiClock className="text-[#1F5570] shrink-0" size={18} />
              <span>{SITE.hours}</span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/shop" className="btn-primary-custom">
              Shop Collection <FiArrowRight />
            </Link>
            <Link to="/contact" className="btn-outline-dark">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  </>
);

export default About;
