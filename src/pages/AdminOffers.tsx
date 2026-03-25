import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Tag, Ticket, MonitorPlay, Loader2, Save, Plus, Trash2, CheckCircle2, XCircle, Search, Filter, Percent } from 'lucide-react';

export const AdminOffers = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'discounts' | 'coupons' | 'banners'>('discounts');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percentage: 10, max_uses: 100, valid_until: '' });

  // ----------------------------------------------------
  // حالات جديدة خاصة بالخصومات الجماعية (Bulk Discounts)
  // ----------------------------------------------------
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [bulkDiscountPercentage, setBulkDiscountPercentage] = useState<number | ''>('');

  const text = {
    ar: {
      title: 'العروض والخصومات', discountsTab: 'خصومات المنتجات', couponsTab: 'كوبونات الخصم', bannersTab: 'إعلانات وبوب-أب',
      save: 'حفظ التغييرات', success: 'تمت العملية بنجاح!', actions: 'إجراءات',
      productTitle: 'المنتج', basePrice: 'السعر الأساسي', discountPrice: 'سعر العرض', 
      addCoupon: 'إضافة كوبون جديد', code: 'كود الكوبون', percentage: 'نسبة الخصم %', maxUses: 'الاستخدام', expiry: 'الانتهاء', status: 'الحالة',
      topBanner: 'الشريط الإعلاني العلوي (Header Banner)', homePopup: 'النافذة المنبثقة (Home Popup HTML)', isActive: 'تفعيل الإعلان', contentAr: 'المحتوى (عربي)', contentEn: 'المحتوى (إنجليزي)',
      search: 'ابحث عن منتج...', allCategories: 'جميع الأقسام', applyDiscount: 'تطبيق خصم', clearDiscount: 'إلغاء الخصم',
      selected: 'منتج محدد', discountPercentage: 'نسبة الخصم %'
    },
    en: {
      title: 'Offers & Discounts', discountsTab: 'Product Discounts', couponsTab: 'Coupons', bannersTab: 'Banners & Popups',
      save: 'Save Changes', success: 'Operation successful!', actions: 'Actions',
      productTitle: 'Product', basePrice: 'Base Price', discountPrice: 'Discount Price',
      addCoupon: 'Add New Coupon', code: 'Coupon Code', percentage: 'Discount %', maxUses: 'Max Uses', expiry: 'Expiry Date', status: 'Status',
      topBanner: 'Top Header Banner', homePopup: 'Home Popup HTML', isActive: 'Enable Banner', contentAr: 'Content (Arabic)', contentEn: 'Content (English)',
      search: 'Search product...', allCategories: 'All Categories', applyDiscount: 'Apply Discount', clearDiscount: 'Clear Discount',
      selected: 'selected', discountPercentage: 'Discount %'
    }
  };
  const t = text[language as keyof typeof text];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // أضفنا جلب الأقسام لكي تعمل الفلاتر
      const [prodsRes, couponsRes, settingsRes] = await Promise.all([
        supabase.from('products').select('id, sku, title_ar, title_en, category_ar, category_en, base_price, discount_price').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*')
      ]);
      
      if (prodsRes.data) setProducts(prodsRes.data);
      if (couponsRes.data) setCoupons(couponsRes.data);
      if (settingsRes.data) {
        const mappedSettings = settingsRes.data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});
        setSettings(mappedSettings);
      }
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ----------------------------------------------------
  // منطق الخصومات الجماعية (Bulk Logic)
  // ----------------------------------------------------
  
  // استخراج الأقسام الفريدة للفلتر
  const uniqueCategories = Array.from(new Set(products.map(p => isRTL ? p.category_ar : p.category_en).filter(Boolean)));

  // فلترة المنتجات بناءً على البحث والقسم
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.title_ar?.includes(searchQuery) || p.title_en?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.includes(searchQuery));
    const matchesCategory = categoryFilter === 'All' || (isRTL ? p.category_ar : p.category_en) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // تحديد / إلغاء تحديد الكل
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedProducts(filteredProducts.map(p => p.id));
    else setSelectedProducts([]);
  };

  // تحديد منتج واحد
  const handleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) setSelectedProducts(selectedProducts.filter(pid => pid !== id));
    else setSelectedProducts([...selectedProducts, id]);
  };

  // تطبيق الخصم الجماعي (بحساب النسبة المئوية من السعر الأساسي)
  const handleApplyBulkDiscount = async () => {
    if (!bulkDiscountPercentage || bulkDiscountPercentage <= 0 || bulkDiscountPercentage >= 100) return;
    setIsSubmitting(true);
    try {
      const updates = selectedProducts.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return Promise.resolve();
        const newPrice = product.base_price - (product.base_price * (Number(bulkDiscountPercentage) / 100));
        return supabase.from('products').update({ discount_price: newPrice }).eq('id', id);
      });
      
      await Promise.all(updates);
      alert(t.success);
      setSelectedProducts([]);
      setBulkDiscountPercentage('');
      fetchData();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  // إزالة الخصم الجماعي
  const handleClearBulkDiscount = async () => {
    setIsSubmitting(true);
    try {
      const updates = selectedProducts.map(id => supabase.from('products').update({ discount_price: null }).eq('id', id));
      await Promise.all(updates);
      alert(t.success);
      setSelectedProducts([]);
      fetchData();
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  // التعديل اليدوي المباشر (للمنتج الواحد)
  const handleUpdateSingleDiscount = async (id: string, discount_price: string) => {
    const val = discount_price === '' ? null : parseFloat(discount_price);
    try {
      await supabase.from('products').update({ discount_price: val }).eq('id', id);
      fetchData();
    } catch (error) { console.error(error); }
  };

  // ... (نفس دوال الكوبونات والإعدادات السابقة)
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = { ...newCoupon, code: newCoupon.code.toUpperCase() };
      const { error } = await supabase.from('coupons').insert([payload]);
      if (error) throw error;
      setNewCoupon({ code: '', discount_percentage: 10, max_uses: 100, valid_until: '' }); fetchData();
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  };
  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('coupons').update({ is_active: !currentStatus }).eq('id', id); fetchData();
  };
  const deleteCoupon = async (id: string) => {
    if(!window.confirm('Are you sure?')) return;
    await supabase.from('coupons').delete().eq('id', id); fetchData();
  };
  const handleSaveSettings = async (id: string) => {
    setIsSubmitting(true);
    try {
      const setting = settings[id];
      const { error } = await supabase.from('site_settings').update({ is_active: setting.is_active, content_ar: setting.content_ar, content_en: setting.content_en }).eq('id', id);
      if (error) throw error; alert(t.success);
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#2C2C2C] mb-8">{t.title}</h2>

      <div className="flex bg-white p-1 rounded-xl w-fit shadow-sm border border-gray-100 mb-6 overflow-x-auto max-w-full">
        <button onClick={() => setActiveTab('discounts')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'discounts' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:text-black'}`}><Tag size={18}/> {t.discountsTab}</button>
        <button onClick={() => setActiveTab('coupons')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'coupons' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:text-black'}`}><Ticket size={18}/> {t.couponsTab}</button>
        <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'banners' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:text-black'}`}><MonitorPlay size={18}/> {t.bannersTab}</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
      ) : (
        <>
          {/* ---------------------------------------------------- */}
          {/* 1. تبويب خصومات المنتجات (تم التحديث للخصم الجماعي) */}
          {/* ---------------------------------------------------- */}
          {activeTab === 'discounts' && (
            <div className="animate-in fade-in space-y-4">
              
              {/* شريط البحث والفلترة */}
              <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                  <Search className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t.search} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50`} />
                </div>
                <div className="relative w-full sm:w-64">
                  <Filter className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 appearance-none`}>
                    <option value="All">{t.allCategories}</option>
                    {uniqueCategories.map(cat => <option key={cat as string} value={cat as string}>{cat as string}</option>)}
                  </select>
                </div>
              </div>

              {/* شريط الإجراءات الجماعية (يظهر فقط عند تحديد منتجات) */}
              {selectedProducts.length > 0 && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-4">
                  <div className="font-bold text-[#C5A059]">
                    {selectedProducts.length} {t.selected}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Percent className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={16} />
                      <input 
                        type="number" min="1" max="99" placeholder={t.discountPercentage}
                        value={bulkDiscountPercentage} onChange={e => setBulkDiscountPercentage(e.target.value ? Number(e.target.value) : '')}
                        className={`w-32 p-2 ${isRTL ? 'pr-8' : 'pl-8'} border border-white rounded-lg outline-none focus:border-[#C5A059] shadow-sm`}
                      />
                    </div>
                    <button onClick={handleApplyBulkDiscount} disabled={isSubmitting || !bulkDiscountPercentage} className="px-4 py-2 bg-[#2C2C2C] text-white font-bold rounded-lg hover:bg-black disabled:opacity-50 flex items-center gap-2">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : t.applyDiscount}
                    </button>
                    <button onClick={handleClearBulkDiscount} disabled={isSubmitting} className="px-4 py-2 bg-white text-red-600 font-bold rounded-lg border border-red-100 hover:bg-red-50 flex items-center gap-2">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : t.clearDiscount}
                    </button>
                  </div>
                </div>
              )}

              {/* جدول المنتجات */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-right min-w-[800px]">
                  <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input type="checkbox" onChange={handleSelectAll} checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length} className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer" />
                      </th>
                      <th className="p-4 font-bold">SKU</th>
                      <th className="p-4 font-bold">{t.productTitle}</th>
                      <th className="p-4 font-bold">{t.basePrice}</th>
                      <th className="p-4 font-bold text-red-500">{t.discountPrice}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map(product => {
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <tr key={product.id} className={`transition-colors ${isSelected ? 'bg-[#C5A059]/5' : 'hover:bg-gray-50/50'}`}>
                          <td className="p-4 text-center">
                            <input type="checkbox" checked={isSelected} onChange={() => handleSelectProduct(product.id)} className="w-4 h-4 accent-[#C5A059] rounded cursor-pointer" />
                          </td>
                          <td className="p-4 text-gray-500">{product.sku}</td>
                          <td className="p-4 font-bold text-[#2C2C2C]">
                            {isRTL ? product.title_ar : product.title_en}
                            <div className="text-xs text-gray-400 font-normal mt-1">{isRTL ? product.category_ar : product.category_en}</div>
                          </td>
                          <td className="p-4 font-bold">{product.base_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</td>
                          <td className="p-4">
                            <input 
                              type="number" step="0.01"
                              defaultValue={product.discount_price || ''}
                              onBlur={(e) => handleUpdateSingleDiscount(product.id, e.target.value)}
                              placeholder="أدخل سعر..."
                              className="w-32 p-2 border border-gray-200 rounded-lg focus:border-[#C5A059] outline-none bg-white text-red-600 font-bold"
                            />
                            {product.discount_price && (
                              <div className="text-xs text-green-600 mt-1 font-bold">
                                خصم {Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}%
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredProducts.length === 0 && <div className="p-8 text-center text-gray-400">لا توجد منتجات مطابقة للبحث.</div>}
              </div>
            </div>
          )}

          {/* ... تبويب الكوبونات والإعلانات يبقى كما هو ... */}
          {activeTab === 'coupons' && (
            <div className="animate-in fade-in space-y-8">
              <form onSubmit={handleAddCoupon} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]"><label className="block text-sm font-bold mb-2">{t.code}</label><input required type="text" value={newCoupon.code} onChange={e=>setNewCoupon({...newCoupon, code: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" placeholder="SUMMER20" dir="ltr"/></div>
                <div className="w-32"><label className="block text-sm font-bold mb-2">{t.percentage}</label><input required type="number" min="1" max="100" value={newCoupon.discount_percentage} onChange={e=>setNewCoupon({...newCoupon, discount_percentage: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                <div className="w-32"><label className="block text-sm font-bold mb-2">{t.maxUses}</label><input required type="number" min="1" value={newCoupon.max_uses} onChange={e=>setNewCoupon({...newCoupon, max_uses: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                <div className="flex-1 min-w-[150px]"><label className="block text-sm font-bold mb-2">{t.expiry}</label><input required type="datetime-local" value={newCoupon.valid_until} onChange={e=>setNewCoupon({...newCoupon, valid_until: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                <button type="submit" disabled={isSubmitting} className="py-3 px-6 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-black flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Plus size={20}/> إضافة</>}</button>
              </form>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="w-full text-right min-w-[800px]">
                  <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                    <tr><th className="p-4 font-bold">{t.code}</th><th className="p-4 font-bold">{t.percentage}</th><th className="p-4 font-bold">الاستخدام</th><th className="p-4 font-bold">{t.expiry}</th><th className="p-4 font-bold">{t.status}</th><th className="p-4 font-bold text-center">{t.actions}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {coupons.map(coupon => (
                      <tr key={coupon.id}>
                        <td className="p-4 font-bold text-lg text-[#C5A059]" dir="ltr">{coupon.code}</td>
                        <td className="p-4 font-bold text-red-500">{coupon.discount_percentage}%</td>
                        <td className="p-4">{coupon.uses_count} / {coupon.max_uses}</td>
                        <td className="p-4 text-gray-500" dir="ltr">{new Date(coupon.valid_until).toLocaleDateString()}</td>
                        <td className="p-4"><button onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)} className={`flex items-center gap-1 font-bold ${coupon.is_active ? 'text-green-600' : 'text-gray-400'}`}>{coupon.is_active ? <CheckCircle2 size={18}/> : <XCircle size={18}/>} {coupon.is_active ? 'فعال' : 'معطل'}</button></td>
                        <td className="p-4 text-center"><button onClick={() => deleteCoupon(coupon.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'banners' && settings && (
            <div className="animate-in fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><MonitorPlay className="text-[#C5A059]"/> {t.topBanner}</h3>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings['top_banner']?.is_active || false} onChange={e => setSettings({...settings, top_banner: {...settings['top_banner'], is_active: e.target.checked}})} className="w-5 h-5 accent-[#C5A059] rounded" /><span className="font-bold">{t.isActive}</span></label>
                </div>
                <div><label className="block text-sm font-bold mb-2">{t.contentAr}</label><textarea rows={3} value={settings['top_banner']?.content_ar || ''} onChange={e => setSettings({...settings, top_banner: {...settings['top_banner'], content_ar: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" /></div>
                <div><label className="block text-sm font-bold mb-2">{t.contentEn}</label><textarea rows={3} value={settings['top_banner']?.content_en || ''} onChange={e => setSettings({...settings, top_banner: {...settings['top_banner'], content_en: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
                <button onClick={() => handleSaveSettings('top_banner')} disabled={isSubmitting} className="w-full py-3 bg-[#C5A059] text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[#b08d4b]">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {t.save}</>}</button>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2"><MonitorPlay className="text-[#C5A059]"/> {t.homePopup}</h3>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={settings['home_popup']?.is_active || false} onChange={e => setSettings({...settings, home_popup: {...settings['home_popup'], is_active: e.target.checked}})} className="w-5 h-5 accent-[#C5A059] rounded" /><span className="font-bold">{t.isActive}</span></label>
                </div>
                <div><label className="block text-sm font-bold mb-2">{t.contentAr} (HTML)</label><textarea rows={4} value={settings['home_popup']?.content_ar || ''} onChange={e => setSettings({...settings, home_popup: {...settings['home_popup'], content_ar: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] font-mono text-left" dir="ltr" /></div>
                <div><label className="block text-sm font-bold mb-2">{t.contentEn} (HTML)</label><textarea rows={4} value={settings['home_popup']?.content_en || ''} onChange={e => setSettings({...settings, home_popup: {...settings['home_popup'], content_en: e.target.value}})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] font-mono text-left" dir="ltr" /></div>
                <button onClick={() => handleSaveSettings('home_popup')} disabled={isSubmitting} className="w-full py-3 bg-[#C5A059] text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[#b08d4b]">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {t.save}</>}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};