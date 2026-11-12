import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { formatPrice, getImageUrl } from '../../utils/helpers';
import { IMAGES } from '../../utils/images';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = () => {
    adminAPI.getProducts({ limit: 50 })
      .then(res => setProducts(res.data.products))
      .catch((err) => setError(err.response?.data?.message || 'Could not load products.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
    try {
      await adminAPI.toggleStatus(id, newStatus);
      toast.success(`Product ${newStatus}`);
      fetchProducts();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Products</h1>
        <Link to="/admin/products/new" className="btn-primary-custom flex items-center gap-2 py-2 px-4">
          <FiPlus /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Product</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Stock</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-8 text-center text-red-600">{error}</td></tr>
              ) : products.map(p => (
                <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(p.images?.[0]?.url) || IMAGES.fallback}
                        alt=""
                        className="w-10 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = IMAGES.fallback;
                        }}
                      />
                      <span className="font-medium text-sm line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{p.sku}</td>
                  <td className="p-4 text-sm">{formatPrice(p.offerPrice)}</td>
                  <td className="p-4 text-sm">{p.stock}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded capitalize ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/products/edit/${p._id}`} className="p-1.5 hover:bg-gray-100 rounded"><FiEdit2 size={16} /></Link>
                      <button onClick={() => toggleStatus(p._id, p.status)} className="p-1.5 hover:bg-gray-100 rounded">
                        {p.status === 'active' ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
