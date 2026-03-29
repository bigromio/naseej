import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Loader2, Calendar, ShoppingBag, CheckCircle, XCircle, Clock, MessageCircle, Mail, AlertCircle, Phone } from 'lucide-react';
export const AdminOrders = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  // التبويب النشط (طلبات المتجر أو حجوزات المواعيد)
  const [activeTab, setActiveTab] = useState<'orders' | 'appointments'>('appointments');
  
  // حالة الحجوزات
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الحجوزات من قاعدة البيانات
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false }) // الأحدث أولاً
        .order('appointment_time', { ascending: false });
      
      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  // تحديث حالة الحجز (قبول / إلغاء) مع محاكاة إرسال الإشعارات
  const updateAppointmentStatus = async (id: string, newStatus: string, customerName: string, customerPhone: string) => {
    // 1. تحديث قاعدة البيانات
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;

      // 2. تحديث الواجهة فوراً
      setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus } : app));

      // 3. 🚀 نظام الإشعارات (المحاكاة لسيرفر Contabo المستقبلي)
      if (newStatus === 'confirmed') {
        alert(
          `[محاكاة السيرفر - Contabo API]\n\n` +
          `✅ تم تأكيد الحجز في قاعدة البيانات.\n` +
          `📱 جاري إرسال رسالة WhatsApp للرقم: ${customerPhone}...\n` +
          `📧 جاري إرسال Email للعميل: ${customerName}...\n\n` +
          `(سيتم تفعيل الإرسال الفعلي لاحقاً عند ربط سيرفر الـ Node.js)`
        );
      } else if (newStatus === 'cancelled') {
        alert(
          `[محاكاة السيرفر - Contabo API]\n\n` +
          `❌ تم إلغاء الحجز وإتاحة الوقت من جديد.\n` +
          `📱 جاري إرسال رسالة اعتذار عبر WhatsApp للرقم: ${customerPhone}...`
        );
      }

    } catch (error: any) {
      alert('حدث خطأ أثناء التحديث: ' + error.message);
    }
  };

  // تنسيق الوقت للعرض (12 ساعة)
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
            <ShoppingBag /> {isRTL ? 'إدارة الطلبات والحجوزات' : 'Orders & Appointments'}
          </h2>
          <p className="text-gray-500">{isRTL ? 'تابع مبيعات المتجر ومواعيد الاستشارات من مكان واحد.' : 'Manage store sales and consultation appointments.'}</p>
        </div>
      </div>

      {/* أزرار التبديل العلوية (Tabs) */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'appointments' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Calendar size={20} /> {isRTL ? 'حجوزات المواعيد' : 'Appointments'}
          <span className="bg-[#C5A059] text-white text-xs px-2 py-0.5 rounded-full ml-2">
            {appointments.filter(a => a.status === 'pending').length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'orders' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ShoppingBag size={20} /> {isRTL ? 'طلبات المتجر' : 'Store Orders'}
        </button>
      </div>

      {/* محتوى التبويبات */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* ================================== */}
        {/* تبويب الحجوزات */}
        {/* ================================== */}
        {activeTab === 'appointments' && (
          <div className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">{isRTL ? 'لا توجد حجوزات حالياً.' : 'No appointments currently.'}</p>
              </div>
            ) : (
              <table className="w-full text-start">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'العميل' : 'Customer'}</th>
                    <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'نوع الخدمة' : 'Service'}</th>
                    <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    <th className="p-4 text-center font-bold text-gray-600">{isRTL ? 'الحالة' : 'Status'}</th>
                    <th className="p-4 text-center font-bold text-gray-600">{isRTL ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((app) => (
                    <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {/* العميل */}
                      <td className="p-4">
                        <div className="font-bold text-[#2C2C2C]">{app.customer_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1" dir="ltr">
                          <Phone size={14} className="text-[#C5A059]"/> {app.customer_phone}
                        </div>
                      </td>
                      
                      {/* نوع الخدمة */}
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold">
                          {app.service_type}
                        </span>
                      </td>

                      {/* التاريخ والوقت */}
                      <td className="p-4">
                        <div className="font-bold text-[#2C2C2C] flex items-center gap-2">
                          <Calendar size={16} className="text-[#C5A059]"/> {app.appointment_date}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <Clock size={16} className="text-[#C5A059]"/> {formatTime(app.appointment_time)}
                        </div>
                      </td>

                      {/* الحالة */}
                      <td className="p-4 text-center">
                        {app.status === 'pending' && <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold"><Clock size={14}/> قيد المراجعة</span>}
                        {app.status === 'confirmed' && <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle size={14}/> مؤكد</span>}
                        {app.status === 'cancelled' && <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold"><XCircle size={14}/> ملغي</span>}
                      </td>

                      {/* إجراءات التأكيد والإلغاء */}
                      <td className="p-4 text-center">
                        {app.status === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'confirmed', app.customer_name, app.customer_phone)}
                              className="p-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-xl transition-colors title='تأكيد وإرسال إشعار'"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button 
                              onClick={() => updateAppointmentStatus(app.id, 'cancelled', app.customer_name, app.customer_phone)}
                              className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors title='إلغاء الموعد'"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm font-bold">تمت المعالجة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ================================== */}
        {/* تبويب طلبات المتجر (للمرحلة القادمة) */}
        {/* ================================== */}
        {activeTab === 'orders' && (
          <div className="p-20 text-center flex flex-col items-center justify-center bg-gray-50/50">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6 shadow-inner">
              <ShoppingBag size={40} />
            </div>
            <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">طلبات المتجر (قريباً)</h3>
            <p className="text-gray-500 max-w-md">سيتم تفعيل هذا القسم فور الانتهاء من برمجة (السلة العائمة ونظام الدفع Checkout) لتظهر طلبات العملاء هنا مباشرة.</p>
          </div>
        )}

      </div>
    </div>
  );
};