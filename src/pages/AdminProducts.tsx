import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { Search, Plus, Edit2, Trash2, Download, Upload, Loader2, X, Save, Image as ImageIcon, Star, Video, PlusCircle } from 'lucide-react';

export const AdminProducts = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  const [products, setProducts] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<'basic' | 'ar' | 'en'>('basic');

  // تحديث النموذج ليشمل المعرض والفيديو
  const [formData, setFormData] = useState({
    id: '', sku: '', base_price: 0, image_lifestyle: '', gallery: [] as string[], video_url: '', collection_id: '', is_dynamic_size: false,
    title_ar: '', category_ar: '', sub_category_ar: '', short_desc_ar: '', long_desc_ar: '',
    title_en: '', category_en: '', sub_category_en: '', short_desc_en: '', long_desc_en: ''
  });

  const text = {
    ar: {
      title: 'إدارة المنتجات والكتالوج', search: 'ابحث برمز SKU أو اسم المنتج...',
      addProduct: 'إضافة منتج', export: 'تصدير CSV', import: 'استيراد CSV',
      sku: 'رمز المنتج (SKU)', name: 'الاسم', price: 'السعر الأساسي', category: 'القسم الرئيسي',
      actions: 'إجراءات', success: 'تم الحفظ بنجاح!', confirmDelete: 'هل أنت متأكد من الحذف؟',
      formBasic: 'البيانات الأساسية ومعرض الصور', formAr: 'التفاصيل (عربي)', formEn: 'التفاصيل (English)',
      collection: 'مجموعة الارتباط (Cross-sell)', dynamicSize: 'منتج يباع بالمتر (ديناميكي)',
      cancel: 'إلغاء', save: 'حفظ المنتج',
      selectOrAddCat: 'اختر أو اكتب قسماً جديداً...', selectOrAddSub: 'اختر أو اكتب قسماً فرعياً...'
    },
    en: {
      title: 'Products & Catalog Management', search: 'Search by SKU or Title...',
      addProduct: 'Add Product', export: 'Export CSV', import: 'Import CSV',
      sku: 'SKU (Auto)', name: 'Title', price: 'Base Price', category: 'Category',
      actions: 'Actions', success: 'Saved successfully!', confirmDelete: 'Are you sure?',
      formBasic: 'Basic Info & Media', formAr: 'Details (Arabic)', formEn: 'Details (English)',
      collection: 'Related Collection (Cross-sell)', dynamicSize: 'Sold by Meter (Dynamic)',
      cancel: 'Cancel', save: 'Save Product',
      selectOrAddCat: 'Select or type new category...', selectOrAddSub: 'Select or type new sub-category...'
    }
  };
  const t = text[language as keyof typeof text];

  const uniqueCategoriesAr = Array.from(new Set(products.map(p => p.category_ar).filter(Boolean)));
  const uniqueSubCategoriesAr = Array.from(new Set(products.map(p => p.sub_category_ar).filter(Boolean)));
  const uniqueCategoriesEn = Array.from(new Set(products.map(p => p.category_en).filter(Boolean)));
  const uniqueSubCategoriesEn = Array.from(new Set(products.map(p => p.sub_category_en).filter(Boolean)));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const { data: cols } = await supabase.from('collections').select('*');
      if (prods) setProducts(prods);
      if (cols) setCollections(cols);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // دالة توليد الـ SKU التلقائي
  const generateNextSku = () => {
    const prefix = 'NSJ-';
    let maxNum = 1000; // البداية من 1000
    products.forEach(p => {
      if (p.sku && p.sku.startsWith(prefix)) {
        const num = parseInt(p.sku.replace(prefix, ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${maxNum + 1}`;
  };

  const openAddModal = () => {
    setModalMode('add');
    const autoSku = generateNextSku(); // توليد الرمز
    setFormData({ 
      id: '', sku: autoSku, base_price: 0, image_lifestyle: '', gallery: [], video_url: '', collection_id: '', is_dynamic_size: false, 
      title_ar: '', category_ar: '', sub_category_ar: '', short_desc_ar: '', long_desc_ar: '', 
      title_en: '', category_en: '', sub_category_en: '', short_desc_en: '', long_desc_en: '' 
    });
    setFormTab('basic'); setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setModalMode('edit'); 
    // التأكد من أن المعرض عبارة عن مصفوفة (لمنع الأخطاء مع المنتجات القديمة)
    setFormData({ ...product, gallery: product.gallery || [], video_url: product.video_url || '' }); 
    setFormTab('basic'); setIsModalOpen(true);
  };

  // دوال إدارة معرض الصور (Gallery)
  const handleAddGalleryImage = () => {
    setFormData({ ...formData, gallery: [...formData.gallery, ''] });
  };
  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...formData.gallery];
    newGallery[index] = value;
    setFormData({ ...formData, gallery: newGallery });
  };
  const handleRemoveGalleryImage = (index: number) => {
    const newGallery = formData.gallery.filter((_, i) => i !== index);
    setFormData({ ...formData, gallery: newGallery });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.collection_id === '') payload.collection_id = null as any; 
      // تنظيف الروابط الفارغة من المعرض قبل الحفظ
      payload.gallery = payload.gallery.filter(url => url.trim() !== '');

      if (modalMode === 'add') {
        delete (payload as any).id; 
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', formData.id);
        if (error) throw error;
      }
      setIsModalOpen(false); fetchData();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    try { await supabase.from('products').delete().eq('id', id); fetchData(); } 
    catch (error: any) { alert(error.message); }
  };

  const handleExportCSV = () => {
    // نقوم بتحويل مصفوفة المعرض لنص مفصول بفواصل لكي يقبله الإكسيل
    const exportData = products.map(p => ({ ...p, gallery: p.gallery?.join(' | ') || '' }));
    const csv = '\ufeff' + Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.setAttribute('download', `naseej_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsLoading(true);
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => {
        try {
          // إعادة تحويل النص إلى مصفوفة صور عند الاستيراد
          const formattedData = results.data.map((row: any) => ({
             ...row, 
             gallery: row.gallery ? row.gallery.split(' | ').filter(Boolean) : [] 
          }));
          const { error } = await supabase.from('products').upsert(formattedData);
          if (error) throw error; alert(t.success); fetchData();
        } catch (error: any) { alert('Error: ' + error.message); setIsLoading(false); }
      }
    });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-[#2C2C2C]">{t.title}</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 shadow-sm"><Download size={18} /> {t.export}</button>
          <label className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl flex items-center gap-2 hover:bg-gray-50 shadow-sm cursor-pointer"><Upload size={18} /> {t.import}<input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} /></label>
          <button onClick={openAddModal} className="px-6 py-2 bg-[#C5A059] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#b08d4b] shadow-lg shadow-[#C5A059]/20"><Plus size={20} /> {t.addProduct}</button>
        </div>
      </div>

      <div className="relative w-full lg:w-1/3 mb-6">
        <Search className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
        <input type="text" placeholder={t.search} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white shadow-sm`} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 w-16"></th><th className="p-4 font-bold">{t.sku}</th><th className="p-4 font-bold">{t.name}</th><th className="p-4 font-bold">{t.category}</th><th className="p-4 font-bold">{t.price}</th><th className="p-4 font-bold text-center">التقييمات</th><th className="p-4 font-bold text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4"><div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative">
                    <img src={product.image_lifestyle || 'https://via.placeholder.com/150'} alt="product" className="w-full h-full object-cover" />
                    {product.gallery?.length > 0 && <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl">+</span>}
                  </div></td>
                  <td className="p-4 font-bold text-gray-500">{product.sku}</td>
                  <td className="p-4 font-bold text-[#2C2C2C]">{isRTL ? product.title_ar : product.title_en}</td>
                  <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">{isRTL ? product.category_ar : product.category_en}</span></td>
                  <td className="p-4 font-bold text-[#C5A059]">{product.base_price} {isRTL ? 'ر.س' : 'SAR'}</td>
                  <td className="p-4 text-center"><div className="flex items-center justify-center gap-1 text-yellow-500 font-bold"><Star size={14} fill="currentColor"/> 5.0</div></td>
                  <td className="p-4 flex justify-center gap-2 items-center h-full pt-6">
                    <button onClick={() => openEditModal(product)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-xl text-[#2C2C2C]">{modalMode === 'add' ? t.addProduct : (isRTL ? formData.title_ar : formData.title_en)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-2 gap-4">
              <button onClick={() => setFormTab('basic')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'basic' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.formBasic}</button>
              <button onClick={() => setFormTab('ar')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'ar' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.formAr}</button>
              <button onClick={() => setFormTab('en')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'en' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.formEn}</button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6">
              
              {/* التبويب الأساسي والصور */}
              {formTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* قفلنا حقل الـ SKU وجعلناه غير قابل للتعديل عند الإضافة ليتم الحفاظ على التسلسل */}
                  <div><label className="block text-sm font-bold mb-2">{t.sku} (تلقائي)</label><input required type="text" value={formData.sku} disabled={modalMode === 'add'} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full p-3 border rounded-xl outline-none bg-gray-100 text-gray-500 cursor-not-allowed font-bold" /></div>
                  <div><label className="block text-sm font-bold mb-2">{t.price}</label><input required type="number" step="0.01" value={formData.base_price} onChange={e => setFormData({...formData, base_price: parseFloat(e.target.value)})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  
                  {/* الصورة الرئيسية */}
                  <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">رابط الصورة الرئيسية للمنتج</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative"><ImageIcon className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20}/><input type="url" value={formData.image_lifestyle} onChange={e => setFormData({...formData, image_lifestyle: e.target.value})} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border rounded-xl outline-none focus:border-[#C5A059]`} dir="ltr" placeholder="https://..." /></div>
                      {formData.image_lifestyle && <img src={formData.image_lifestyle} alt="preview" className="w-12 h-12 rounded-lg object-cover border" />}
                    </div>
                  </div>

                  {/* معرض الصور المتعددة */}
                  <div className="md:col-span-2 border border-gray-200 p-4 rounded-xl bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold">معرض الصور الإضافية (Gallery)</label>
                      <button type="button" onClick={handleAddGalleryImage} className="text-sm text-[#C5A059] font-bold flex items-center gap-1 hover:underline"><PlusCircle size={16}/> إضافة صورة</button>
                    </div>
                    {formData.gallery.length === 0 && <p className="text-xs text-gray-400">لم يتم إضافة صور إضافية بعد.</p>}
                    <div className="space-y-2">
                      {formData.gallery.map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="url" value={url} onChange={e => handleGalleryChange(idx, e.target.value)} className="flex-1 p-2 border rounded-lg outline-none focus:border-[#C5A059] text-sm" dir="ltr" placeholder="https://..." />
                          {url && <img src={url} alt="g-preview" className="w-10 h-10 rounded object-cover border" />}
                          <button type="button" onClick={() => handleRemoveGalleryImage(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* رابط الفيديو */}
                  <div className="md:col-span-2"><label className="block text-sm font-bold mb-2">رابط فيديو استعراضي (اختياري)</label>
                    <div className="relative">
                      <Video className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20}/>
                      <input type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border rounded-xl outline-none focus:border-[#C5A059]`} dir="ltr" placeholder="مثال: رابط يوتيوب أو فيديو MP4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-[#C5A059]">{t.collection}</label>
                    <select value={formData.collection_id || ''} onChange={e => setFormData({...formData, collection_id: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-white">
                      <option value="">-- مستقل (بدون مجموعة) --</option>
                      {collections.map(col => (<option key={col.id} value={col.id}>{isRTL ? col.name_ar : col.name_en}</option>))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 mt-7">
                    <input type="checkbox" id="dynamicSize" checked={formData.is_dynamic_size} onChange={e => setFormData({...formData, is_dynamic_size: e.target.checked})} className="w-5 h-5 accent-[#C5A059] rounded" />
                    <label htmlFor="dynamicSize" className="font-bold text-[#2C2C2C] cursor-pointer">{t.dynamicSize}</label>
                  </div>
                </div>
              )}

              {/* التبويب العربي */}
              {formTab === 'ar' && (
                <div className="space-y-4" dir="rtl">
                  <div><label className="block text-sm font-bold mb-2">اسم المنتج</label><input required type="text" value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-[#C5A059]">القسم الرئيسي</label>
                      <input required list="cat-ar-list" value={formData.category_ar} onChange={e => setFormData({...formData, category_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-colors" placeholder={text.ar.selectOrAddCat} />
                      <datalist id="cat-ar-list">{uniqueCategoriesAr.map(c => <option key={c as string} value={c as string} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-[#C5A059]">القسم الفرعي</label>
                      <input required list="sub-ar-list" value={formData.sub_category_ar} onChange={e => setFormData({...formData, sub_category_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-colors" placeholder={text.ar.selectOrAddSub} />
                      <datalist id="sub-ar-list">{uniqueSubCategoriesAr.map(c => <option key={c as string} value={c as string} />)}</datalist>
                    </div>
                  </div>
                  <div><label className="block text-sm font-bold mb-2">الوصف القصير</label><textarea required rows={2} value={formData.short_desc_ar} onChange={e => setFormData({...formData, short_desc_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  <div><label className="block text-sm font-bold mb-2">الوصف الشامل والتفاصيل</label><textarea required rows={5} value={formData.long_desc_ar} onChange={e => setFormData({...formData, long_desc_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                </div>
              )}

              {/* التبويب الإنجليزي */}
              {formTab === 'en' && (
                <div className="space-y-4" dir="ltr">
                  <div><label className="block text-sm font-bold mb-2">Product Title</label><input required type="text" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-[#C5A059]">Main Category</label>
                      <input required list="cat-en-list" value={formData.category_en} onChange={e => setFormData({...formData, category_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-colors" placeholder={text.en.selectOrAddCat} />
                      <datalist id="cat-en-list">{uniqueCategoriesEn.map(c => <option key={c as string} value={c as string} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-[#C5A059]">Sub Category</label>
                      <input required list="sub-en-list" value={formData.sub_category_en} onChange={e => setFormData({...formData, sub_category_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-colors" placeholder={text.en.selectOrAddSub} />
                      <datalist id="sub-en-list">{uniqueSubCategoriesEn.map(c => <option key={c as string} value={c as string} />)}</datalist>
                    </div>
                  </div>
                  <div><label className="block text-sm font-bold mb-2">Short Description</label><textarea required rows={2} value={formData.short_desc_en} onChange={e => setFormData({...formData, short_desc_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  <div><label className="block text-sm font-bold mb-2">Long Details & Description</label><textarea required rows={5} value={formData.long_desc_en} onChange={e => setFormData({...formData, long_desc_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                </div>
              )}

            </form>

            <div className="p-6 border-t border-gray-100 bg-white flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">{t.cancel}</button>
              <button type="button" onClick={handleSaveProduct} disabled={isSubmitting} className="flex-1 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {t.save}</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};