import { Outlet } from 'react-router-dom';
import ShippingBanner from './ShippingBanner';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="site-shell">
      <div className="site-top">
        <ShippingBanner />
        <Navbar />
      </div>
      <main className="site-main page-transition">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
