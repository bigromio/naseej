import React from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';

export const Footer = () => {
  const { language } = useStore();
  const t = translations[language];

  return (
    <footer className="bg-charcoal text-offwhite py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif text-2xl font-bold mb-4 text-gold">NASEEJ نسيج</h3>
            <p className="text-sm opacity-80">{t.heroSubtitle}</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t.shop}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>{t.livingRoom}</li>
              <li>{t.bedroom}</li>
              <li>{t.diningRoom}</li>
              <li>{t.office}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">{t.profile}</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li>{t.login}</li>
              <li>{t.register}</li>
              <li>{t.orders}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <div className="flex">
              <input type="email" placeholder={t.email} className="bg-white/10 px-4 py-2 rounded-l-md focus:outline-none w-full" />
              <button className="bg-gold text-white px-4 py-2 rounded-r-md hover:bg-gold/80 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm opacity-60">
          &copy; {new Date().getFullYear()} Naseej. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
