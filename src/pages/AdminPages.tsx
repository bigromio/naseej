import React, { useState, useEffect } from 'react';
import { useStore, Page } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Loader2, PlusCircle, Edit2, Trash2, Eye, EyeOff, Save, X, FileText, LayoutTemplate } from 'lucide-react';

export const AdminPages = () => {
  const { language, pages, fetchPages } = useStore();
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<'ar' | 'en' | 'settings'>('ar');
  const [editData, setEditData] = useState<Partial<Page>>({});

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const openModal = (page?: Page) => {
    if (page) {
      setEditData(page);
    } else {
      setEditData({
        slug: '', title_ar: '', title_en: '', content_ar: '', content_en: '',
        show_in_navbar: false, show_in_footer: true, is_active: true, sort_order: pages.length + 1
      });
    }
    setFormTab('ar');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editData.slug || !editData.title_ar || !editData.title_en) {
      alert('يرجى تعبئة الرابط والعناوين الأساسية.'); return;
    }
    // تنظيف الرابط (Slug) ليكون صالحاً للـ URL
    const cleanSlug = editData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    setIsSubmitting(true);
    try {
      const payload = { ...editData, slug: cleanSlug };
      
      if (editData.id) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pages').insert([payload]);
        if (error) throw error;
      }
      
      alert('تم حفظ الصفحة بنجاح!');
      setIsModalOpen(false);
      fetchPages();
    } catch (error: any) {
      alert('حدث خطأ: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصفحة نهائياً؟')) return;
    try {
      await supabase.from('pages').delete().eq('id', id);
      fetchPages();
    } catch (error: any) { alert(error.message); }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('pages').update({ is_active: !currentStatus }).eq('id', id);
      fetchPages();
    } catch (error: any) { alert(error.message); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2"><FileText /> إدارة صفحات المتجر</h2>
          <p className="text-gray-500">أضف صفحات جديدة وتحكم في ظهورها في النافبار أو الفوتر.</p>
        </div>
        <button onClick={() => openModal()} className="bg-[#C5A059] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#b08d4b] transition-colors shadow-lg">
          <PlusCircle size={20} /> إضافة صفحة جديدة
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-start font-bold text-gray-600">عنوان الصفحة</th>
                <th className="p-4 text-start font-bold text-gray-600">الرابط (Slug)</th>
                <th className="p-4 text-center font-bold text-gray-600">أماكن الظهور</th>
                <th className="p-4 text-center font-bold text-gray-600">الحالة</th>
                <th className="p-4 text-center font-bold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-[#2C2C2C]">{isRTL ? page.title_ar : page.title_en}</td>
                  <td className="p-4 text-gray-500 font-mono text-sm" dir="ltr">/{page.slug}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold">
                      <span className={`px-2 py-1 rounded-md ${page.show_in_navbar ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>النافبار</span>
                      <span className={`px-2 py-1 rounded-md ${page.show_in_footer ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>الفوتر</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStatus(page.id, page.is_active)} className={`p-2 rounded-xl transition-colors ${page.is_active ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                      {page.is_active ? <Eye size={20}/> : <EyeOff size={20}/>}
                    </button>
                  </td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => openModal(page)} className="p-2 bg-gray-100 text-gray-600 hover:bg-[#2C2C2C] hover:text-white rounded-xl transition-colors"><Edit2 size={18}/></button>
                    <button onClick={() => handleDelete(page.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا توجد صفحات حالياً.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* نافذة إضافة/تعديل صفحة */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-xl text-[#2C2C2C] flex items-center gap-2"><LayoutTemplate className="text-[#C5A059]"/> {editData.id ? 'تعديل الصفحة' : 'إنشاء صفحة جديدة'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-2 gap-4">
              <button onClick={() => setFormTab('settings')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'settings' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>الإعدادات الأساسية</button>
              <button onClick={() => setFormTab('ar')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'ar' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>المحتوى (عربي)</button>
              <button onClick={() => setFormTab('en')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'en' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>المحتوى (إنجليزي)</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {formTab === 'settings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold mb-2">رابط الصفحة (Slug - بالإنجليزية فقط)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-mono" dir="ltr">naseej.com/</span>
                        <input type="text" placeholder="about-us" value={editData.slug || ''} onChange={(e) => setEditData({...editData, slug: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] font-mono text-left" dir="ltr" />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">استخدم حروف إنجليزية وشرطات فقط (-)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">ترتيب الظهور (رقم)</label>
                      <input type="number" value={editData.sort_order || 0} onChange={(e) => setEditData({...editData, sort_order: Number(e.target.value)})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]" />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <label className="block text-sm font-bold mb-4 text-[#2C2C2C]">أين تود أن تظهر هذه الصفحة؟</label>
                    <div className="flex gap-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={editData.show_in_navbar || false} onChange={(e) => setEditData({...editData, show_in_navbar: e.target.checked})} className="w-5 h-5 accent-[#C5A059]" />
                        <span className="font-bold text-gray-700">شريط التنقل العلوي (Navbar)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={editData.show_in_footer || false} onChange={(e) => setEditData({...editData, show_in_footer: e.target.checked})} className="w-5 h-5 accent-[#C5A059]" />
                        <span className="font-bold text-gray-700">تذييل الموقع (Footer)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {formTab === 'ar' && (
                <div className="space-y-4" dir="rtl">
                  <div>
                    <label className="block text-sm font-bold mb-2">عنوان الصفحة (عربي)</label>
                    <input type="text" placeholder="مثال: من نحن" value={editData.title_ar || ''} onChange={(e) => setEditData({...editData, title_ar: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 flex justify-between">
                      <span>المحتوى (HTML مدعوم)</span>
                    </label>
                    <textarea rows={12} value={editData.content_ar || ''} onChange={(e) => setEditData({...editData, content_ar: e.target.value})} className="w-full p-4 border rounded-xl bg-gray-900 text-green-400 font-mono text-sm outline-none focus:ring-2 ring-[#C5A059]" dir="ltr" placeholder="<div class='p-4'>محتوى الصفحة هنا...</div>" />
                  </div>
                </div>
              )}

              {formTab === 'en' && (
                <div className="space-y-4" dir="ltr">
                  <div>
                    <label className="block text-sm font-bold mb-2">Page Title (English)</label>
                    <input type="text" placeholder="e.g: About Us" value={editData.title_en || ''} onChange={(e) => setEditData({...editData, title_en: e.target.value})} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 flex justify-between">
                      <span>Content (HTML Supported)</span>
                    </label>
                    <textarea rows={12} value={editData.content_en || ''} onChange={(e) => setEditData({...editData, content_en: e.target.value})} className="w-full p-4 border rounded-xl bg-gray-900 text-green-400 font-mono text-sm outline-none focus:ring-2 ring-[#C5A059]" placeholder="<div class='p-4'>Page content here...</div>" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100">إلغاء</button>
              <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> حفظ الصفحة</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};