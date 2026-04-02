import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Package, User, MapPin, Settings, LogOut, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { language, user, setUser, clearCart } = useStore();
  const isRTL = language === 'ar';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleLogout = () => {
    setUser(null);
    clearCart();
    navigate('/');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('users').update({
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone
      }).eq('id', user.id);

      if (error) throw error;
      
      // تحديث الحالة المحلية
      setUser({ ...user, ...editForm });
      alert(isRTL ? 'تم حفظ البيانات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* رأس الصفحة */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#C5A059]/10 text-[#C5A059] rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2C2C2C]">{isRTL ? 'مرحباً،' : 'Welcome,'} {user.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{user.phone || user.email}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold uppercase">{user.role}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {user.role !== 'customer' && (
              <button onClick={() => navigate('/admin')} className="bg-[#2C2C2C] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#C5A059] transition-colors">
                {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center gap-2">
              <LogOut size={18}/> {isRTL ? 'تسجيل خروج' : 'Logout'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* القائمة الجانبية */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2 sticky top-24">
              <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#2C2C2C]'}`}>
                <Package size={20}/> {isRTL ? 'طلباتي' : 'My Orders'}
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#2C2C2C]'}`}>
                <Settings size={20}/> {isRTL ? 'إعدادات الحساب' : 'Account Settings'}
              </button>
            </div>
          </div>

          {/* محتوى التبويبات */}
          <div className="lg:col-span-3">
            
            {/* تبويب الطلبات */}
            {activeTab === 'orders' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'سجل الطلبات' : 'Order History'}</h2>
                <div className="text-center py-20 text-gray-400">
                  <Package size={64} className="mx-auto mb-4 opacity-50" />
                  <p>{isRTL ? 'لا توجد طلبات سابقة حتى الآن.' : 'No orders found.'}</p>
                </div>
                {/* ملاحظة: لاحقاً سنربط هذا الجزء بجدول `orders` في Supabase عند برمجته */}
              </div>
            )}

            {/* تبويب إعدادات الحساب */}
            {activeTab === 'settings' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'تعديل البيانات الشخصية' : 'Edit Personal Info'}</h2>
                
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الجوال (مهم لتلقي الإشعارات)' : 'Phone Number'}</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] text-end font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] text-end" />
                  </div>
                  
                  <button type="submit" disabled={isSaving} className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-[#C5A059] transition-colors flex justify-center items-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
                    {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};