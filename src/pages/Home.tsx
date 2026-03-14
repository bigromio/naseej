import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';

// بيانات وهمية مؤقتة للمنتجات المعروضة في الرئيسية
const FEATURED_PRODUCTS = [
  { id: '1', name: 'طاولة طعام نسيج', desc: 'مزيج من الرخام والخشب الطبيعي', img: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=600' },
  { id: '2', name: 'كرسي استرخاء', desc: 'تصميم مريح بانحناءات عصرية', img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=600' },
  { id: '3', name: 'إضاءة معلقة', desc: 'تفاصيل معدنية بلمسة حداثة', img: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600' }
];

export const Home = () => {
  const { language } = useStore();
  const t = translations[language];

  return (
    <>
      {/* 1. الخلفية الديناميكية (الاستريبات الأربعة) */}
      <div className="dynamic-background">
        <div className="stripe stripe-1"></div>
        <div className="stripe stripe-2"></div>
        <div className="stripe stripe-3"></div>
        <div className="stripe stripe-4"></div>
      </div>

      {/* 2. محتوى الصفحة الرئيسية (البطاقات الزجاجية) */}
      <div className="relative z-10 min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
        
        {/* عنوان ترحيبي */}
        <div className="text-center mb-16 glass-card !p-8 !bg-white/70 max-w-2xl">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-charcoal mb-4">
            {t.heroTitle}
          </h1>
          <p className="text-lg text-gray-700">
            {t.heroSubtitle}
          </p>
        </div>

        {/* شبكة المنتجات (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {FEATURED_PRODUCTS.map((product) => (
            <div key={product.id} className="glass-card flex flex-col">
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-gray-100">
                <img 
                  src={product.img} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-xl font-bold text-charcoal mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-6 flex-grow">{product.desc}</p>
              <Link 
                to={`/product/${product.id}`} 
                className="inline-block w-full py-3 bg-charcoal text-white rounded-full font-bold hover:bg-black transition-colors"
              >
                {t.shopNow}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};