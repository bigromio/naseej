import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Package, User, Settings, LogOut, Loader2, Save, CalendarCheck, Clock, Trash2, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { language, user, setUser, clearCart } = useStore();
  const isRTL = language === 'ar';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'appointments' | 'settings'>('orders');
  const [isLoading, setIsLoading] = useState(true);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // 🌟 حالات إعدادات الحساب
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '' // 👈 إضافة العنوان
  });

  // 🌟 حالات تعديل الموعد
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // 1. جلب بيانات العميل (طلبات ومواعيد)
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: ordersData } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (ordersData) setOrders(ordersData);

        const { data: appsData } = await supabase.from('appointments').select('*').eq('user_id', user.id).order('appointment_date', { ascending: false });
        if (appsData) setAppointments(appsData);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  // 2. تحديث الأوقات المتاحة عند محاولة تعديل الموعد
  useEffect(() => {
    if (!editDate) return;
    const fetchBookedSlots = async () => {
      try {
        const { data } = await supabase.from('appointments').select('appointment_time').eq('appointment_date', editDate).neq('status', 'cancelled').neq('id', editingAppId);
        const allSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        const booked = (data || []).map(a => a.appointment_time.substring(0, 5));
        setAvailableSlots(allSlots.filter(s => !booked.includes(s)));
      } catch (err) { console.error(err); }
    };
    fetchBookedSlots();
  }, [editDate, editingAppId]);

  // 🌟 دوال الإجراءات
  const handleLogout = () => {
    setUser(null);
    clearCart();
    navigate('/');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.from('users').update({
        full_name: editForm.full_name, email: editForm.email, phone: editForm.phone, address: editForm.address // 👈 إضافة العنوان للحفظ
      }).eq('id', user.id);
      if (error) throw error;
      
      setUser({ ...user, ...editForm });
      alert(isRTL ? 'تم حفظ البيانات بنجاح' : 'Settings saved successfully');
    } catch (error) {
      alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAppointment = async (appId: string) => {
    if (!editDate || !editTime) return alert(isRTL ? 'يرجى اختيار التاريخ والوقت' : 'Select date and time');
    setIsSavingEdit(true);
    try {
      const formattedTime = editTime.includes(':00') ? editTime : editTime + ':00';
      const { error } = await supabase.from('appointments').update({ appointment_date: editDate, appointment_time: formattedTime }).eq('id', appId);
      if (error) throw error;

      setAppointments(appointments.map(a => a.id === appId ? { ...a, appointment_date: editDate, appointment_time: formattedTime } : a));
      setEditingAppId(null);
      alert(isRTL ? '✅ تم تعديل الموعد بنجاح' : '✅ Appointment updated successfully');
    } catch (err) {
      alert(isRTL ? '❌ حدث خطأ أثناء التعديل' : '❌ Error updating appointment');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMsg = isRTL 
      ? '⚠️ تحذير: هل أنت متأكد من رغبتك في حذف حسابك نهائياً؟\nاكتب "حذف" لتأكيد الإجراء.' 
      : '⚠️ Warning: Are you sure you want to permanently delete your account?\nType "delete" to confirm.';
    
    const userInput = prompt(confirmMsg);
    if (userInput !== (isRTL ? 'حذف' : 'delete')) {
      if (userInput !== null) alert(isRTL ? 'تم إلغاء عملية الحذف.' : 'Deletion cancelled.');
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', user?.id);
      if (error) throw error;
      alert(isRTL ? 'تم حذف حسابك بنجاح. نتمنى رؤيتك قريباً.' : 'Account deleted successfully.');
      handleLogout();
    } catch (error) {
      alert(isRTL ? 'حدث خطأ أثناء محاولة حذف الحساب.' : 'Error deleting account.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statuses: any = { pending: isRTL ? 'قيد المراجعة' : 'Pending', processing: isRTL ? 'قيد التجهيز' : 'Processing', confirmed: isRTL ? 'مؤكد' : 'Confirmed', shipped: isRTL ? 'تم الشحن' : 'Shipped', completed: isRTL ? 'مكتمل' : 'Completed', delivered: isRTL ? 'تم التوصيل' : 'Delivered', cancelled: isRTL ? 'ملغي' : 'Cancelled' };
    return statuses[status] || status;
  };

  if (!user) return null;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#C5A059]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* رأس الصفحة */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#C5A059]/10 text-[#C5A059] rounded-full flex items-center justify-center font-bold text-2xl">
              {user.full_name?.charAt(0) || <User size={32} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2C2C2C]">{isRTL ? 'مرحباً،' : 'Welcome,'} {user.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 font-mono" dir="ltr">{user.phone || user.email}</span>
                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold uppercase">{user.role}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {user.role !== 'customer' && (
              <button onClick={() => navigate('/admin')} className="bg-[#2C2C2C] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#C5A059] transition-colors">
                {isRTL ? 'لوحة الإدارة' : 'Admin Panel'}
              </button>
            )}
            <button onClick={handleLogout} className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
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
              <button onClick={() => setActiveTab('appointments')} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'appointments' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#2C2C2C]'}`}>
                <CalendarCheck size={20}/> {isRTL ? 'حجوزاتي' : 'My Appointments'}
              </button>
              <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-[#C5A059]/10 text-[#C5A059]' : 'text-gray-500 hover:bg-gray-50 hover:text-[#2C2C2C]'}`}>
                <Settings size={20}/> {isRTL ? 'إعدادات الحساب' : 'Account Settings'}
              </button>
            </div>
          </div>

          {/* محتوى التبويبات */}
          <div className="lg:col-span-3">
            
            {/* 🌟 تبويب الطلبات 🌟 */}
            {activeTab === 'orders' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'سجل الطلبات' : 'Order History'}</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Package size={64} className="mx-auto mb-4 opacity-50" />
                      <p>{isRTL ? 'لا توجد طلبات سابقة حتى الآن.' : 'No orders found.'}</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border border-gray-100 rounded-2xl hover:border-[#C5A059]/30 transition-colors bg-gray-50/50">
                        <div>
                          <h4 className="font-bold text-[#2C2C2C] text-lg mb-1">#{order.id.substring(0,8)}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                          <span className="font-bold text-[#2C2C2C]">{order.total} {isRTL ? 'ر.س' : 'SAR'}</span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 🌟 تبويب الحجوزات 🌟 */}
            {activeTab === 'appointments' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'مواعيدي' : 'My Appointments'}</h2>
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <CalendarCheck size={64} className="mx-auto mb-4 opacity-50" />
                      <p>{isRTL ? 'لا توجد مواعيد محجوزة.' : 'No appointments found.'}</p>
                    </div>
                  ) : (
                    appointments.map((app) => (
                      <div key={app.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-1.5 ${app.status === 'pending' ? 'bg-yellow-400' : app.status === 'confirmed' ? 'bg-blue-400' : app.status === 'completed' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pl-4 rtl:pr-4">
                          <div>
                            <h4 className="font-bold text-[#2C2C2C] text-lg mb-1">{app.service_type}</h4>
                            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border mb-3 ${getStatusColor(app.status)}`}>{getStatusText(app.status)}</span>
                            
                            {editingAppId === app.id ? (
                              <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl border border-gray-200 mt-2">
                                <div><label className="block text-xs font-bold text-gray-600 mb-1">{isRTL ? 'تاريخ جديد' : 'New Date'}</label><input type="date" min={new Date().toISOString().split('T')[0]} value={editDate} onChange={e=>setEditDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:border-[#C5A059] text-sm" /></div>
                                <div><label className="block text-xs font-bold text-gray-600 mb-1">{isRTL ? 'وقت جديد' : 'New Time'}</label>
                                  <select value={editTime} onChange={e=>setEditTime(e.target.value)} className="p-2 border border-gray-300 rounded-lg outline-none focus:border-[#C5A059] text-sm disabled:opacity-50" disabled={!editDate}>
                                    <option value="" disabled>{isRTL ? 'اختر...' : 'Select...'}</option>
                                    {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                <div className="flex gap-2 mt-2 sm:mt-0">
                                  <button onClick={() => handleSaveAppointment(app.id)} disabled={isSavingEdit} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"><Save size={18}/></button>
                                  <button onClick={() => setEditingAppId(null)} className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-colors"><X size={18}/></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 text-gray-600 font-bold bg-white px-4 py-2 rounded-xl inline-flex border border-gray-200">
                                <span className="flex items-center gap-2"><CalendarCheck size={16} className="text-[#C5A059]"/> {app.appointment_date}</span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-2"><Clock size={16} className="text-[#C5A059]"/> {app.appointment_time.substring(0, 5)}</span>
                              </div>
                            )}
                          </div>
                          {(app.status === 'pending' || app.status === 'confirmed') && editingAppId !== app.id && (
                            <button onClick={() => { setEditingAppId(app.id); setEditDate(app.appointment_date); setEditTime(app.appointment_time.substring(0, 5)); }} className="text-gray-500 hover:text-[#C5A059] flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 px-4 py-2 rounded-xl hover:border-[#C5A059] transition-colors shadow-sm">
                              <Edit2 size={16}/> {isRTL ? 'تعديل الموعد' : 'Reschedule'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 🌟 تبويب إعدادات الحساب 🌟 */}
            {activeTab === 'settings' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'تعديل البيانات الشخصية' : 'Edit Personal Info'}</h2>
                  <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label><input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الجوال' : 'Phone Number'}</label><input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label><input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'العنوان المحفوظ' : 'Saved Address'}</label><textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} rows={3} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 resize-none" placeholder={isRTL ? 'المدينة، الحي، الشارع...' : 'City, District, Street...'}></textarea></div>
                    
                    <button type="submit" disabled={isSavingProfile} className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-[#C5A059] transition-colors flex justify-center items-center gap-2">
                      {isSavingProfile ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                <div className="border-t border-gray-100 pt-8">
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-red-800 mb-1">{isRTL ? 'المنطقة الخطرة' : 'Danger Zone'}</h3>
                      <p className="text-sm text-red-600">{isRTL ? 'بمجرد حذف حسابك، سيتم مسح جميع بياناتك ولا يمكن التراجع عن هذا الإجراء.' : 'Once deleted, all your data will be permanently erased.'}</p>
                    </div>
                    <button onClick={handleDeleteAccount} className="bg-white text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2 shrink-0 shadow-sm">
                      <Trash2 size={18}/> {isRTL ? 'حذف الحساب نهائياً' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};