import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  Users, Package, Tag, Megaphone, ShoppingCart, BarChart3,
  Settings, LogOut, Shield, Store, User as UserIcon, ChevronDown, Menu, X, Paintbrush, FileText
} from 'lucide-react';
import logo from '@/assets/logo.png';

export const AdminLayout = () => {
  const { language, user, setUser, setLanguage } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = language === 'ar';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => { setUser(null); navigate('/'); };

  const text = {
    ar: {
      commandCenter: 'مركز القيادة', backToStore: 'العودة للمتجر',
      accountSettings: 'إعدادات الحساب', logout: 'تسجيل الخروج',
      nav: {
        team: 'الفريق والعملاء', products: 'إدارة المنتجات', offers: 'العروض والخصومات',
        appearance: 'مظهر المتجر', // <-- أضف هذه
        orders: 'الطلبات واللوجستيات', campaigns: 'الحملات التسويقية', analytics: 'التحليلات والأداء'
      }
    },
    en: {
      commandCenter: 'Command Center', backToStore: 'Back to Store',
      accountSettings: 'Account Settings', logout: 'Logout',
      nav: {
        team: 'HR & CRM', products: 'Products Catalog', offers: 'Offers & Discounts',
        appearance: 'Store Appearance', // <-- أضف هذه
        orders: 'Orders & Logistics', campaigns: 'Marketing Campaigns', analytics: 'Analytics & Perf.'
      }
    }
  };

  const t = text[language as keyof typeof text];

  // تم فصل المنتجات والعروض هنا
  const navItems = [
    { path: '/admin', icon: Users, label: t.nav.team },
    { path: '/admin/products', icon: Package, label: t.nav.products },
    { path: '/admin/offers', icon: Tag, label: t.nav.offers },
    { path: '/admin/appearance', icon: Paintbrush, label: t.nav.appearance }, // <-- التبويب الجديد
    { path: '/admin/pages', icon: FileText, label: language === 'ar' ? 'إدارة الصفحات' : 'Pages Management' }, // <-- التبويب الجديد
    { path: '/admin/orders', icon: ShoppingCart, label: t.nav.orders },
    { path: '/admin/campaigns', icon: Megaphone, label: t.nav.campaigns },
    { path: '/admin/analytics', icon: BarChart3, label: t.nav.analytics },
  ];

  const sidebarDesktopWidth = isDesktopCollapsed ? 'lg:w-20' : 'lg:w-64';
  const mainMarginClass = isRTL ? (isDesktopCollapsed ? 'lg:mr-20' : 'lg:mr-64') : (isDesktopCollapsed ? 'lg:ml-20' : 'lg:ml-64');
  const mobileTranslateClass = isMobileMenuOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full');

  return (
    <div className={`min-h-screen bg-gray-50 flex ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`fixed h-full z-40 bg-[#2C2C2C] text-white flex flex-col transition-all duration-300 ease-in-out w-64 ${sidebarDesktopWidth} ${isRTL ? 'right-0' : 'left-0'} ${mobileTranslateClass} lg:translate-x-0`}>
        <div className={`h-20 border-b border-white/10 flex items-center justify-between lg:justify-center px-4`}>
          <button onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)} className={`hidden lg:flex items-center justify-center w-full focus:outline-none hover:bg-white/5 transition-all cursor-pointer py-2 rounded-xl`} title={isRTL ? 'طي / فتح' : 'Toggle'}>
            <div className="bg-white/90 px-3 py-2 rounded-xl">
              <img src={logo} alt="Naseej" className={`transition-all duration-300 object-contain ${isDesktopCollapsed ? 'w-8 h-8' : 'w-24 h-8'}`} />
            </div>
          </button>
          <div className="flex lg:hidden items-center justify-between w-full">
            <div className="bg-white/90 px-3 py-1.5 rounded-lg"><img src={logo} alt="Naseej" className="w-20 h-6 object-contain" /></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"><X size={20} /></button>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-x-hidden hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} title={isDesktopCollapsed ? item.label : ''} className={`w-full flex items-center ${isDesktopCollapsed ? 'lg:justify-center' : ''} gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#C5A059] text-white font-bold shadow-lg' : 'text-gray-300 hover:bg-white/5'}`}>
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${isDesktopCollapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full ${mainMarginClass}`}>
        <header className="h-20 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none"><Menu size={24} /></button>
            <h1 className="text-lg sm:text-xl font-bold text-[#2C2C2C] hidden sm:block">{t.commandCenter}</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-200 text-[#2C2C2C] hover:bg-gray-200 transition-colors font-bold text-sm">{language === 'ar' ? 'EN' : 'عربي'}</button>
            <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-[#C5A059] font-bold transition-colors hidden sm:flex"><Store size={20} /><span>{t.backToStore}</span></Link>
            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none">
                <div className={`text-${isRTL ? 'left' : 'right'} hidden sm:block`}>
                  <p className="text-sm font-bold text-[#2C2C2C] leading-none mb-1">{user?.full_name}</p>
                  <p className="text-xs text-[#C5A059] leading-none uppercase">{user?.role}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 text-[#2C2C2C] border border-gray-200 rounded-full flex items-center justify-center font-bold overflow-hidden transition-transform hover:scale-105"><UserIcon size={20} /></div>
                <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
              </button>
              {isProfileOpen && (
                <div className={`absolute top-full mt-4 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 ${isRTL ? 'left-0' : 'right-0'} animate-in slide-in-from-top-2 duration-200`}>
                  <Link to="/admin/account" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-[#C5A059] border-b border-gray-50"><Settings size={18} /> {t.accountSettings}</Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 text-right"><LogOut size={18} /> {t.logout}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-8 w-full max-w-full overflow-x-hidden bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};