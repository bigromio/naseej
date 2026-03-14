import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Globe, Menu } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { cn } from '@/lib/utils';

export const Header = ({ isTransparent = false }: { isTransparent?: boolean }) => {
  const { language, setLanguage, cart, user } = useStore();
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      isTransparent ? "bg-transparent text-white" : "glass-panel-dark text-white shadow-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link to="/" className="font-serif text-2xl font-bold tracking-wider">
              NASEEJ <span className="text-gold">نسيج</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8 rtl:space-x-reverse">
            <Link to="/" className="hover:text-gold transition-colors">{t.home}</Link>
            <Link to="/shop" className="hover:text-gold transition-colors">{t.shop}</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="hover:text-gold transition-colors">{t.admin}</Link>
            )}
          </nav>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button onClick={toggleLanguage} className="p-2 hover:text-gold transition-colors flex items-center gap-1">
              <Globe size={20} />
              <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            
            <Link to="/checkout" className="p-2 hover:text-gold transition-colors relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-gold text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to={user ? "/dashboard" : "/auth"} className="p-2 hover:text-gold transition-colors">
              <User size={20} />
            </Link>
            
            <button className="md:hidden p-2 hover:text-gold transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
