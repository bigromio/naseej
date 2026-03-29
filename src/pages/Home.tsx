import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, HomeSection } from '@/store/useStore';
import { ArrowRight, ArrowLeft, ShieldCheck, Truck, Clock, Play, Star, Mail, ChevronDown } from 'lucide-react';

export const Home = () => {
  const { language, homeSections, fetchHomeSections, products, fetchProducts } = useStore();
  const isRTL = language === 'ar';
  
  // حالة التحكم في الباليتة المعروضة حالياً
  const [currentPaletteIndex, setCurrentPaletteIndex] = useState(0);

  useEffect(() => {
    fetchHomeSections();
    if (products.length === 0) fetchProducts();
  }, [fetchHomeSections, products.length, fetchProducts]);

  // --- 1. استخراج إعدادات الخلفية العامة (Global Theme) بذكاء ---
  const themeSection = homeSections.find((s) => s.id === 'global_theme');
  const globalTheme = themeSection?.content_ar || { 
    type: 'animated', 
    animationType: 'fade',
    activePaletteIds: ['1'],
    savedPalettes: [{ id: '1', colors: ['#C5A059', '#F5DEB3', '#FFF8DC', '#D4AF37'] }],
    solidColor: '#F8F8F8', 
    opacity: 80 
  };

  // استخراج مصفوفات الألوان للباليتات المفعلة فقط
  const activePalettes = (globalTheme.activePaletteIds || []).map((id: string) => {
    const pal = globalTheme.savedPalettes?.find((p: any) => p.id === id);
    return pal ? pal.colors : null;
  }).filter(Boolean);

  // مصفوفة احتياطية في حال عدم وجود أي لون
  const safePalettes = activePalettes.length > 0 ? activePalettes : [['#C5A059', '#F5DEB3', '#FFF8DC', '#D4AF37']];

  // --- 2. محرك التبديل الآلي للألوان (Color Cycler) ---
  useEffect(() => {
    if (globalTheme.type !== 'animated' || safePalettes.length <= 1) return;
    
    // تغيير الألوان كل 6 ثوانٍ
    const interval = setInterval(() => {
      setCurrentPaletteIndex((prev) => (prev + 1) % safePalettes.length);
    }, 6000); 
    
    return () => clearInterval(interval);
  }, [globalTheme.type, safePalettes.length]);

  const currentColors = safePalettes[currentPaletteIndex] || safePalettes[0];

  // --- 3. محرك رسم الخلفية السينمائية (Animation Engine) ---
  const renderDynamicBackground = () => {
    if (globalTheme.type === 'solid') {
      return <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: globalTheme.solidColor || '#f8f8f8' }}></div>;
    }

    switch(globalTheme.animationType) {
      // حركة الشفق القطبي الساحرة (Aurora/Blobs)
      case 'aurora':
        return (
          <div className="absolute inset-0 overflow-hidden bg-gray-50/20">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob" style={{ backgroundColor: currentColors[0], transition: 'background-color 4s ease-in-out' }}></div>
            <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: currentColors[1], transition: 'background-color 4s ease-in-out' }}></div>
            <div className="absolute -bottom-[20%] left-[10%] w-[60%] h-[60%] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-4000" style={{ backgroundColor: currentColors[2], transition: 'background-color 4s ease-in-out' }}></div>
            <div className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full mix-blend-multiply filter blur-[120px] opacity-70 animate-blob animation-delay-6000" style={{ backgroundColor: currentColors[3], transition: 'background-color 4s ease-in-out' }}></div>
          </div>
        );
      
      // حركة الأمواج (Waves)
      case 'wave':
        return (
          <div className="absolute inset-0 overflow-hidden bg-gray-50/50">
            <div className="absolute bottom-0 left-0 w-[200%] h-[60%] opacity-50 animate-wave" style={{ background: `linear-gradient(to top, ${currentColors[0]}, transparent)`, borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transition: 'background 4s ease-in-out' }}></div>
            <div className="absolute bottom-0 left-[-50%] w-[200%] h-[40%] opacity-50 animate-wave animation-delay-2000" style={{ background: `linear-gradient(to top, ${currentColors[1]}, transparent)`, borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transition: 'background 4s ease-in-out' }}></div>
            <div className="absolute top-0 right-0 w-[150%] h-[50%] opacity-30 animate-wave animation-delay-4000" style={{ background: `linear-gradient(to bottom, ${currentColors[2]}, transparent)`, borderRadius: '0 0 50% 50% / 0 0 100% 100%', transition: 'background 4s ease-in-out' }}></div>
          </div>
        );

      // حركة التساقط المتتالي (Cascade)
      case 'cascade':
        return (
          <div className="absolute inset-0 overflow-hidden bg-gray-50/30 flex gap-4 rotate-[15deg] scale-150 -translate-y-20">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex-1 opacity-60" style={{ 
                background: `linear-gradient(to bottom, transparent, ${currentColors[i]}, transparent)`, 
                animation: `cascade-fall ${8 + i * 2}s linear infinite`, 
                animationDelay: `${i * 1.5}s`, 
                transition: 'background 4s ease-in-out' 
              }}></div>
            ))}
          </div>
        );

      // التلاشي الناعم الكلاسيكي (Fade)
      case 'fade':
      default:
        return (
          <div className="absolute inset-0 flex w-full h-full">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-full opacity-80" style={{ backgroundColor: currentColors[i], transition: 'background-color 4s ease-in-out' }}></div>
            ))}
          </div>
        );
    }
  };

  // --- 4. معالجة وتصفية الأقسام العادية ---
  const activeSectionsFiltered = homeSections
    .filter((section) => section.is_active && section.id !== 'global_theme')
    .sort((a, b) => a.sort_order - b.sort_order);

  const renderSection = (section: HomeSection) => {
    const content = isRTL ? section.content_ar : section.content_en;
    const style = section.style_type; 

    // تحويل اللون لـ rgba مع دعم الشفافية
    const hexToRgba = (hex: string, opacity: number) => {
      if (!hex) return 'transparent';
      const cleanHex = hex.replace('#', '');
      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);
      return `rgba(${isNaN(r) ? 255 : r}, ${isNaN(g) ? 255 : g}, ${isNaN(b) ? 255 : b}, ${opacity / 100})`;
    };

    const customStyle: React.CSSProperties = {
      backgroundColor: content.bg_color ? hexToRgba(content.bg_color, content.bg_opacity ?? 100) : 'transparent',
      fontFamily: content.font_family === 'serif' ? 'Georgia, serif' : content.font_family === 'mono' ? 'monospace' : 'inherit',
      fontSize: content.font_scale === 'small' ? '0.9em' : content.font_scale === 'large' ? '1.1em' : '1em',
    };

    switch (section.id) {
      case 'hero':
        if (style === 'style2') {
          return (
            <section className="relative w-full h-[70vh] flex items-center overflow-hidden z-10" style={customStyle}>
              <div className="absolute inset-0 w-full h-full lg:w-1/2 lg:relative"><img src={content.bg_image} alt="Hero" className="w-full h-full object-cover" /></div>
              <div className="relative z-10 lg:w-1/2 px-8 lg:px-20 py-12 bg-white/20 backdrop-blur-md flex flex-col justify-center h-full border-l border-white/30 shadow-2xl">
                <h1 className="text-5xl lg:text-7xl font-bold text-[#2C2C2C] mb-6 leading-tight drop-shadow-sm">{content.title}</h1>
                <p className="text-xl text-gray-800 mb-8 max-w-lg font-medium">{content.subtitle}</p>
                <Link to="/shop" className="w-fit bg-[#2C2C2C] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-black transition-all flex items-center gap-3 shadow-xl">
                  {content.btn_text} {isRTL ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>}
                </Link>
              </div>
            </section>
          );
        }
        return (
          <section className="relative w-full h-[85vh] flex items-center justify-center text-center z-10" style={customStyle}>
            <div className="absolute inset-0 bg-black/30 z-10"></div>
            <img src={content.bg_image} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
            <div className="relative z-20 px-4 max-w-4xl mx-auto flex flex-col items-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">{content.title}</h1>
              <p className="text-xl md:text-3xl text-white/90 mb-10 drop-shadow-lg font-medium">{content.subtitle}</p>
              <Link to="/shop" className="bg-white/90 backdrop-blur-md text-[#2C2C2C] px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all transform hover:scale-105 shadow-2xl">
                {content.btn_text}
              </Link>
            </div>
          </section>
        );

      case 'features':
        return (
          <section className="py-12 border-b border-white/20 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex items-center justify-center gap-4 p-6 bg-white/40 backdrop-blur-lg border border-white/50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"><Truck className="text-[#C5A059]" size={36}/> <span className="font-bold text-lg text-[#2C2C2C]">{content.f1}</span></div>
                <div className="flex items-center justify-center gap-4 p-6 bg-white/40 backdrop-blur-lg border border-white/50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"><ShieldCheck className="text-[#C5A059]" size={36}/> <span className="font-bold text-lg text-[#2C2C2C]">{content.f2}</span></div>
                <div className="flex items-center justify-center gap-4 p-6 bg-white/40 backdrop-blur-lg border border-white/50 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"><Clock className="text-[#C5A059]" size={36}/> <span className="font-bold text-lg text-[#2C2C2C]">{content.f3}</span></div>
              </div>
            </div>
          </section>
        );

      case 'categories':
        const cats = Array.from(new Set(products.map(p => isRTL ? p.category_ar : p.category_en).filter(Boolean))).slice(0, 4);
        return (
          <section className="py-20 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#2C2C2C] drop-shadow-sm">{content.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cats.map((cat, idx) => (
                  <Link to={`/shop?category=${cat}`} key={idx} className="group relative h-80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all block border-2 border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity group-hover:opacity-90"></div>
                    <img src={`https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600&auto=format&fit=crop&sig=${idx}`} alt="Category" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <h3 className="absolute bottom-6 left-0 right-0 text-center text-white text-2xl font-bold z-20 drop-shadow-md">{cat as string}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'trending_products':
        const trending = products.slice(0, 4); 
        return (
          <section className="py-24 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-12 border-b border-white/20 pb-4">
                <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] drop-shadow-sm">{content.title}</h2>
                <Link to="/shop" className="text-[#C5A059] font-bold hover:text-[#2C2C2C] transition-colors hidden sm:block bg-white/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/50 shadow-sm">{isRTL ? 'عرض الكل' : 'View All'}</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {trending.map(product => (
                  <Link to={`/product/${product.id}`} key={product.id} className="group bg-white/40 backdrop-blur-lg p-3 rounded-3xl shadow-xl hover:shadow-2xl transition-all border border-white/60 hover:-translate-y-2">
                    <div className="relative aspect-square bg-white/50 rounded-2xl overflow-hidden mb-4 border border-white/30">
                      {product.discount_price && <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>{isRTL ? 'عرض خاص' : 'Sale'}</div>}
                      <img src={product.image_lifestyle || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80'} alt={isRTL ? product.title_ar : product.title_en} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="px-2 pb-2">
                      <h3 className="font-bold text-lg text-[#2C2C2C] mb-1 line-clamp-1 group-hover:text-[#C5A059] transition-colors drop-shadow-sm">{isRTL ? product.title_ar : product.title_en}</h3>
                      <div className="flex items-center gap-2">
                        {product.discount_price ? (
                          <><span className="font-bold text-red-600 drop-shadow-sm">{product.discount_price} {isRTL ? 'ر.س' : 'SAR'}</span> <span className="text-sm text-gray-600 line-through">{product.base_price}</span></>
                        ) : (
                          <span className="font-bold text-[#2C2C2C] drop-shadow-sm">{product.base_price} {isRTL ? 'ر.س' : 'SAR'}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );

      case 'promotional_banner':
        return (
          <section className="py-12 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative rounded-3xl overflow-hidden h-64 md:h-96 shadow-2xl flex items-center justify-center text-center group cursor-pointer border-4 border-white/40 backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/40 z-10 transition-colors group-hover:bg-black/50"></div>
                <img src={content.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'} alt="Promo" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <h2 className="relative z-20 text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">{content.title}</h2>
              </div>
            </div>
          </section>
        );

      case 'video_showcase':
        return (
          <section className="py-24 text-center relative z-10" style={customStyle}>
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl md:text-5xl font-bold text-[#2C2C2C] mb-10 drop-shadow-sm">{content.title}</h2>
              <div className="relative rounded-3xl overflow-hidden aspect-video bg-black/10 backdrop-blur-md shadow-2xl group cursor-pointer border-2 border-white/50 p-2">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80" alt="Video Cover" className="w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-colors">
                    <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-[#2C2C2C] shadow-2xl transform transition-transform group-hover:scale-110">
                      <Play size={32} className={isRTL ? 'mr-2' : 'ml-2'} fill="currentColor" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'brand_logos':
        return (
          <section className="py-16 border-y border-white/20 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h3 className="text-[#2C2C2C] font-bold mb-8 uppercase tracking-widest drop-shadow-sm">{content.title}</h3>
              <div className="flex flex-wrap justify-center items-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-2xl font-serif font-bold text-[#2C2C2C] drop-shadow-sm">LUXURY</span>
                <span className="text-2xl font-serif font-bold text-[#2C2C2C] drop-shadow-sm">WOODWORKS</span>
                <span className="text-2xl font-serif font-bold text-[#2C2C2C] drop-shadow-sm">ELEGANCE</span>
                <span className="text-2xl font-serif font-bold text-[#2C2C2C] drop-shadow-sm">DESIGN.CO</span>
                <span className="text-2xl font-serif font-bold text-[#2C2C2C] drop-shadow-sm">PREMIUM</span>
              </div>
            </div>
          </section>
        );

      case 'faq':
        const faqItems = content.items || [];
        return (
          <section className="py-24 relative z-10" style={customStyle}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-12 text-center drop-shadow-sm">{content.title}</h2>
              <div className="space-y-4">
                {faqItems.map((item: any, idx: number) => (
                  <details key={idx} className="group bg-white/40 backdrop-blur-lg border border-white/50 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden shadow-lg hover:shadow-xl transition-all cursor-pointer">
                    <summary className="flex justify-between items-center font-bold text-lg text-[#2C2C2C]">
                      {item.q}
                      <span className="transition group-open:rotate-180 text-[#C5A059] bg-white/50 p-1 rounded-full"><ChevronDown size={24} /></span>
                    </summary>
                    <p className="text-gray-800 font-medium mt-4 leading-relaxed border-t border-white/30 pt-4">{item.a}</p>
                  </details>
                ))}
                {faqItems.length === 0 && <p className="text-center text-gray-500 font-bold">لا توجد أسئلة حالياً.</p>}
              </div>
            </div>
          </section>
        );

      case 'testimonials':
        const reviewItems = content.items || [];
        return (
          <section className="py-24 border-t border-white/20 relative z-10" style={customStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-16 drop-shadow-sm">{content.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {reviewItems.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl shadow-xl border border-white/50 relative hover:-translate-y-2 transition-transform duration-300">
                    <div className="flex justify-center text-yellow-500 drop-shadow-md mb-6">
                      {[...Array(item.rating || 5)].map((_, i) => <Star key={i} fill="currentColor" size={24}/>)}
                    </div>
                    <p className="text-gray-800 font-medium mb-6 italic text-lg leading-relaxed">"{item.text}"</p>
                    <h4 className="font-bold text-[#2C2C2C] bg-white/50 inline-block px-4 py-1 rounded-full">- {item.name}</h4>
                  </div>
                ))}
                {reviewItems.length === 0 && <p className="text-center text-gray-500 w-full col-span-3 font-bold">لا توجد تقييمات حالياً.</p>}
              </div>
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <section className="py-20 relative overflow-hidden border-t border-white/20 z-10" style={customStyle}>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10 bg-white/30 backdrop-blur-xl border border-white/40 p-12 rounded-3xl shadow-2xl">
              <Mail className="mx-auto text-[#C5A059] mb-6 drop-shadow-md" size={56} />
              <h2 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-4 drop-shadow-sm">{content.title}</h2>
              <p className="text-gray-800 font-medium text-lg mb-8">{content.subtitle}</p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input type="email" placeholder={isRTL ? 'البريد الإلكتروني...' : 'Email address...'} className="flex-1 p-4 rounded-xl outline-none text-center sm:text-start shadow-inner bg-white/80 border border-white focus:ring-2 focus:ring-[#C5A059] font-medium placeholder-gray-500" dir="ltr" />
                <button type="submit" className="bg-[#2C2C2C] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#C5A059] transition-colors shadow-xl">{isRTL ? 'اشتراك' : 'Subscribe'}</button>
              </form>
            </div>
          </section>
        );

      case 'custom_html':
        return <section className="w-full custom-html-section relative z-10" style={customStyle} dangerouslySetInnerHTML={{ __html: content.html }} />;

      default:
        return null;
    }
  };

  return (
    <div className="relative flex flex-col w-full min-h-screen overflow-hidden bg-transparent">
      
      {/* ستايلات الـ Animations مدمجة برمجياً لتنفيذ الحركات السحرية (Aurora, Waves, Cascade) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes wave-flow {
          0% { transform: translateX(0) translateZ(0) scaleY(1); }
          50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
          100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
        }
        @keyframes cascade-fall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-blob { animation: blob 15s infinite alternate; }
        .animate-wave { animation: wave-flow 18s linear infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
      `}} />

      {/* 1. الخلفية العامة الساحرة (Global Theme Layer) */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: (globalTheme.opacity ?? 80) / 100 }}>
        {renderDynamicBackground()}
      </div>

      {/* 2. المحتوى فوق الخلفية الزجاجية */}
      <div className="relative z-10 flex flex-col w-full">
        {activeSectionsFiltered.map((section) => (
          <React.Fragment key={section.id}>
            {renderSection(section)}
          </React.Fragment>
        ))}
      </div>
      
    </div>
  );
};