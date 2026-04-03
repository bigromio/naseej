import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { triggerAutomation } from '@/lib/automations';
import { CheckCircle, Package, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import logo from '@/assets/logo.png';

export const DeliveryVerify = () => {
  const [orderId, setOrderId] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerifyDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. البحث عن الطلب في قاعدة البيانات
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) throw new Error('الطلب غير موجود، تأكد من رقم الطلب.');
      if (order.status === 'delivered') throw new Error('تم تسليم هذا الطلب مسبقاً.');
      if (order.status !== 'shipped') throw new Error('هذا الطلب ليس في حالة "تم الشحن" بعد.');
      if (order.delivery_otp !== otp) throw new Error('رمز التحقق (OTP) غير صحيح، اطلب الرمز الصحيح من العميل.');

      // 2. تحديث الحالة إلى "تم التوصيل"
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // 3. إطلاق إشعار التوصيل (اختياري: لتقييم المتجر)
      await triggerAutomation({
        eventName: 'order_delivered',
        brand: 'naseej',
        userParams: { phone: order.customer_phone, email: order.customer_email, language: 'ar' },
        variables: { customer_name: order.customer_name, order_id: order.id }
      });

      setSuccessMsg('تمت المطابقة! تم تسجيل الطلب كـ "تم التوصيل" بنجاح.');
      setOrderId('');
      setOtp('');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* رأس الصفحة */}
        <div className="bg-[#2C2C2C] p-8 text-center border-b-4 border-[#C5A059]">
          <div className="bg-white/10 p-3 rounded-2xl inline-block mb-4">
            <Package size={40} className="text-[#C5A059]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">بوابة تسليم الطلبات</h1>
          <p className="text-gray-400 text-sm">مخصصة لمندوبي التوصيل فقط</p>
        </div>

        {/* نموذج الإدخال */}
        <div className="p-8">
          {successMsg ? (
            <div className="text-center animate-in zoom-in duration-300 py-6">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">عملية ناجحة</h2>
              <p className="text-gray-500 mb-6">{successMsg}</p>
              <button onClick={() => setSuccessMsg('')} className="bg-[#C5A059] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#b08d4b] transition-colors w-full">
                تسليم طلب آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerifyDelivery} className="space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-in shake">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-bold">{errorMsg}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رقم الطلب (Order ID)</label>
                <input 
                  type="text" 
                  value={orderId} 
                  onChange={(e) => setOrderId(e.target.value)} 
                  placeholder="NSJ-XXXXXX" 
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-center font-bold tracking-wider" 
                  dir="ltr"
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رمز التحقق من العميل (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute right-4 top-4 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    maxLength={4}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    placeholder="----" 
                    className="w-full p-4 pr-12 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-center text-3xl font-bold tracking-[1em]" 
                    dir="ltr"
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-[#C5A059] transition-colors shadow-lg disabled:opacity-70 mt-8"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />} 
                تأكيد وتسليم الطلب
              </button>
            </form>
          )}
        </div>
        
        {/* التذييل */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100 flex justify-center">
          <img src={logo} alt="Naseej" className="h-6 opacity-50 grayscale" />
        </div>
      </div>
    </div>
  );
};