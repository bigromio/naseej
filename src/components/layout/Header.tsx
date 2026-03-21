import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import logoImg from '@/assets/logo.png'; // استدعاء صورة الشعار الجديد

// مكون اللوجو الديناميكي المتساقط (النص فقط)
const DynamicLogoText = () => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (phase === 0) timeout = setTimeout(() => setPhase(1), 2500); // بقاء العربي
    else if (phase === 1) timeout = setTimeout(() => setPhase(2), 1200); // سقوط وتغيير
    else if (phase === 2) timeout = setTimeout(() => setPhase(3), 2500); // بقاء الإنجليزي
    else if (phase === 3) timeout = setTimeout(() => setPhase(0), 1200); // ارتفاع وعودة
    return () => clearTimeout(timeout);
  }, [phase]);

  const wordEn = "NASEEJ".split('');

  return (
    <div className="logo-container">
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
  const { language, setLanguage } = useStore();

  const navText = {
    ar: { collections: 'المجموعات', philosophy: 'الفلسفة', contact: 'تواصل معنا' },
    en: { collections: 'Collections', philosophy: 'Philosophy', contact: 'Contact Us' }
  };
  const t = navText[language as keyof typeof navText];

  return (
    <div className="sticky top-6 z-50 w-full px-4 sm:px-6 lg:px-8 pointer-events-none">
      <header className="pointer-events-auto mx-auto max-w-7xl bg-white/75 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center transition-all duration-300">
        
        {/* النصف الأيمن: صورة الشعار + الاسم المتحرك */}
        <Link to="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-105">
          {/* صورة الشعار */}
          <img 
            src={logoImg} 
            alt="Naseej Symbol" 
            className="h-10 w-auto object-contain rounded-full drop-shadow-sm flex-shrink-0" 
          />
          {/* الاسم المتحرك */}
          <DynamicLogoText />
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-bold text-gray-600">
          <Link to="/shop" className="hover:text-[#C5A059] transition-colors">{t.collections}</Link>
          <Link to="#" className="hover:text-[#C5A059] transition-colors">{t.philosophy}</Link>
          <Link to="#" className="hover:text-[#C5A059] transition-colors">{t.contact}</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all"
          >
            <Globe size={20} />
          </button>
          
          <Link to="/auth" className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all">
            <User size={20} />
          </Link>
          
          <Link to="/checkout" className="p-2 text-gray-600 hover:text-black hover:bg-black/5 rounded-full transition-all relative">
            <ShoppingBag size={20} />
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#C5A059] text-white text-[10px] flex items-center justify-center rounded-full">0</span>
          </Link>
        </div>
      </header>
    </div>
  );
};