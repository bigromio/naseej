import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { useStore } from '@/store/useStore';

export const MainLayout = () => {
  const location = useLocation();
  const { language } = useStore();
  
  // التحقق هل نحن في الصفحة الرئيسية؟
  const isHome = location.pathname === '/';

  return (
    // التحكم الآلي في اتجاه الصفحة بناءً على اللغة
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`min-h-screen flex flex-col font-sans ${isHome ? '' : 'bg-[#F8F8F8]'}`}>
      <Header />
      
      {/* محتوى الصفحة المتغير */}
      <main className="flex-grow relative z-10 w-full">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};