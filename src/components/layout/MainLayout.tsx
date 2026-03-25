import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useStore } from '@/store/useStore';
import { X } from 'lucide-react'; // أيقونة الإغلاق للنافذة المنبثقة

export const MainLayout = () => {
  const location = useLocation();
  // سحبنا إعدادات الموقع من المتجر
  const { language, siteSettings, fetchSiteSettings } = useStore();
  
  // حالة ظهور النافذة المنبثقة
  const [showPopup, setShowPopup] = useState(false);

  const isHome = location.pathname === '/';
  const isRTL = language === 'ar';

  // 1. جلب إعدادات الإعلانات من قاعدة البيانات عند تحميل الموقع
  useEffect(() => {
    fetchSiteSettings();
  }, [fetchSiteSettings]);

  // 2. منطق النافذة المنبثقة: تظهر في الرئيسية فقط بعد ثانيتين
  useEffect(() => {
    const popupSetting = siteSettings?.['home_popup'];
    if (isHome && popupSetting?.is_active && !sessionStorage.getItem('naseej_popup_seen')) {
      const timer = setTimeout(() => setShowPopup(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [siteSettings, isHome]);

  // دالة إغلاق النافذة المنبثقة وعدم إظهارها مجدداً في نفس الجلسة
  const closePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('naseej_popup_seen', 'true');
  };

  const topBanner = siteSettings?.['top_banner'];

  return (
    // التحكم الآلي في اتجاه الصفحة بناءً على اللغة
    <div dir={isRTL ? 'rtl' : 'ltr'} className={`min-h-screen flex flex-col font-sans ${isHome ? '' : 'bg-[#F8F8F8]'}`}>
      
      {/* 1. الشريط الإعلاني العلوي (Top Banner) - تمت إضافته فوق الهيدر */}
      {topBanner?.is_active && (
        <div className="bg-[#2C2C2C] text-[#C5A059] text-center py-2.5 px-4 text-sm md:text-base font-bold z-50 w-full relative animate-in slide-in-from-top-2">
           <div 
             className="max-w-7xl mx-auto flex justify-center items-center gap-2"
             dangerouslySetInnerHTML={{ __html: isRTL ? topBanner.content_ar : topBanner.content_en }} 
           />
        </div>
      )}

      {/* الهيدر الأصلي الخاص بك */}
      <Header />
      
      {/* محتوى الصفحة المتغير */}
      <main className="flex-grow relative z-10 w-full">
        <Outlet />
      </main>

      {/* الفوتر الأصلي الخاص بك */}
      <Footer />

      {/* 2. النافذة المنبثقة (Home Popup) */}
      {showPopup && siteSettings?.['home_popup'] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
            
            {/* زر الإغلاق */}
            <button 
              onClick={closePopup}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-10 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 hover:text-red-500 rounded-full transition-colors`}
            >
              <X size={20} />
            </button>
            
            {/* محتوى النافذة المنبثقة المأخوذ من لوحة الإدارة */}
            <div 
              className="p-10" 
              dangerouslySetInnerHTML={{ __html: isRTL ? siteSettings['home_popup'].content_ar : siteSettings['home_popup'].content_en }} 
            />
            
          </div>
        </div>
      )}

    </div>
  );
};