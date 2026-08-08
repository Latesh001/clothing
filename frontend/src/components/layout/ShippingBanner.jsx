const MESSAGES = [
  'Worldwide Free Shipping on All Orders',
  'Handwoven Khadi · Delivered Across the Globe',
  'Free Shipping Worldwide · No Extra Charges',
  'Authentic Handloom · Free Delivery Everywhere',
];

const ShippingBanner = () => {
  // Duplicate the strip so the marquee loops seamlessly
  const strip = [...MESSAGES, ...MESSAGES, ...MESSAGES];

  return (
    <div className="shipping-banner" role="region" aria-label="Free shipping announcement">
      <div className="shipping-banner__track">
        {strip.map((text, i) => (
          <span key={`${text}-${i}`} className="shipping-banner__item">
            <span className="shipping-banner__dot" aria-hidden="true" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ShippingBanner;
