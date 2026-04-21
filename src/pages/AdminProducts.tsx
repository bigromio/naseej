import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Search, Filter, Loader2, Save, X, DownloadCloud, UploadCloud, Store, Package, FileDown, Globe, MapPin } from 'lucide-react';

export interface ProductRow {
  id?: string;
  sku: string;
  title_ar: string;
  title_en: string;
  category_ar: string;
  category_en: string;
  sub_category_ar: string;
  sub_category_en: string;
  short_desc_ar: string;
  short_desc_en: string;
  long_desc_ar: string;
  long_desc_en: string;
  base_price: number;
  supply_price: number;
  discount_price?: number;
  width_cm: number;
  length_cm: number;
  height_cm: number;
  image_lifestyle: string;
  image_blueprint?: string;
  video_url?: string;
  gallery?: string[];
  supplier_id?: string;
  collection_id?: string;
  is_active: boolean;
}

export const AdminProducts = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';
  
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultProduct: ProductRow = {
    sku: '', title_ar: '', title_en: '', category_ar: 'أثاث', category_en: 'Furniture',
    sub_category_ar: '', sub_category_en: '', short_desc_ar: '', short_desc_en: '',
    long_desc_ar: '', long_desc_en: '', base_price: 0, supply_price: 0, discount_price: 0,
    width_cm: 0, length_cm: 0, height_cm: 0, image_lifestyle: '', video_url: '', supplier_id: '', is_active: true
  };

  const [currentProduct, setCurrentProduct] = useState<ProductRow>(defaultProduct);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: prods, error: prodError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prodError) throw prodError;
      if (prods) setProducts(prods as ProductRow[]);

      const { data: sups } = await supabase.from('suppliers').select('id, name, type');
      if (sups) setSuppliers(sups);
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
  // 🌟 نظام تصدير واستيراد CSV (شامل لكل الأعمدة والمزامنة)
  // ==========================================
  const downloadCSV = (type: 'template' | 'full') => {
    const headers = [
      'sku', 'title_ar', 'title_en', 'category_ar', 'category_en', 'sub_category_ar', 'sub_category_en', 
      'short_desc_ar', 'long_desc_ar', 'long_desc_en', 'base_price', 'supply_price', 'discount_price', 
      'width_cm', 'length_cm', 'height_cm', 'image_lifestyle', 'video_url', 'gallery', 'is_active'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    if (type === 'full') {
      products.forEach(p => {
        const row = headers.map(header => {
          let val = (p as any)[header];
          if (val === null || val === undefined) val = '';
          if (header === 'gallery' && Array.isArray(val)) val = val.join(' | '); // دمج مصفوفة الصور
          if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
          return val;
        });
        csvContent += row.join(',') + '\n';
      });
    } else {
      csvContent += `DEMO-123,كنب,Sofa,غرف المعيشة,Living,أصالة,Asala,مخمل,وصف طويل,Long Desc,2500,1000,0,200,90,80,https://img.com/1.jpg,,https://img.com/2.jpg | https://img.com/3.jpg,true\n`;
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = type === 'template' ? 'Naseej_Template.csv' : 'Naseej_Full_Catalog.csv';
    link.click();
  };

  // ==========================================
  // 🌟 نظام تصدير واستيراد CSV (المحدث والآمن)
  // ==========================================
  
  // دالة قراءة CSV متقدمة تحمي الفواصل والأسطر (Line Breaks) داخل الوصف
  const parseCSV = (text: string) => {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (let l of text) {
      if ('"' === l) {
        if (s && l === p) row[i] += l;
        s = !s;
      } else if (',' === l && s) l = row[++i] = '';
      else if ('\n' === l && s) {
        if ('\r' === p) row[i] = row[i].slice(0, -1);
        row = ret[++r] = [l = '']; i = 0;
      } else row[i] += l;
      p = l;
    }
    if (ret[ret.length - 1].length === 1 && ret[ret.length - 1][0] === '') ret.pop();
    return ret;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isSyncMode = window.confirm(
      isRTL 
      ? "هل تريد تفعيل [المزامنة الكاملة]؟\n\n- موافق (OK): سيتم تحديث وإضافة المنتجات، وسيتم حذف أي منتج غير موجود في هذا الملف!\n- إلغاء (Cancel): سيتم إضافة وتحديث المنتجات فقط."
      : "Enable [Full Sync Mode]?\n\n- OK: Will update/add AND DELETE products not in this file.\n- Cancel: Will only add/update products."
    );

    setIsImportingCSV(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // 🌟 استخدام الدالة الذكية بدلاً من split العادية
        const parsedRows = parseCSV(text);
        const csvHeaders = parsedRows[0].map(h => h.trim());
        
        const parsedData = parsedRows.slice(1).map(row => {
          let obj: any = {};
          csvHeaders.forEach((header, i) => {
            obj[header] = row[i] ? row[i].trim() : '';
          });
          return obj;
        });

        // تنظيف البيانات والتأكد من الصيغ
        const validData = parsedData.filter(d => d.sku).map(d => ({
          sku: d.sku,
          title_ar: d.title_ar, title_en: d.title_en,
          category_ar: d.category_ar, category_en: d.category_en,
          sub_category_ar: d.sub_category_ar, sub_category_en: d.sub_category_en,
collection_name_ar: d.collection_name_ar || '', collection_name_en: d.collection_name_en || '',
short_desc_ar: d.short_desc_ar || '', short_desc_en: d.short_desc_en || '',
          long_desc_ar: d.long_desc_ar || '', long_desc_en: d.long_desc_en || '',
          base_price: parseFloat(d.base_price) || 0,
          supply_price: parseFloat(d.supply_price) || 0,
          discount_price: parseFloat(d.discount_price) || null,
          width_cm: parseFloat(d.width_cm) || 0, length_cm: parseFloat(d.length_cm) || 0, height_cm: parseFloat(d.height_cm) || 0,
          image_lifestyle: d.image_lifestyle || '', image_blueprint: d.image_blueprint || '', video_url: d.video_url || '',
          gallery: d.gallery ? d.gallery.split('|').map((url: string) => url.trim()) : [],
          supplier_id: d.supplier_id || null, collection_id: d.collection_id || null,
          is_active: d.is_active === 'false' || d.is_active === 'FALSE' ? false : true
        }));

        // إزالة التكرار من الملف
        const uniqueDataMap = new Map();
        validData.forEach(item => uniqueDataMap.set(item.sku, item));
        const finalUniqueData = Array.from(uniqueDataMap.values());

        if (finalUniqueData.length > 0) {
          const { error: upsertError } = await supabase.from('products').upsert(finalUniqueData, { onConflict: 'sku' });
          if (upsertError) throw upsertError;

          if (isSyncMode) {
            const uploadedSkus = finalUniqueData.map(d => d.sku);
            const skusToDelete = products.filter(p => !uploadedSkus.includes(p.sku)).map(p => p.id);
            
            if (skusToDelete.length > 0) {
              const { error: deleteError } = await supabase.from('products').delete().in('id', skusToDelete);
              if (deleteError) throw deleteError;
              alert(isRTL ? `تمت المزامنة بنجاح!\nتم رفع: ${finalUniqueData.length}\nتم حذف: ${skusToDelete.length} منتج قديم.` : `Sync Complete!\nUpserted: ${finalUniqueData.length}\nDeleted: ${skusToDelete.length}`);
            } else {
              alert(isRTL ? 'تم رفع المنتجات ولا يوجد شيء ليتم حذفه.' : 'Upserted successfully.');
            }
          } else {
            alert(isRTL ? `تم إضافة/تحديث ${finalUniqueData.length} منتج بنجاح.` : `Successfully upserted ${finalUniqueData.length} products.`);
          }

          fetchData();
        }
      } catch (err: any) {
        alert(isRTL ? `خطأ أثناء العملية: ${err.message}` : `Process Error: ${err.message}`);
      } finally {
        setIsImportingCSV(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ==========================================
  // 🌟 إضافة وحذف يدوي من اللوحة
  // ==========================================
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
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(isRTL ? 'تأكيد الحذف؟' : 'Confirm deletion?')) return;
    try {
      await supabase.from('products').delete().eq('id', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      alert('Error');
    }
  };

  const uniqueCategories = Array.from(new Set(products.map(p => p.category_ar).filter(Boolean)));
  const filteredProducts = products.filter(product => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (product.title_ar?.toLowerCase() || '').includes(searchLower) || (product.sku?.toLowerCase() || '').includes(searchLower);
    const matchesCategory = selectedCategory === 'all' || product.category_ar === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 🌟 رأس الصفحة */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
            <Package className="text-[#C5A059]" /> {isRTL ? 'إدارة المنتجات والمخزون' : 'Products & Inventory'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isRTL ? 'تحكم كامل بمنتجاتك: إضافة، مزامنة عبر الإكسل، وتصدير البيانات.' : 'Full control: Add, CSV Sync, and Export.'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button onClick={() => downloadCSV('template')} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-white rounded-lg flex items-center gap-2">
              <FileDown size={16}/> {isRTL ? 'قالب' : 'Template'}
            </button>
            <button onClick={() => downloadCSV('full')} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-green-600 hover:bg-white rounded-lg flex items-center gap-2">
              <DownloadCloud size={16}/> {isRTL ? 'تصدير الكل' : 'Export All'}
            </button>
            <div className="relative">
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label htmlFor="csv-upload" className={`px-4 py-2 text-sm font-bold text-gray-600 hover:text-[#C5A059] hover:bg-white rounded-lg flex items-center gap-2 cursor-pointer ${isImportingCSV ? 'opacity-50 pointer-events-none' : ''}`}>
                {isImportingCSV ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>} 
                {isRTL ? 'رفع ومزامنة' : 'Upload & Sync'}
              </label>
            </div>
          </div>
          <button onClick={() => { setCurrentProduct(defaultProduct); setIsModalOpen(true); }} className="bg-[#2C2C2C] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#C5A059] flex items-center gap-2 shadow-md">
            <Plus size={18}/> {isRTL ? 'إضافة منتج' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* 🌟 البحث */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input type="text" placeholder={isRTL ? 'ابحث...' : 'Search...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#C5A059] font-bold`} />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="text-gray-400" size={20} />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-[#C5A059] font-bold">
            <option value="all">{isRTL ? 'جميع الأقسام' : 'All Categories'}</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {/* 🌟 الجدول */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-start font-bold text-gray-600">المنتج</th>
                  <th className="p-4 text-start font-bold text-gray-600">المورد</th>
                  <th className="p-4 text-start font-bold text-gray-600">سعر البيع (التكلفة)</th>
                  <th className="p-4 text-center font-bold text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const supplier = suppliers.find(s => s.id === product.supplier_id);
                  const isDropshipping = supplier && supplier.type === 'international';
                  return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img src={product.image_lifestyle?.trim() ? product.image_lifestyle : 'https://via.placeholder.com/50'} alt="img" className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <div className="font-bold text-[#2C2C2C] max-w-[200px] truncate">{product.title_ar}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {isDropshipping ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100"><Globe size={12}/> {supplier.name}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100"><MapPin size={12}/> محلي</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-green-600">{product.base_price} ر.س</div>
                      {product.discount_price && <div className="text-xs text-orange-500 line-through">{product.discount_price} ر.س</div>}
                      <div className="text-xs text-red-500 mt-1">تكلفة: {product.supply_price}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setCurrentProduct(product); setIsModalOpen(true); }} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg"><Edit2 size={18}/></button>
                        <button onClick={() => handleDeleteProduct(product.id!)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 نافذة إضافة/تعديل */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl my-8 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-[#2C2C2C] p-6 text-white flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold">{currentProduct.id ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 h-[70vh] overflow-y-auto">
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1">SKU</label><input type="text" required value={currentProduct.sku} onChange={e => setCurrentProduct({...currentProduct, sku: e.target.value})} className="w-full p-2 border rounded-lg font-mono text-sm" dir="ltr" /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1">المورد</label><select value={currentProduct.supplier_id || ''} onChange={e => setCurrentProduct({...currentProduct, supplier_id: e.target.value})} className="w-full p-2 border rounded-lg"><option value="">داخلي</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-red-600 mb-1">التكلفة</label><input type="number" value={currentProduct.supply_price} onChange={e => setCurrentProduct({...currentProduct, supply_price: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-red-600" /></div>
                <div><label className="block text-xs font-bold text-green-600 mb-1">البيع</label><input type="number" required value={currentProduct.base_price} onChange={e => setCurrentProduct({...currentProduct, base_price: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-green-600" /></div>
              </div>

              <div><label className="block text-sm font-bold text-gray-700 mb-1">الاسم (عربي)</label><input type="text" required value={currentProduct.title_ar} onChange={e => setCurrentProduct({...currentProduct, title_ar: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Name (English)</label><input type="text" required value={currentProduct.title_en} onChange={e => setCurrentProduct({...currentProduct, title_en: e.target.value})} className="w-full p-3 border rounded-xl" dir="ltr" /></div>
              
              <div><label className="block text-sm font-bold text-gray-700 mb-1">القسم</label><input type="text" required value={currentProduct.category_ar} onChange={e => setCurrentProduct({...currentProduct, category_ar: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">رابط الفيديو (YouTube/MP4)</label><input type="text" value={currentProduct.video_url || ''} onChange={e => setCurrentProduct({...currentProduct, video_url: e.target.value})} className="w-full p-3 border rounded-xl font-mono" dir="ltr" /></div>

              <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl flex gap-4">
                <div className="flex-1"><label className="block text-xs font-bold text-blue-800 mb-1">الطول L</label><input type="number" value={currentProduct.length_cm} onChange={e => setCurrentProduct({...currentProduct, length_cm: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-center" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-blue-800 mb-1">العرض W</label><input type="number" value={currentProduct.width_cm} onChange={e => setCurrentProduct({...currentProduct, width_cm: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-center" /></div>
                <div className="flex-1"><label className="block text-xs font-bold text-blue-800 mb-1">الارتفاع H</label><input type="number" value={currentProduct.height_cm} onChange={e => setCurrentProduct({...currentProduct, height_cm: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg text-center" /></div>
              </div>

              <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">الوصف (عربي)</label><textarea rows={3} value={currentProduct.long_desc_ar} onChange={e => setCurrentProduct({...currentProduct, long_desc_ar: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
              
              <div className="md:col-span-2 pt-4 border-t flex gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 font-bold rounded-xl">إلغاء</button>
                <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-[#C5A059] text-white font-bold rounded-xl flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20}/> حفظ المنتج</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};