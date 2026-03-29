import React, { useState, useEffect } from 'react';
import { useStore, HomeSection } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Loader2, ArrowUp, ArrowDown, Edit2, Eye, EyeOff, X, Save, Code, Image as ImageIcon, LayoutTemplate, Palette, Type, PlusCircle, Trash2, Wand2 } from 'lucide-react';

// الباليتات الافتراضية في حال كانت قاعدة البيانات فارغة
const DEFAULT_PALETTES = [
  { id: '1', name: 'ذهبي نسيج (Naseej Gold)', colors: ['#C5A059', '#F5DEB3', '#FFF8DC', '#D4AF37'] },
  { id: '2', name: 'ليلي فاخر (Royal Dark)', colors: ['#2C2C2C', '#1A1A1A', '#4A4A4A', '#C5A059'] },
  { id: '3', name: 'نسيم المحيط (Ocean Breeze)', colors: ['#a1c4fd', '#c2e9fb', '#8fd3f4', '#84fab0'] },
];

export const AdminAppearance = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  const [sections, setSections] = useState<HomeSection[]>([]);
  const [globalTheme, setGlobalTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTab, setFormTab] = useState<'ar' | 'en' | 'settings'>('ar');
  const [editData, setEditData] = useState<HomeSection | null>(null);

  const t = {
    ar: { title: 'مظهر المتجر وبناء الصفحة', desc: 'تحكم في الأقسام، المحتوى، الألوان، الخطوط والشفافية بحرية تامة.', active: 'ظاهر', inactive: 'مخفي', edit: 'تخصيص', modalTitle: 'تخصيص قسم:', save: 'حفظ التغييرات', cancel: 'إلغاء', tabAr: 'المحتوى (عربي)', tabEn: 'المحتوى (إنجليزي)', tabSettings: 'تصميم القسم (الستايل)', success: 'تم حفظ المظهر بنجاح!' },
    en: { title: 'Store Appearance Builder', desc: 'Control sections, content, colors, fonts, and opacity freely.', active: 'Visible', inactive: 'Hidden', edit: 'Customize', modalTitle: 'Customize:', save: 'Save Changes', cancel: 'Cancel', tabAr: 'Content (AR)', tabEn: 'Content (EN)', tabSettings: 'Section Design (Style)', success: 'Saved successfully!' }
  }[language];

  const sectionNames: Record<string, { ar: string, en: string }> = {
    'hero': { ar: 'الواجهة الكبرى (Hero)', en: 'Hero Banner' },
    'features': { ar: 'مميزات المتجر', en: 'Store Features' },
    'categories': { ar: 'شبكة الأقسام', en: 'Categories Grid' },
    'trending_products': { ar: 'المنتجات الشائعة', en: 'Trending Products' },
    'promotional_banner': { ar: 'بانر ترويجي', en: 'Promotional Banner' },
    'video_showcase': { ar: 'عرض فيديو سينمائي', en: 'Video Showcase' },
    'testimonials': { ar: 'آراء العملاء', en: 'Testimonials' },
    'brand_logos': { ar: 'شعارات الماركات', en: 'Brand Logos' },
    'newsletter': { ar: 'القائمة البريدية', en: 'Newsletter' },
    'faq': { ar: 'الأسئلة الشائعة (FAQ)', en: 'FAQ' },
    'contact_info': { ar: 'بيانات التواصل والخريطة', en: 'Contact Info & Map' }, // <--- السطر الجديد
    'custom_html': { ar: 'كود HTML مخصص', en: 'Custom HTML Block' }
  };

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('home_sections').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      
      const themeSection = data.find(s => s.id === 'global_theme');
      let theme = themeSection?.content_ar || {};
      
      // بناء الهيكل الذكي للثيم العام مع دعم الباليتات المخصصة
      setGlobalTheme({
        type: theme.type || 'animated',
        opacity: theme.opacity ?? 80,
        solidColor: theme.solidColor || '#f8f8f8',
        savedPalettes: theme.savedPalettes || DEFAULT_PALETTES,
        activePaletteIds: theme.activePaletteIds || ['1'],
        animationType: theme.animationType || 'fade'
      });

      setSections(data.filter(s => s.id !== 'global_theme') as HomeSection[]);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSections(); }, []);

  const handleSaveGlobalTheme = async () => {
    setIsSavingTheme(true);
    try {
      await supabase.from('home_sections').upsert([{
        id: 'global_theme',
        is_active: true,
        sort_order: 0,
        style_type: 'style1',
        content_ar: globalTheme,
        content_en: globalTheme
      }]);
      alert('تم حفظ إعدادات الخلفية العامة بنجاح!');
    } catch (error) { console.error(error); }
    setIsSavingTheme(false);
  };

  // --- دوال إدارة الباليتات (Palette Manager) ---
  const togglePaletteActive = (id: string) => {
    let currentIds = [...globalTheme.activePaletteIds];
    if (currentIds.includes(id)) {
      if (currentIds.length === 1) return; // منع حذف آخر باليتة نشطة
      currentIds = currentIds.filter(pid => pid !== id);
    } else {
      currentIds.push(id);
    }
    setGlobalTheme({ ...globalTheme, activePaletteIds: currentIds });
  };

  const updatePalette = (id: string, field: 'name' | 'colors', value: any, colorIndex?: number) => {
    const newPalettes = globalTheme.savedPalettes.map((pal: any) => {
      if (pal.id === id) {
        if (field === 'name') return { ...pal, name: value };
        if (field === 'colors' && colorIndex !== undefined) {
          const newColors = [...pal.colors];
          newColors[colorIndex] = value;
          return { ...pal, colors: newColors };
        }
      }
      return pal;
    });
    setGlobalTheme({ ...globalTheme, savedPalettes: newPalettes });
  };

  const addPalette = () => {
    const newId = Date.now().toString();
    const newPalette = { id: newId, name: 'مجموعة ألوان جديدة', colors: ['#ffffff', '#eeeeee', '#dddddd', '#cccccc'] };
    setGlobalTheme({ 
      ...globalTheme, 
      savedPalettes: [...globalTheme.savedPalettes, newPalette],
      activePaletteIds: [...globalTheme.activePaletteIds, newId] // تفعيلها آلياً
    });
  };

  const deletePalette = (id: string) => {
    if (globalTheme.savedPalettes.length === 1) return alert('لا يمكن حذف جميع الباليتات!');
    const newPalettes = globalTheme.savedPalettes.filter((p: any) => p.id !== id);
    const newActiveIds = globalTheme.activePaletteIds.filter((pid: string) => pid !== id);
    setGlobalTheme({ 
      ...globalTheme, 
      savedPalettes: newPalettes, 
      activePaletteIds: newActiveIds.length ? newActiveIds : [newPalettes[0].id] 
    });
  };
  // ---------------------------------------------

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    const newSections = [...sections]; const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const tempOrder = newSections[index].sort_order; newSections[index].sort_order = newSections[targetIndex].sort_order; newSections[targetIndex].sort_order = tempOrder;
    setSections(newSections.sort((a, b) => a.sort_order - b.sort_order));
    await supabase.from('home_sections').upsert([{ id: newSections[index].id, sort_order: newSections[index].sort_order }, { id: newSections[targetIndex].id, sort_order: newSections[targetIndex].sort_order }]);
  };
  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    setSections(sections.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    await supabase.from('home_sections').update({ is_active: !currentStatus }).eq('id', id);
  };
  const openEditModal = (section: HomeSection) => { setEditData({ ...section }); setFormTab('ar'); setIsModalOpen(true); };
  const handleContentChange = (lang: 'ar' | 'en', key: string, value: any) => {
    if (!editData) return; setEditData({ ...editData, [`content_${lang}`]: { ...editData[`content_${lang}` as 'content_ar' | 'content_en'], [key]: value } });
  };
  const handleStyleChange = (key: string, value: string | number) => {
    if (!editData) return; setEditData({ ...editData, content_ar: { ...editData.content_ar, [key]: value }, content_en: { ...editData.content_en, [key]: value } });
  };
  const handleSaveEdit = async () => {
    if (!editData) return; setIsSubmitting(true);
    try {
      const { error } = await supabase.from('home_sections').update({ style_type: editData.style_type, content_ar: editData.content_ar, content_en: editData.content_en }).eq('id', editData.id);
      if (error) throw error; alert(t.success); setIsModalOpen(false); fetchSections();
    } catch (error: any) { alert(error.message); } finally { setIsSubmitting(false); }
  };

  const renderDynamicFields = (lang: 'ar' | 'en') => {
    if (!editData) return null;
    const content = lang === 'ar' ? editData.content_ar : editData.content_en;
    
    return Object.keys(content).map((key) => {
      if (['bg_color', 'bg_opacity', 'font_family', 'font_scale', 'bg_theme', 'type', 'savedPalettes', 'activePaletteIds', 'animationType'].includes(key)) return null;
      const value = content[key];

      // إضافة قسم التحكم في منصات التواصل الاجتماعي
      if (key === 'social_links') {
        return (
          <div key={key} className="col-span-1 md:col-span-2 space-y-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <label className="text-sm font-bold text-[#C5A059]">مواقع التواصل الاجتماعي</label>
              <button type="button" onClick={() => {
                handleContentChange(lang, 'social_links', [...(value || []), { platform: 'instagram', url: '' }]);
              }} className="text-xs bg-[#2C2C2C] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black transition-colors">
                <PlusCircle size={14}/> إضافة حساب جديد
              </button>
            </div>
            {Array.isArray(value) && value.map((link: any, idx: number) => (
              <div key={idx} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3 items-center">
                <button type="button" onClick={() => {
                  const newLinks = value.filter((_, i) => i !== idx);
                  handleContentChange(lang, 'social_links', newLinks);
                }} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"><X size={16} /></button>
                
                <select value={link.platform} onChange={(e) => {
                  const newLinks = [...value];
                  newLinks[idx].platform = e.target.value;
                  handleContentChange(lang, 'social_links', newLinks);
                }} className="p-3 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] font-bold w-full sm:w-1/3 text-gray-700">
                  <option value="instagram">Instagram</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="facebook">Facebook</option>
                  <option value="youtube">YouTube</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="link">رابط آخر</option>
                </select>
                
                <input type="url" placeholder="الرابط (https://...)" value={link.url} onChange={(e) => {
                  const newLinks = [...value];
                  newLinks[idx].url = e.target.value;
                  handleContentChange(lang, 'social_links', newLinks);
                }} className="flex-1 w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059]" dir="ltr" />
              </div>
            ))}
          </div>
        );
      }
      
      if (key === 'items') {
        const isFaq = editData.id === 'faq';
        return (
          <div key={key} className="col-span-1 md:col-span-2 space-y-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <label className="text-sm font-bold text-[#C5A059]">{isFaq ? 'قائمة الأسئلة والأجوبة' : 'قائمة التقييمات وآراء العملاء'}</label>
              <button type="button" onClick={() => {
                const newItem = isFaq ? { q: '', a: '' } : { name: '', text: '', rating: 5 };
                handleContentChange(lang, 'items', [...value, newItem]);
              }} className="text-xs bg-[#2C2C2C] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black transition-colors"><PlusCircle size={14}/> إضافة جديد</button>
            </div>
            {Array.isArray(value) && value.map((item: any, idx: number) => (
              <div key={idx} className="relative p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 pt-8">
                <button type="button" onClick={() => { const newItems = value.filter((_, i) => i !== idx); handleContentChange(lang, 'items', newItems); }} className="absolute top-2 left-2 text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"><X size={16} /></button>
                {isFaq ? (
                  <>
                    <input type="text" placeholder="السؤال..." value={item.q} onChange={(e) => { const newItems = [...value]; newItems[idx].q = e.target.value; handleContentChange(lang, 'items', newItems); }} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] font-bold" dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                    <textarea placeholder="الجواب..." value={item.a} onChange={(e) => { const newItems = [...value]; newItems[idx].a = e.target.value; handleContentChange(lang, 'items', newItems); }} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] text-sm" rows={2} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input type="text" placeholder="اسم العميل" value={item.name} onChange={(e) => { const newItems = [...value]; newItems[idx].name = e.target.value; handleContentChange(lang, 'items', newItems); }} className="flex-1 p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] font-bold" dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                      <input type="number" min="1" max="5" value={item.rating} onChange={(e) => { const newItems = [...value]; newItems[idx].rating = Number(e.target.value); handleContentChange(lang, 'items', newItems); }} className="w-24 p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] text-center" dir="ltr" />
                    </div>
                    <textarea placeholder="نص التقييم..." value={item.text} onChange={(e) => { const newItems = [...value]; newItems[idx].text = e.target.value; handleContentChange(lang, 'items', newItems); }} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] text-sm" rows={2} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
                  </>
                )}
              </div>
            ))}
          </div>
        );
      }
      if (key === 'map_url' || key === 'hours') {
        return (
          <div key={key} className="col-span-1 md:col-span-2 space-y-2">
            <label className="block text-sm font-bold capitalize text-[#C5A059]">{key === 'map_url' ? 'رابط تضمين خريطة جوجل (src)' : 'ساعات العمل'}</label>
            <textarea rows={3} value={value} onChange={(e) => handleContentChange(lang, key, e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" dir={key === 'map_url' ? 'ltr' : (lang === 'ar' ? 'rtl' : 'ltr')} />
          </div>
        );
      }
      if (key === 'html') return (<div key={key} className="col-span-1 md:col-span-2 space-y-2"><label className="block text-sm font-bold text-[#C5A059] flex items-center gap-2"><Code size={18}/> HTML ({lang.toUpperCase()})</label><textarea rows={12} dir="ltr" value={value} onChange={(e) => handleContentChange(lang, key, e.target.value)} className="w-full p-4 border rounded-xl bg-gray-900 text-green-400 font-mono text-sm outline-none focus:ring-2 ring-[#C5A059]" /></div>);
      if (key.includes('image') || key.includes('video')) return (<div key={key} className="col-span-1 md:col-span-2 space-y-2"><label className="block text-sm font-bold capitalize flex items-center gap-2"><ImageIcon size={18}/> {key.replace('_', ' ')} URL</label><div className="flex gap-3"><input type="url" dir="ltr" value={value} onChange={(e) => handleContentChange(lang, key, e.target.value)} className="flex-1 p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" />{key.includes('image') && value && <img src={value} alt="preview" className="w-12 h-12 rounded-lg object-cover border" />}</div></div>);
      return (<div key={key} className="col-span-1 space-y-2"><label className="block text-sm font-bold capitalize">{key.replace('_', ' ')}</label><input type="text" value={value} onChange={(e) => handleContentChange(lang, key, e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" dir={lang === 'ar' ? 'rtl' : 'ltr'} /></div>);
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div><h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">{t.title}</h2><p className="text-gray-500">{t.desc}</p></div>
      
      {isLoading ? ( <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div> ) : (
        <>
          {/* 🌟 لوحة تحكم الخلفية العامة والاستوديو (Theme Studio) */}
          {globalTheme && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 mb-8 relative z-10 border-b border-gray-100 pb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#2C2C2C] to-[#C5A059] rounded-2xl flex items-center justify-center text-white shadow-lg"><Wand2 size={28} /></div>
                <div>
                  <h3 className="font-bold text-[#2C2C2C] text-2xl">استوديو الألوان والخلفية (Theme Studio)</h3>
                  <p className="text-gray-500 text-sm mt-1">اصنع باليتاتك الخاصة، تحكم في حركة الألوان، وخصص هوية متجرك.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* العمود الجانبي للخيارات الأساسية */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-[#2C2C2C] mb-3">نوع الخلفية:</label>
                    <div className="flex gap-2">
                      <button onClick={() => setGlobalTheme({...globalTheme, type: 'animated'})} className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${globalTheme.type === 'animated' ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>متحركة</button>
                      <button onClick={() => setGlobalTheme({...globalTheme, type: 'solid'})} className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${globalTheme.type === 'solid' ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#C5A059]' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>لون صلب</button>
                    </div>
                  </div>

                  {globalTheme.type === 'animated' && (
                    <div className="animate-in fade-in">
                      <label className="block text-sm font-bold text-[#2C2C2C] mb-3">طبيعة الحركة (Animation Style):</label>
                      <select value={globalTheme.animationType} onChange={(e) => setGlobalTheme({...globalTheme, animationType: e.target.value})} className="w-full p-3 rounded-xl border-2 border-gray-100 outline-none focus:border-[#C5A059] font-bold text-gray-700">
                        <option value="fade">تلاشي ناعم وانسيابي (Fade)</option>
                        <option value="wave">أمواج عرضية متداخلة (Waves)</option>
                        <option value="cascade">تساقط طولي متتالي (Cascade)</option>
                        <option value="aurora">شفق قطبي سحري (Aurora)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-[#2C2C2C] mb-3">شفافية الخلفية (Opacity: {globalTheme.opacity}%)</label>
                    <input type="range" min="0" max="100" value={globalTheme.opacity} onChange={(e) => setGlobalTheme({...globalTheme, opacity: Number(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C5A059]" />
                  </div>
                </div>

                {/* عمود الألوان والباليتات */}
                <div className="lg:col-span-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                  {globalTheme.type === 'animated' ? (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-[#2C2C2C]">مجموعات الألوان (انقر للتفعيل/الإلغاء):</label>
                        <button onClick={addPalette} className="text-xs bg-[#C5A059] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#b08d4b] transition-all font-bold shadow-md"><PlusCircle size={14}/> إضافة باليتة جديدة</button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {globalTheme.savedPalettes.map((pal: any) => {
                          const isActive = globalTheme.activePaletteIds.includes(pal.id);
                          return (
                            <div key={pal.id} className={`relative p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-[#C5A059] bg-white shadow-md' : 'border-gray-200 bg-white opacity-70 hover:opacity-100'}`}>
                              
                              <div className="flex justify-between items-center mb-3">
                                {/* Checkbox التفعيل */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={isActive} onChange={() => togglePaletteActive(pal.id)} className="w-5 h-5 rounded text-[#C5A059] focus:ring-[#C5A059] border-gray-300" />
                                  <span className={`text-sm font-bold ${isActive ? 'text-[#C5A059]' : 'text-gray-500'}`}>{isActive ? 'نشط' : 'تفعيل'}</span>
                                </label>
                                {/* زر الحذف */}
                                <button onClick={() => deletePalette(pal.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                              </div>

                              {/* اسم الباليتة */}
                              <input type="text" value={pal.name} onChange={(e) => updatePalette(pal.id, 'name', e.target.value)} placeholder="اسم الباليتة..." className="w-full p-2 mb-3 border-b border-dashed border-gray-300 outline-none focus:border-[#C5A059] bg-transparent font-bold text-gray-700 text-sm" />

                              {/* مربعات الألوان الأربعة */}
                              <div className="flex gap-2 h-10">
                                {[0, 1, 2, 3].map((colorIndex) => (
                                  <div key={colorIndex} className="relative flex-1 group h-full rounded-lg overflow-hidden shadow-inner border border-black/10">
                                    <input type="color" value={pal.colors[colorIndex]} onChange={(e) => updatePalette(pal.id, 'colors', e.target.value, colorIndex)} className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10" />
                                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: pal.colors[colorIndex] }}></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in slide-in-from-right-4 flex flex-col items-center justify-center h-full min-h-[200px]">
                      <label className="block text-lg font-bold text-[#2C2C2C] mb-2">اختر اللون الصلب للمتجر:</label>
                      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-200">
                          <input type="color" value={globalTheme.solidColor} onChange={(e) => setGlobalTheme({...globalTheme, solidColor: e.target.value})} className="absolute inset-0 w-[200%] h-[200%] -top-4 -left-4 cursor-pointer" />
                        </div>
                        <input type="text" value={globalTheme.solidColor} onChange={(e) => setGlobalTheme({...globalTheme, solidColor: e.target.value})} className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] font-mono text-center text-lg uppercase font-bold text-gray-700" dir="ltr" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
                <button onClick={handleSaveGlobalTheme} disabled={isSavingTheme} className="px-10 py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-black flex items-center gap-3 shadow-xl transition-all transform hover:-translate-y-1">
                  {isSavingTheme ? <Loader2 className="animate-spin" size={24}/> : <><Wand2 size={20}/> تطبيق ونشر الألوان</>}
                </button>
              </div>
            </div>
          )}

          {/* قائمة الأقسام (بقية الأكواد لم تتغير) */}
          <div className="space-y-3">
            {sections.map((section, index) => (
              <div key={section.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex sm:flex-col gap-1"><button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/10 rounded disabled:opacity-30"><ArrowUp size={18}/></button><button onClick={() => handleMove(index, 'down')} disabled={index === sections.length - 1} className="p-1.5 text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/10 rounded disabled:opacity-30"><ArrowDown size={18}/></button></div>
                <div className="flex-1 text-center sm:text-start"><h3 className="font-bold text-lg text-[#2C2C2C]">{sectionNames[section.id] ? (isRTL ? sectionNames[section.id].ar : sectionNames[section.id].en) : section.id}</h3><p className="text-xs text-gray-400 uppercase tracking-widest mt-1 hidden sm:block">ID: {section.id}</p></div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-center"><span className={`text-xs font-bold px-3 py-1 rounded-full ${section.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{section.is_active ? t.active : t.inactive}</span><button onClick={() => toggleVisibility(section.id, section.is_active)} className={`p-2 rounded-xl transition-colors ${section.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}><Eye size={20}/></button><div className="w-px h-6 bg-gray-200"></div><button onClick={() => openEditModal(section)} className="flex items-center gap-2 px-4 py-2 bg-[#2C2C2C] text-white text-sm font-bold rounded-xl hover:bg-black transition-colors"><Edit2 size={16}/> {t.edit}</button></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* مودال التعديل للأقسام */}
      {isModalOpen && editData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-xl text-[#2C2C2C] flex items-center gap-2"><LayoutTemplate className="text-[#C5A059]"/> {t.modalTitle} {sectionNames[editData.id] ? (isRTL ? sectionNames[editData.id].ar : sectionNames[editData.id].en) : editData.id}</h3><button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button></div>
            <div className="flex border-b border-gray-200 bg-gray-50/50 px-6 pt-2 gap-4"><button onClick={() => setFormTab('settings')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'settings' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.tabSettings}</button><button onClick={() => setFormTab('ar')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'ar' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.tabAr}</button><button onClick={() => setFormTab('en')} className={`pb-3 font-bold border-b-2 transition-colors ${formTab === 'en' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500'}`}>{t.tabEn}</button></div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {formTab === 'settings' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <h4 className="flex items-center gap-2 font-bold text-[#2C2C2C] mb-6"><Palette size={20} className="text-[#C5A059]"/> ألوان وخلفية القسم الداخلي</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-bold mb-2">لون الخلفية (Color)</label><div className="flex items-center gap-3"><input type="color" value={editData.content_ar?.bg_color || '#ffffff'} onChange={(e) => handleStyleChange('bg_color', e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0" /><input type="text" value={editData.content_ar?.bg_color || '#ffffff'} onChange={(e) => handleStyleChange('bg_color', e.target.value)} className="flex-1 p-2 border rounded-lg font-mono text-sm uppercase" dir="ltr" /></div></div>
                      <div><label className="block text-sm font-bold mb-2">شفافية الخلفية (Opacity: {editData.content_ar?.bg_opacity ?? 100}%)</label><input type="range" min="0" max="100" value={editData.content_ar?.bg_opacity ?? 100} onChange={(e) => handleStyleChange('bg_opacity', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C5A059]" /><div className="flex justify-between text-xs text-gray-400 mt-2"><span>شفاف تماماً (0%)</span><span>لون صلب (100%)</span></div></div>
                    </div>
                  </div>
                  <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <h4 className="flex items-center gap-2 font-bold text-[#2C2C2C] mb-6"><Type size={20} className="text-[#C5A059]"/> تنسيق الخطوط</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-bold mb-2">نوع الخط (Font Family)</label><select value={editData.content_ar?.font_family || 'sans'} onChange={(e) => handleStyleChange('font_family', e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]"><option value="sans">خط نسيج الأساسي (Sans-serif)</option><option value="serif">خط فاخر وكلاسيكي (Serif)</option><option value="mono">خط برمجي/عصري (Monospace)</option></select></div>
                      <div><label className="block text-sm font-bold mb-2">حجم النصوص (Scale)</label><select value={editData.content_ar?.font_scale || 'normal'} onChange={(e) => handleStyleChange('font_scale', e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:border-[#C5A059]"><option value="small">صغير وأنيق</option><option value="normal">طبيعي (افتراضي)</option><option value="large">كبير وبارز</option></select></div>
                    </div>
                  </div>
                </div>
              )}
              {formTab === 'ar' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in" dir="rtl">{renderDynamicFields('ar')}</div>}
              {formTab === 'en' && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in" dir="ltr">{renderDynamicFields('en')}</div>}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100">إلغاء</button><button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> حفظ الإعدادات</>}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};