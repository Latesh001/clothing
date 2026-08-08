import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="container mx-auto px-4 py-20 text-center">
    <h1 className="font-serif text-6xl text-[#8B4513] mb-4">404</h1>
    <p className="text-xl text-gray-600 mb-8">Page not found</p>
    <Link to="/" className="btn-primary-custom">Back to Home</Link>
  </div>
);

export default NotFound;
