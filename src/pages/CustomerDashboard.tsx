import React from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { User, Package, Settings, LogOut, CheckCircle2, Clock, Truck, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_ORDERS = [
  {
    id: 'ORD-2026-001',
    date: '2026-03-10',
    total: 4500,
    status: 'manufacturing', // processing, manufacturing, qualityCheck, shipped, delivered
    items: [
      { name: 'Royal Velvet Sofa', quantity: 1, image: 'https://picsum.photos/seed/sofa1/100/100' }
    ]
  }
];

export const CustomerDashboard = () => {
  const { language, setUser } = useStore();
  const t = translations[language];
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  const getStatusStep = (status: string) => {
    const steps = ['processing', 'manufacturing', 'qualityCheck', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-28">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User size={24} className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-bold">Test User</h3>
                  <p className="text-sm text-gray-500">test@example.com</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 text-gold font-medium transition-colors">
                  <Package size={20} />
                  {t.orders}
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                  <User size={20} />
                  {t.profile}
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                  <Settings size={20} />
                  {t.settings}
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors mt-8"
                >
                  <LogOut size={20} />
                  {t.logout}
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <h1 className="font-serif text-3xl font-bold mb-8">{t.orders}</h1>
            
            {MOCK_ORDERS.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap justify-between items-center mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order #{order.id}</p>
                    <p className="font-medium">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">{t.total}</p>
                    <p className="font-bold text-gold">{order.total} {t.currency}</p>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="mb-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-gold -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${(getStatusStep(order.status) / 4) * 100}%` }}
                  ></div>
                  
                  <div className="relative z-10 flex justify-between">
                    {[
                      { id: 'processing', icon: Clock, label: t.statusProcessing },
                      { id: 'manufacturing', icon: Package, label: t.statusManufacturing },
                      { id: 'qualityCheck', icon: CheckCircle2, label: t.statusQualityCheck },
                      { id: 'shipped', icon: Truck, label: t.statusShipped },
                      { id: 'delivered', icon: Home, label: t.statusDelivered }
                    ].map((step, index) => {
                      const isCompleted = getStatusStep(order.status) >= index;
                      const isCurrent = getStatusStep(order.status) === index;
                      const Icon = step.icon;
                      
                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                            isCompleted ? 'bg-gold text-white' : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-gold/20' : ''}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`text-xs text-center hidden sm:block ${isCompleted ? 'font-medium text-charcoal' : 'text-gray-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
