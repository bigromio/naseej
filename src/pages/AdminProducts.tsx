import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, Filter, Loader2, Save, X, DownloadCloud, Store, Package } from 'lucide-react';
export interface Product {
  id?: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  supply_price?: number;
  stock: number;
  category: string;
  images: string[];
  sku?: string;
  supplier_id?: string;
  available_cities?: string[];
}

export const AdminProducts = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]); // 🌟 الموردون الجدد
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 🌟 حالات نوافذ الإضافة والاستيراد
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importSku, setImportSku] = useState('');
  const [importSupplierId, setImportSupplierId] = useState('');

  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name_ar: '', name_en: '', description_ar: '', description_en: '',
    price: 0, supply_price: 0, stock: 0, category: '', images: [], sku: '', supplier_id: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prods) setProducts(prods);

      const { data: sups } = await supabase.from('suppliers').select('id, name, type').eq('status', 'approved');
      if (sups) setSuppliers(sups);

      const { data: cats } = await supabase.from('categories').select('name_ar');
      if (cats) setCategories(cats.map(c => c.name_ar));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // 🌟 محرك استيراد الدروبشيبينج (API Call)
  // ==========================================
  const handleImportProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importSku || !importSupplierId) return alert(isRTL ? 'يرجى إدخال رقم المنتج واختيار المورد' : 'SKU and Supplier are required');
    
    setIsSaving(true);
    try {
      // 1. الاتصال بسيرفر كونتابو الخاص بك لجلب بيانات CJ
      const response = await fetch('http://167.86.73.97:8080/api/supplier/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: importSku, supplier_id: importSupplierId })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'فشل الاستيراد من المورد');
      }

      // 2. وضع البيانات القادمة في النافذة ليقوم الأدمن بمراجعتها وتسعيرها
      setCurrentProduct({
        ...data.product,
        category: categories.length > 0 ? categories[0] : 'أثاث'
      });
      
      setIsImportModalOpen(false); // إغلاق نافذة الاستيراد
      setIsModalOpen(true); // فتح نافذة إضافة المنتج للمراجعة النهائية
      setImportSku('');
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (currentProduct.id) {
        await supabase.from('products').update(currentProduct).eq('id', currentProduct.id);
      } else {
        await supabase.from('products').insert([currentProduct]);
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (error) {
      alert(isRTL ? 'خطأ في الحفظ' : 'Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert(isRTL ? 'خطأ في الحذف' : 'Error deleting');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name_ar?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (product.name_en?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 🌟 رأس الصفحة وأزرار الإضافة والاستيراد 🌟 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
            <Package className="text-[#C5A059]" /> {isRTL ? 'إدارة المنتجات والمخزون' : 'Products & Inventory'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRTL ? 'أضف منتجاتك يدوياً أو استوردها آلياً بضغطة زر من موردي الدروبشيبينج.' : 'Add manually or import automatically from dropshipping suppliers.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="bg-blue-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <DownloadCloud size={20}/> {isRTL ? 'استيراد دروبشيبينج ☁️' : 'Import Dropshipping ☁️'}
          </button>
          <button 
            onClick={() => {
              setCurrentProduct({ name_ar: '', name_en: '', description_ar: '', description_en: '', price: 0, supply_price: 0, stock: 0, category: '', images: [], sku: '', supplier_id: '' });
              setIsModalOpen(true);
            }}
            className="bg-[#2C2C2C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#C5A059] transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={20}/> {isRTL ? 'إضافة منتج يدوي' : 'Add Manual Product'}
          </button>
        </div>
      </div>

      {/* 🌟 شريط البحث والفلترة 🌟 */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={isRTL ? 'ابحث بالاسم، أو برقم المنتج (SKU)...' : 'Search by name or SKU...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A059] font-bold"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="text-gray-400" size={20} />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:outline-none focus:border-[#C5A059] font-bold cursor-pointer"
          >
            <option value="all">{isRTL ? 'جميع الأقسام' : 'All Categories'}</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* 🌟 جدول المنتجات 🌟 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold">{isRTL ? 'لا توجد منتجات مطابقة للبحث.' : 'No products found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'المنتج' : 'Product'}</th>
                  <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'المورد (التكلفة)' : 'Supplier (Cost)'}</th>
                  <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'سعر البيع' : 'Sale Price'}</th>
                  <th className="p-4 text-center font-bold text-gray-600">{isRTL ? 'المخزون' : 'Stock'}</th>
                  <th className="p-4 text-center font-bold text-gray-600">{isRTL ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img src={product.images?.[0] || 'https://via.placeholder.com/50'} alt={product.name_ar} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                        <div>
                          <div className="font-bold text-[#2C2C2C] max-w-[200px] truncate">{isRTL ? product.name_ar : product.name_en}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-gray-400" />
                        <span className="font-bold text-gray-700 text-sm">
                          {suppliers.find(s => s.id === product.supplier_id)?.name || (isRTL ? 'منتج داخلي' : 'In-house')}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-red-500 mt-1">
                        {isRTL ? 'التكلفة: ' : 'Cost: '} {product.supply_price || 0} {isRTL ? 'ر.س' : 'SAR'}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-green-600">
                      {product.price} {isRTL ? 'ر.س' : 'SAR'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock} {isRTL ? 'قطعة' : 'pcs'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => { setCurrentProduct(product); setIsModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors">
                          <Edit2 size={18}/>
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================== */}
      {/* 🌟 1. نافذة الاستيراد من الدروبشيبينج 🌟 */}
      {/* ================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><DownloadCloud size={24}/> {isRTL ? 'استيراد منتج دولي' : 'Import Product'}</h2>
                <p className="text-blue-100 text-sm mt-1">{isRTL ? 'جلب بيانات المنتج من المورد آلياً' : 'Fetch product data automatically'}</p>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-white/70 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleImportProduct} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم المنتج (SKU) لدى المورد' : 'Supplier SKU'}</label>
                <input type="text" required value={importSku} onChange={e => setImportSku(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-mono text-center text-lg tracking-widest" placeholder="مثال: CJ12345678" dir="ltr" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'اختر المورد الدولي' : 'Select Dropshipping Supplier'}</label>
                <select required value={importSupplierId} onChange={e => setImportSupplierId(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-bold cursor-pointer">
                  <option value="" disabled>{isRTL ? 'اختر...' : 'Select...'}</option>
                  {suppliers.filter(s => s.type === 'international').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : (isRTL ? 'استيراد الآن' : 'Import Now')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* 🌟 2. نافذة إضافة/تعديل المنتج اليدوية والمراجعة 🌟 */}
      {/* ================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-[#2C2C2C] p-6 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold">{currentProduct.id ? (isRTL ? 'تعديل المنتج' : 'Edit Product') : (isRTL ? 'إضافة منتج جديد' : 'Add New Product')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* قسم المورد والتكلفة (أهم قسم مالي) */}
              <div className="md:col-span-2 bg-yellow-50 p-6 rounded-2xl border border-yellow-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-yellow-800 mb-2">{isRTL ? 'ارتباط المورد' : 'Supplier Link'}</label>
                  <select value={currentProduct.supplier_id || ''} onChange={e => setCurrentProduct({...currentProduct, supplier_id: e.target.value})} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:border-yellow-500 bg-white font-bold cursor-pointer">
                    <option value="">{isRTL ? 'منتج داخلي (لا يوجد مورد)' : 'In-house (No Supplier)'}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.type === 'local' ? 'محلي' : 'دولي'})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-yellow-800 mb-2">{isRTL ? 'رقم المنتج (SKU)' : 'Product SKU'}</label>
                  <input type="text" value={currentProduct.sku || ''} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} className="w-full p-3 border border-yellow-300 rounded-xl outline-none focus:border-yellow-500 bg-white font-mono" dir="ltr" placeholder="NSJ-001" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-600 mb-2">{isRTL ? 'سعر التكلفة (للمورد) ر.س' : 'Supply Cost SAR'}</label>
                  <input type="number" required value={currentProduct.supply_price || 0} onChange={e => setCurrentProduct({...currentProduct, supply_price: parseFloat(e.target.value)})} className="w-full p-3 border border-red-300 rounded-xl outline-none focus:border-red-500 bg-white font-bold text-red-600" dir="ltr" />
                </div>
              </div>

              {/* البيانات الأساسية */}
              <div><label className="block text-sm font-bold text-gray-700 mb-2">اسم المنتج (عربي)</label><input type="text" required value={currentProduct.name_ar} onChange={e => setCurrentProduct({...currentProduct, name_ar: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="rtl" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">Product Name (English)</label><input type="text" required value={currentProduct.name_en} onChange={e => setCurrentProduct({...currentProduct, name_en: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
              
              <div><label className="block text-sm font-bold text-green-600 mb-2">{isRTL ? 'سعر البيع (للعميل) ر.س' : 'Sale Price SAR'}</label><input type="number" required value={currentProduct.price || 0} onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})} className="w-full p-3 border border-green-300 rounded-xl outline-none focus:border-green-500 font-bold text-green-600 bg-green-50" dir="ltr" /></div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'القسم' : 'Category'}</label>
                <select required value={currentProduct.category} onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white cursor-pointer">
                  <option value="" disabled>{isRTL ? 'اختر القسم...' : 'Select Category...'}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الكمية المتوفرة' : 'Stock Quantity'}</label><input type="number" required value={currentProduct.stock || 0} onChange={e => setCurrentProduct({...currentProduct, stock: parseInt(e.target.value)})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'روابط الصور (مفصولة بفاصلة , )' : 'Image URLs (comma separated)'}</label><textarea rows={2} value={(currentProduct.images || []).join(', ')} onChange={e => setCurrentProduct({...currentProduct, images: e.target.value.split(',').map(u => u.trim()).filter(u => u)})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] font-mono text-sm" dir="ltr" /></div>

              <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-2">الوصف (عربي)</label><textarea rows={4} required value={currentProduct.description_ar} onChange={e => setCurrentProduct({...currentProduct, description_ar: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="rtl" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-2">Description (English)</label><textarea rows={4} required value={currentProduct.description_en} onChange={e => setCurrentProduct({...currentProduct, description_en: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>

              <div className="md:col-span-2 pt-6 border-t border-gray-100 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> {isRTL ? 'حفظ المنتج واعتماده' : 'Save Product'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};