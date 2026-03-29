import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import logo from '@/assets/logo.png';

export const Footer = () => {
  const { language, pages } = useStore();
  const isRTL = language === 'ar';

  const text = {
    ar: {
      about: "نُعيد صياغة مفهوم الفخامة في منزلك. تصاميم عصرية، خامات استثنائية، وقطع تُروى من خلالها قصة ذوقك الرفيع.",
      linksTitle: "روابط هامة",
      contactTitle: "سياسات المتجر",
      clubTitle: "نادي نسيج",
      clubDesc: "انضم لقائمتنا البريدية للحصول على إلهام الديكور، والوصول الحصري المبكر لإصداراتنا الجديدة.",
      subscribe: "اشتراك",
      placeholder: "بريدك الإلكتروني",
      rights: "© 2026 نسيج للأثاث الفاخر. جميع الحقوق محفوظة.",
      terms: ["الشروط والأحكام", "سياسة الخصوصية"]
    },
    en: {
      about: "Redefining luxury in your home. Modern designs, exceptional materials, and pieces that tell the story of your refined taste.",
      linksTitle: "Important Links",
      contactTitle: "Store Policies",
      clubTitle: "Naseej Club",
      clubDesc: "Join our mailing list for decor inspiration and exclusive early access.",
      subscribe: "Subscribe",
      placeholder: "Email Address",
      rights: "© 2026 Naseej Luxury Furniture. All rights reserved.",
      terms: ["Terms & Conditions", "Privacy Policy"]
    }
  };

  const t = text[language as keyof typeof text];

  // تصفية الصفحات للفوتر وتقسيمها
  const footerPages = pages
    .filter(page => page.is_active && page.show_in_footer)
    .sort((a, b) => a.sort_order - b.sort_order);

  const half = Math.ceil(footerPages.length / 2);
  const importantLinks = footerPages.slice(0, half);
  const policyLinks = footerPages.slice(half);

  return (
    <footer className="footer-glass pt-16 pb-6 px-6 sm:px-10 mt-20 relative z-10 bg-white/40 backdrop-blur-lg border-t border-white/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-black/10 pb-12">
          
          {/* عن البراند */}
          <div>
            <div className="mb-6">
              <Link to="/">
                <img src={logo} alt="Naseej Logo" className="h-25 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity drop-shadow-md" />
              </Link>
            </div>
            <p className="text-gray-700 font-medium leading-relaxed text-sm">{t.about}</p>
          </div>

          {/* روابط هامة (ديناميكية) */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4 text-lg">{t.linksTitle}</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600 font-medium">
              <Link to="/shop" className="hover:text-[#C5A059] hover:-translate-y-0.5 transition-all">{isRTL ? 'المتجر' : 'Shop'}</Link>
              <li><Link to="/contact" className="hover:text-[#C5A059] hover:-translate-y-0.5 transition-all">{isRTL ? 'تواصل معنا' : 'Contact Us'}</Link></li>
              {importantLinks.map(page => (
                <Link key={page.id} to={`/page/${page.slug}`} className="hover:text-[#C5A059] hover:-translate-y-0.5 transition-all">
                  {isRTL ? page.title_ar : page.title_en}
                </Link>
              ))}
            </div>
          </div>

          {/* سياسات المتجر (ديناميكية) */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4 text-lg">{t.contactTitle}</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600 font-medium">
              {policyLinks.map(page => (
                <Link key={page.id} to={`/page/${page.slug}`} className="hover:text-[#C5A059] hover:-translate-y-0.5 transition-all">
                  {isRTL ? page.title_ar : page.title_en}
                </Link>
              ))}
            </div>
          </div>

          {/* النشرة البريدية */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4 text-lg">{t.clubTitle}</h3>
            <p className="text-gray-700 font-medium text-sm mb-4 leading-relaxed">{t.clubDesc}</p>
            <form className="flex w-full shadow-sm" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" placeholder={t.placeholder}
                className={`flex-grow px-4 py-3 text-sm bg-white/60 backdrop-blur-sm border border-white/80 outline-none focus:border-[#C5A059] focus:ring-1 ring-[#C5A059] transition-all font-medium ${language === 'ar' ? 'rounded-r-xl border-l-0' : 'rounded-l-xl border-r-0'}`}
                required 
              />
              <button type="submit" className={`px-6 py-3 bg-[#2C2C2C] text-white text-sm font-bold hover:bg-[#C5A059] transition-colors shadow-md ${language === 'ar' ? 'rounded-l-xl' : 'rounded-r-xl'}`}>
                {t.subscribe}
              </button>
            </form>
          </div>

        </div>

        {/* الحقوق */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
          <div>{t.rights}</div>
          <div className="flex gap-4">
            <Link to="/page/terms" className="hover:text-[#C5A059] transition-colors">{t.terms[0]}</Link>
            <Link to="/page/privacy-policy" className="hover:text-[#C5A059] transition-colors">{t.terms[1]}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};