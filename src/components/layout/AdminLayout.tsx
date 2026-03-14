import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';

export const AdminLayout = () => {
  const { language, setUser } = useStore();
  const t = translations[language];
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-offwhite">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal text-white min-h-screen flex flex-col">
        <div className="p-6">
          <Link to="/" className="font-serif text-2xl font-bold text-gold">NASEEJ Admin</Link>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <LayoutDashboard size={20} />
            {t.dashboard}
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <ShoppingCart size={20} />
            {t.orders}
          </Link>
          <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
            <Package size={20} />
            {t.products}
          </Link>
        </nav>
        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          >
            <LogOut size={20} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm h-16 flex items-center px-8">
          <h2 className="text-xl font-semibold text-charcoal">{t.admin}</h2>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
