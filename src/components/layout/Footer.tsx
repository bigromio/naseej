import React from 'react';
import { useStore } from '@/store/useStore';
import logo from '@/assets/logo.png';

export const Footer = () => {
  const { language } = useStore();

  const text = {
    ar: {
      about: "نُعيد صياغة مفهوم الفخامة في منزلك. تصاميم عصرية، خامات استثنائية، وقطع تُروى من خلالها قصة ذوقك الرفيع.",
      linksTitle: "روابط هامة",
      links: ["المجموعات الجديدة", "تتبع طلبك", "الأسئلة الشائعة", "سياسة الاسترجاع والضمان"],
      contactTitle: "تواصل معنا",
      contact: ["واتساب المبيعات", "انستغرام (Instagram)", "بنترست (Pinterest)", "الدعم الفني"],
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
      links: ["New Collections", "Track Order", "FAQs", "Return Policy"],
      contactTitle: "Contact Us",
      contact: ["Sales WhatsApp", "Instagram", "Pinterest", "Technical Support"],
      clubTitle: "Naseej Club",
      clubDesc: "Join our mailing list for decor inspiration and exclusive early access.",
      subscribe: "Subscribe",
      placeholder: "Email Address",
      rights: "© 2026 Naseej Luxury Furniture. All rights reserved.",
      terms: ["Terms & Conditions", "Privacy Policy"]
    }
  };

  const t = text[language as keyof typeof text];

  return (
    <footer className="footer-glass pt-16 pb-6 px-6 sm:px-10 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-black/10 pb-12">
          
          {/* عن البراند */}
          <div>
            <div className="mb-6">
              <img 
                src={logo} 
                alt="Naseej Logo" 
                className="h-25 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" 
              />
            </div>
            <p className="text-gray-600 leading-relaxed text-sm">
              {t.about}
            </p>
          </div>

          {/* روابط هامة */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4">{t.linksTitle}</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              {t.links.map((link, i) => (
                <a key={i} href="#" className="hover:text-black hover:-translate-y-0.5 transition-all">{link}</a>
              ))}
            </div>
          </div>

          {/* تواصل معنا */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4">{t.contactTitle}</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-600">
              {t.contact.map((link, i) => (
                <a key={i} href="#" className="hover:text-black hover:-translate-y-0.5 transition-all">{link}</a>
              ))}
            </div>
          </div>

          {/* النشرة البريدية */}
          <div>
            <h3 className="font-bold text-[#2C2C2C] mb-4">{t.clubTitle}</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {t.clubDesc}
            </p>
            <form className="flex w-full shadow-sm" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder={t.placeholder}
                className={`flex-grow px-4 py-3 text-sm bg-white/50 border border-black/10 outline-none focus:border-black/30 ${language === 'ar' ? 'rounded-r-lg' : 'rounded-l-lg'}`}
                required 
              />
              <button 
                type="submit" 
                className={`px-6 py-3 bg-[#2C2C2C] text-white text-sm font-bold hover:bg-black transition-colors ${language === 'ar' ? 'rounded-l-lg' : 'rounded-r-lg'}`}
              >
                {t.subscribe}
              </button>
            </form>
          </div>

        </div>

        {/* الحقوق */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>{t.rights}</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-black transition-colors">{t.terms[0]}</a>
            <a href="#" className="hover:text-black transition-colors">{t.terms[1]}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};