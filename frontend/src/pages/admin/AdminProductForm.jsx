import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUpload, FiX } from 'react-icons/fi';
import { adminAPI, productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    fabric: '',
    mrp: '',
    discount: '0',
    stock: '',
    sku: '',
    weight: '0',
    shippingCharges: '0',
    estimatedDelivery: '5-7 business days',
    status: 'active',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    isTrending: false,
    borderType: '',
    palluType: '',
  });

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const res = await productAPI.getCategories();
      const cats = res.data.categories || [];
      const subs = res.data.subcategories || [];
      setCategories(cats);
      setSubcategories(subs);
      if (!cats.length) {
        toast.error('No categories found. Run: npm run seed in backend folder');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not load categories. Check backend is running.');
      setCategories([]);
      setSubcategories([]);
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    adminAPI.getProducts({ limit: 100 })
      .then((res) => {
        const product = res.data.products?.find((p) => p._id === id);
        if (!product) return;
        setForm({
          name: product.name || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          category: product.category?._id || product.category || '',
          subcategory: product.subcategory?._id || product.subcategory || '',
          fabric: product.fabric || '',
          mrp: String(product.mrp ?? ''),
          discount: String(product.discount ?? '0'),
          stock: String(product.stock ?? ''),
          sku: product.sku || '',
          weight: String(product.weight ?? '0'),
          shippingCharges: String(product.shippingCharges ?? '0'),
          estimatedDelivery: product.estimatedDelivery || '5-7 business days',
          status: product.status || 'active',
          isFeatured: !!product.isFeatured,
          isNewArrival: !!product.isNewArrival,
          isBestSeller: !!product.isBestSeller,
          isTrending: !!product.isTrending,
          borderType: product.borderType || '',
          palluType: product.palluType || '',
        });
        if (product.images?.length) {
          setPreviews(product.images.map((img) => img.url));
        }
      })
      .catch(() => toast.error('Could not load product'));
  }, [id, isEdit]);

  const filteredSubs = useMemo(() => {
    if (!form.category) return [];
    return subcategories.filter((s) => {
      const catId = s.category?._id || s.category;
      return String(catId) === String(form.category);
    });
  }, [subcategories, form.category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      // Reset subcategory when category changes
      if (name === 'category') next.subcategory = '';
      return next;
    });
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const nextFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(nextFiles);
    setPreviews((prev) => {
      const fresh = files.map((f) => URL.createObjectURL(f));
      return [...prev.filter((p) => !p.startsWith('blob:')), ...fresh].slice(0, 10);
    });
  };

  const removePreview = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error('Please select a category (e.g. Pallu Sarees)');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        fd.append(key, String(value));
      });

      imageFiles.forEach((file) => fd.append('images', file));

      if (isEdit) {
        await adminAPI.updateProduct(id, fd);
        toast.success('Product updated');
      } else {
        await adminAPI.createProduct(fd);
        toast.success('Product created — it will appear on the selected category page');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = categories.find((c) => String(c._id) === String(form.category))?.name;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <button type="button" onClick={loadCategories} className="btn-outline-custom !py-2 !px-4 text-sm">
          Reload Categories
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border space-y-6 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-[#2A3F4F]" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">SKU Code *</label>
            <input name="sku" value={form.sku} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-[#2A3F4F]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={4} className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:border-[#2A3F4F]" />
        </div>

        {/* Category / Subcategory */}
        <div className="rounded-xl bg-[#F3EFE6] p-4 space-y-4">
          <p className="text-sm font-semibold text-[#1A1714]">
            Category & Subcategory
            {selectedCategoryName && (
              <span className="ml-2 font-normal text-[#2A3F4F]">→ will show under “{selectedCategoryName}”</span>
            )}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Main Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={loadingCats}
                className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:border-[#2A3F4F]"
              >
                <option value="">{loadingCats ? 'Loading categories...' : 'Select Category'}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {!loadingCats && !categories.length && (
                <p className="text-xs text-red-600 mt-1">
                  No categories. In backend folder run: <code>npm run seed</code>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subcategory</label>
              <select
                name="subcategory"
                value={form.subcategory}
                onChange={handleChange}
                disabled={!form.category || loadingCats}
                className="w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:border-[#2A3F4F] disabled:opacity-60"
              >
                <option value="">
                  {!form.category
                    ? 'Select a category first'
                    : filteredSubs.length
                      ? 'Select Subcategory'
                      : 'No subcategories for this category'}
                </option>
                {filteredSubs.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              {form.category && filteredSubs.length > 0 && (
                <p className="text-xs text-[#6E655C] mt-1">
                  Options: {filteredSubs.map((s) => s.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Images</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#E8E0D0] rounded-xl p-6 cursor-pointer hover:bg-[#F3EFE6] transition-colors">
            <FiUpload size={22} className="text-[#2A3F4F]" />
            <span className="text-sm text-[#3D3832]">Click to upload saree / product photos</span>
            <span className="text-xs text-[#6E655C]">JPG, PNG, WebP — up to 10 images</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
          {previews.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={`${src}-${i}`} className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#E8E0D0]">
                  <img src={src.startsWith('http') || src.startsWith('blob') || src.startsWith('/') ? src : src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">MRP (₹) *</label>
            <input name="mrp" type="number" value={form.mrp} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Discount (%)</label>
            <input name="discount" type="number" value={form.discount} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock *</label>
            <input name="stock" type="number" value={form.stock} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fabric</label>
          <input name="fabric" value={form.fabric} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border" placeholder="Khadi, Cotton..." />
        </div>

        <div className="flex flex-wrap gap-4">
          {['isFeatured', 'isNewArrival', 'isBestSeller', 'isTrending'].map((field) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name={field} checked={form[field]} onChange={handleChange} />
              <span className="text-sm capitalize">{field.replace('is', '').replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || loadingCats} className="btn-primary-custom py-3 px-8 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline-custom py-3 px-8">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
