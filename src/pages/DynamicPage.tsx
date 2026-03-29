import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

export const DynamicPage = () => {
  // نستخرج الرابط (Slug) من شريط المتصفح
  const { slug } = useParams<{ slug: string }>();
  const { pages, fetchPages, language } = useStore();
  const isRTL = language === 'ar';

  // جلب الصفحات إذا لم تكن موجودة في المتجر
  useEffect(() => {
    if (pages.length === 0) fetchPages();
    // جعل الصفحة تبدأ من الأعلى عند الدخول إليها
    window.scrollTo(0, 0);
  }, [pages.length, fetchPages, slug]);

  // البحث عن الصفحة المطلوبة والتي حالتها "نشطة"
  const page = pages.find((p) => p.slug === slug && p.is_active);

  // حالة التحميل
  if (pages.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      </div>
    );
  }

  // إذا كانت الصفحة غير موجودة أو مخفية
  if (!page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-gray-50/50">
        <h2 className="text-6xl font-bold text-[#2C2C2C] mb-4">404</h2>
        <p className="text-xl text-gray-500 mb-8">{isRTL ? 'عذراً، هذه الصفحة غير موجودة أو تم حذفها.' : 'Sorry, this page is not found or has been deleted.'}</p>
        <Link to="/" className="bg-[#C5A059] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08d4b] transition-colors flex items-center gap-2">
          {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
          {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 flex flex-col">
      {/* ترويسة الصفحة (Banner) */}
      <div className="bg-[#2C2C2C] py-16 text-center border-b-4 border-[#C5A059]">
        <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
          {isRTL ? page.title_ar : page.title_en}
        </h1>
      </div>
      
      {/* محتوى الصفحة الذي كتبته في لوحة التحكم (يُحقن كـ HTML) */}
      <div 
        className="w-full flex-grow pb-20 custom-html-section"
        dir={isRTL ? 'rtl' : 'ltr'}
        dangerouslySetInnerHTML={{ __html: isRTL ? page.content_ar : page.content_en }}
      />
    </div>
  );
};