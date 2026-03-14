import React from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { TrendingUp, Package, DollarSign } from 'lucide-react';

export const AdminDashboard = () => {
  const { language } = useStore();
  const t = translations[language];

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t.totalRevenue}</h3>
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-charcoal">124,500 {t.currency}</p>
          <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
            <TrendingUp size={16} /> +12.5%
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t.activeOrders}</h3>
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
              <Package size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-charcoal">45</p>
          <p className="text-sm text-blue-500 mt-2 flex items-center gap-1">
            <TrendingUp size={16} /> +5.2%
          </p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">{t.orders}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">{t.customer}</th>
                <th className="px-6 py-4 font-medium">{t.date}</th>
                <th className="px-6 py-4 font-medium">{t.total}</th>
                <th className="px-6 py-4 font-medium">{t.status}</th>
                <th className="px-6 py-4 font-medium">{t.workshopBids}</th>
                <th className="px-6 py-4 font-medium">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">#ORD-00{i}</td>
                  <td className="px-6 py-4">Customer {i}</td>
                  <td className="px-6 py-4">2026-03-10</td>
                  <td className="px-6 py-4">4,500 {t.currency}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">
                      Processing
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      Pending Bids
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gold hover:text-gold/80 font-medium text-sm">
                      {t.edit}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
