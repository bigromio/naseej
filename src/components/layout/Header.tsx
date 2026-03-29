import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Globe, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import logoImg from '@/assets/logo.png';

const DynamicLogoText = () => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (phase === 0) timeout = setTimeout(() => setPhase(1), 2500); 
    else if (phase === 1) timeout = setTimeout(() => setPhase(2), 1200); 
    else if (phase === 2) timeout = setTimeout(() => setPhase(3), 2500); 
    else if (phase === 3) timeout = setTimeout(() => setPhase(0), 1200); 
    return () => clearTimeout(timeout);
  }, [phase]);

  const wordEn = "NASEEJ".split('');

  return (
    <div className="logo-container relative w-24 h-8">
      {(phase === 0 || phase === 1 || phase === 3) && (
        <span className={`logo-ar absolute text-2xl tracking-wide font-bold text-[#2C2C2C] ${phase === 0 ? 'stay-visible' : phase === 1 ? 'drop-out' : 'rise-in'}`}>
          نسيج
        </span>
      )}
      {(phase === 1 || phase === 2 || phase === 3) && (
        <div dir="ltr" className="absolute flex">
          {wordEn.map((char, i) => {
            const animClass = phase === 1 ? 'drop-in' : phase === 2 ? 'stay-visible' : 'rise-out';
            return (
              <span key={i} className={`letter text-2xl tracking-widest font-bold text-[#2C2C2C] ${animClass}`} style={{ animationDelay: `${i * 0.08}s` }}>
                {char}
              </span>
            )
          })}
        </div>
      )}
    </div>
  );
};

export const Header = () => {
  const { language, setLanguage, pages, fetchPages, user } = useStore();
  const isRTL = language === 'ar';
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navText = {
    ar: { collections: 'المتجر' },
    en: { collections: 'Shop' }
  };
  const t = navText[language as keyof typeof navText];

  useEffect(() => {
    if (pages.length === 0) fetchPages();
  }, [pages.length, fetchPages]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // تصفية الصفحات للنافبار فقط
  const navbarPages = pages
    .filter(page => page.is_active && page.show_in_navbar)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="sticky top-6 z-50 w-full px-4 sm:px-6 lg:px-8 pointer-events-none">
      <header className="pointer-events-auto mx-auto max-w-7xl bg-white/75 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center transition-all duration-300">
        
        <Link to="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-105">
          <img src={logoImg} alt="Naseej Symbol" className="h-10 w-auto object-contain rounded-full drop-shadow-sm flex-shrink-0" />
          <DynamicLogoText />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-bold text-gray-600">
          <Link to="/shop" className={`hover:text-[#C5A059] transition-colors ${location.pathname === '/shop' ? 'text-[#C5A059]' : ''}`}>{t.collections}</Link>
          <Link to="/contact" className={`hover:text-[#C5A059] transition-colors ${location.pathname === '/contact' ? 'text-[#C5A059]' : ''}`}>{isRTL ? 'تواصل معنا' : 'Contact Us'}</Link>
          {/* الروابط الديناميكية (مثل: الفلسفة، تواصل معنا) */}
          {navbarPages.map(page => (
            <Link key={page.id} to={`/page/${page.slug}`} className={`hover:text-[#C5A059] transition-colors ${location.pathname === `/page/${page.slug}` ? 'text-[#C5A059]' : ''}`}>
              {isRTL ? page.title_ar : page.title_en}
            </Link>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-4">
          <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all">
            <Globe size={20} />
          </button>
          
          <Link to={user ? (['owner', 'manager', 'employee'].includes(user.role) ? '/admin' : '/dashboard') : '/auth'} className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all hidden sm:flex">
            <User size={20} />
          </Link>
          
          <Link to="/checkout" className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all relative">
            <ShoppingBag size={20} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#C5A059] text-white text-[10px] flex items-center justify-center rounded-full">0</span>
          </Link>

          <button className="md:hidden p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl transition-all duration-300 pointer-events-auto ${isMobileMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible'}`}>
        <nav className="flex flex-col p-4 gap-4">
          <Link to="/shop" className="font-bold text-gray-700 hover:text-[#C5A059] p-2 border-b border-gray-100">{t.collections}</Link>
          {navbarPages.map(page => (
            <Link key={page.id} to={`/page/${page.slug}`} className="font-bold text-gray-700 hover:text-[#C5A059] p-2 border-b border-gray-100">
              {isRTL ? page.title_ar : page.title_en}
            </Link>
          ))}
          {!user && <Link to="/auth" className="font-bold text-gray-700 hover:text-[#C5A059] p-2">{isRTL ? 'تسجيل الدخول' : 'Login'}</Link>}
        </nav>
      </div>
    </div>
  );
};