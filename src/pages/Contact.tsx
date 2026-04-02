import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { triggerAutomation } from '@/lib/automations'; // 👈 استدعاء محرك الإشعارات
import { MapPin, Phone, Mail, Instagram, Clock, Calendar, MessageSquare, Send, CalendarCheck, Twitter, Facebook, Youtube, Linkedin, MessageCircle, Link as LinkIcon, Loader2, KeyRound, CheckCircle, User as UserIcon } from 'lucide-react';

const NOTIFICATION_API = 'http://167.86.73.97:8080/send';

export const Contact = () => {
  const { language, homeSections, fetchHomeSections, user, setUser } = useStore();
  const isRTL = language === 'ar';
  
  const [activeTab, setActiveTab] = useState<'message' | 'book'>('book');

  // جلب بيانات الواجهة
  useEffect(() => {
    if (homeSections.length === 0) fetchHomeSections();
    window.scrollTo(0,0);
  }, [homeSections.length, fetchHomeSections]);

  const contactSection = homeSections.find(s => s.id === 'contact_info');
  const contactData = isRTL ? contactSection?.content_ar : contactSection?.content_en;

  const info = contactData || {
    phone: '+966 50 000 0000', email: 'info@naseej.com',
    address: isRTL ? 'الرياض، السعودية' : 'Riyadh, Saudi Arabia',
    hours: isRTL ? 'الأحد - الخميس: 10 ص - 10 م\nالجمعة - السبت: 4 عصراً - 11 مساءً' : 'Sun - Thu: 10 AM - 10 PM\nFri - Sat: 4 PM - 11 PM',
    map_url: '', social_links: []
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram size={20} />; case 'twitter': return <Twitter size={20} />; case 'facebook': return <Facebook size={20} />;
      case 'youtube': return <Youtube size={20} />; case 'linkedin': return <Linkedin size={20} />; case 'whatsapp': return <MessageCircle size={20} />;
      default: return <LinkIcon size={20} />;
    }
  };

  // ==========================================
  // 🌟 نظام المصادقة الموحد (مثل الـ Checkout)
  // ==========================================
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'details' | 'otp'>('details');
  const [resendTimer, setResendTimer] = useState(0);

  const [loginVal, setLoginVal] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [activeContactForOTP, setActiveContactForOTP] = useState('');

  const [otp, setOtp] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
    return cleanPhone;
  };

  // 1️⃣ إرسال رمز التحقق (للدخول أو التسجيل)
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resendTimer > 0) return;

    let targetPhone = '';
    let targetEmail = '';
    let dbContactKey = '';

    if (authMode === 'login') {
      if (!loginVal) return alert(isRTL ? 'يرجى إدخال الجوال أو الإيميل' : 'Enter phone or email');
      if (loginVal.includes('@')) { targetEmail = loginVal; dbContactKey = loginVal; } 
      else { targetPhone = loginVal; dbContactKey = loginVal; }
    } else {
      if (!regFullName || !regPhone || !regEmail) return alert(isRTL ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
      targetPhone = regPhone; targetEmail = regEmail; dbContactKey = regPhone;
    }

    setIsAuthenticating(true);
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const { error: dbError } = await supabase.from('otp_verifications').upsert({
        contact_val: dbContactKey, code: newOtp, expires_at: new Date(Date.now() + 10 * 60000).toISOString()
      }, { onConflict: 'contact_val' });
      if (dbError) throw dbError;

      const payload: any = { brand: 'naseej' };
      if (targetPhone) {
        payload.phone = formatPhoneForWhatsApp(targetPhone);
        payload.message = isRTL ? `مرحباً بك في نسيج 🛋️\n\nرمز التحقق الخاص بك هو: *${newOtp}*\n\nلا تشارك هذا الرمز مع أحد.` : `Welcome to Naseej 🛋️\n\nYour OTP is: *${newOtp}*`;
      }
      if (targetEmail) {
        payload.email = targetEmail;
        payload.subject = isRTL ? 'رمز التحقق - نسيج' : 'OTP - Naseej';
        payload.html = `<div style="text-align:center; padding:20px; font-family:Tahoma;"><h2>${isRTL ? 'رمز التحقق الخاص بك:' : 'Your OTP code:'}</h2><h1 style="color:#C5A059; letter-spacing:5px;">${newOtp}</h1></div>`;
      }

      const response = await fetch(NOTIFICATION_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Failed');
      
      setActiveContactForOTP(dbContactKey);
      setResendTimer(60); 
      setAuthStep('otp');
    } catch (error) {
      alert(isRTL ? 'حدث خطأ في إرسال الرمز.' : 'Error sending OTP.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2️⃣ التحقق من الرمز وإنشاء الحساب التلقائي + رسالة الترحيب
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsAuthenticating(true);
    
    try {
      const { data: otpData, error: otpError } = await supabase.from('otp_verifications').select('*').eq('contact_val', activeContactForOTP).eq('code', otp).single();
      if (otpError || !otpData) return alert(isRTL ? 'رمز التحقق غير صحيح!' : 'Invalid OTP code!');
      if (new Date() > new Date(otpData.expires_at)) return alert(isRTL ? 'انتهت صلاحية الرمز، يرجى طلب رمز جديد.' : 'OTP expired, please request a new one.');

      await supabase.from('otp_verifications').delete().eq('contact_val', activeContactForOTP);

      let finalUser = null;
      
      if (authMode === 'login') {
        const searchColumn = activeContactForOTP.includes('@') ? 'email' : 'phone';
        const { data: existingUser } = await supabase.from('users').select('*').eq(searchColumn, activeContactForOTP).single();
        if (existingUser) { finalUser = existingUser; } 
        else {
          const newUser = { full_name: isRTL ? 'عميل نسيج' : 'Naseej Customer', [searchColumn]: activeContactForOTP, role: 'customer' };
          const { data: insertedUser, error } = await supabase.from('users').insert([newUser]).select().single();
          if (error) throw error;
          finalUser = insertedUser;
          
          // 🌟 إطلاق إشعار الترحيب للعملاء الجدد 🌟
          await triggerAutomation({ eventName: 'welcome_msg', brand: 'naseej', userParams: { phone: finalUser.phone, email: finalUser.email, language: isRTL ? 'ar' : 'en' }, variables: { customer_name: finalUser.full_name } });
        }
      } else {
        const { data: existingUserCheck } = await supabase.from('users').select('*').eq('phone', regPhone).maybeSingle();
        if (existingUserCheck) { finalUser = existingUserCheck; } 
        else {
          const newUser = { full_name: regFullName, phone: regPhone, email: regEmail, role: 'customer' };
          const { data: insertedUser, error } = await supabase.from('users').insert([newUser]).select().single();
          if (error) throw error;
          finalUser = insertedUser;

          // 🌟 إطلاق إشعار الترحيب للعملاء الجدد 🌟
          await triggerAutomation({ eventName: 'welcome_msg', brand: 'naseej', userParams: { phone: finalUser.phone, email: finalUser.email, language: isRTL ? 'ar' : 'en' }, variables: { customer_name: finalUser.full_name } });
        }
      }

      setUser(finalUser);
    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ أثناء مزامنة بياناتك.' : 'Error syncing user data.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ==========================================
  // 🌟 نظام المواعيد الفعلي للمستخدمين المسجلين
  // ==========================================
  const [bookingData, setBookingData] = useState({
    service: isRTL ? 'استشارة تصميم داخلي' : 'Interior Design Consultation',
    date: '',
    time: ''
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    if (!bookingData.date) { setAvailableSlots([]); return; }
    const fetchBookedSlots = async () => {
      try {
        const { data, error } = await supabase.from('appointments').select('appointment_time').eq('appointment_date', bookingData.date).neq('status', 'cancelled');
        if (error) throw error;

        const allSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        const booked = data.map(app => app.appointment_time.substring(0, 5));
        const free = allSlots.filter(slot => !booked.includes(slot));
        setAvailableSlots(free);
        
        if (bookingData.time && !free.includes(bookingData.time)) setBookingData(prev => ({ ...prev, time: '' }));
      } catch (error) { console.error("Error fetching slots:", error); }
    };
    fetchBookedSlots();
  }, [bookingData.date, bookingData.time]);

  const executeBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingData.date || !bookingData.time) return alert(isRTL ? 'يرجى تعبئة جميع الحقول' : 'Fill all fields');
    setIsBooking(true);
    
    try {
      // 1. حفظ الموعد في القاعدة
      const { error } = await supabase.from('appointments').insert([{
        user_id: user.id,
        customer_name: user.full_name,
        customer_phone: user.phone,
        service_type: bookingData.service,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time + ':00',
        status: 'pending'
      }]);
      if (error) throw error;

      // 2. إطلاق إشعار حجز الموعد 🌟
      const formattedTime = parseInt(bookingData.time) > 12 ? `${parseInt(bookingData.time) - 12}:00 PM` : parseInt(bookingData.time) === 12 ? '12:00 PM' : `${bookingData.time} AM`;
      await triggerAutomation({
        eventName: 'appointment_booked', 
        brand: 'naseej',
        userParams: { phone: user.phone, email: user.email, language: isRTL ? 'ar' : 'en' },
        variables: {
          customer_name: user.full_name,
          appointment_date: `${bookingData.date} | ${formattedTime}`,
          service_type: bookingData.service
        }
      });

      alert(isRTL ? '🎉 تم تأكيد الموعد بنجاح!' : '🎉 Appointment Confirmed!');
      setBookingData({ ...bookingData, date: '', time: '' });
      
    } catch (err: any) { alert(err.message); } finally { setIsBooking(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* الغلاف */}
      <div className="bg-[#2C2C2C] py-20 text-center border-b-4 border-[#C5A059] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618220179428-22790b46a013?q=80')] opacity-20 bg-cover bg-center"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">{isRTL ? 'تواصل معنا' : 'Contact Us'}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">{isRTL ? 'نحن هنا للإجابة على استفساراتك، ومساعدتك في بناء مساحة أحلامك.' : 'We are here to answer your inquiries and help you build your dream space.'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* الجانب الأيمن: معلومات التواصل والخريطة الحية */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 border-b border-gray-100 pb-4">{isRTL ? 'معلومات الاتصال' : 'Contact Information'}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-[#C5A059]/10 text-[#C5A059] rounded-xl flex items-center justify-center shrink-0"><MapPin size={24} /></div><div><h4 className="font-bold text-[#2C2C2C]">{isRTL ? 'المعرض الرئيسي' : 'Main Showroom'}</h4><p className="text-gray-500 text-sm mt-1">{info.address}</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-[#C5A059]/10 text-[#C5A059] rounded-xl flex items-center justify-center shrink-0"><Phone size={24} /></div><div><h4 className="font-bold text-[#2C2C2C]">{isRTL ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</h4><p className="text-gray-500 text-sm mt-1 font-mono" dir="ltr">{info.phone}</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-[#C5A059]/10 text-[#C5A059] rounded-xl flex items-center justify-center shrink-0"><Mail size={24} /></div><div><h4 className="font-bold text-[#2C2C2C]">{isRTL ? 'البريد الإلكتروني' : 'Email'}</h4><p className="text-gray-500 text-sm mt-1 font-mono">{info.email}</p></div></div>
                <div className="flex items-start gap-4"><div className="w-12 h-12 bg-[#C5A059]/10 text-[#C5A059] rounded-xl flex items-center justify-center shrink-0"><Clock size={24} /></div><div><h4 className="font-bold text-[#2C2C2C]">{isRTL ? 'ساعات العمل' : 'Working Hours'}</h4><p className="text-gray-500 text-sm mt-1 whitespace-pre-line">{info.hours}</p></div></div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-4">
                {info.social_links?.map((link: any, idx: number) => (
                  <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-[#C5A059] hover:text-white transition-colors hover:scale-110" title={link.platform}>{getSocialIcon(link.platform)}</a>
                ))}
              </div>
            </div>
            {info.map_url && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[300px] relative p-2">
                <iframe src={info.map_url} className="w-full h-full rounded-2xl border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Showroom Location"></iframe>
              </div>
            )}
          </div>

          {/* الجانب الأيسر: النماذج */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab('book')} className={`flex-1 py-5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'book' ? 'bg-[#C5A059] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><CalendarCheck size={20} /> {isRTL ? 'حجز موعد استشارة' : 'Book Appointment'}</button>
                <button onClick={() => setActiveTab('message')} className={`flex-1 py-5 font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'message' ? 'bg-[#C5A059] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><MessageSquare size={20} /> {isRTL ? 'إرسال رسالة' : 'Send Message'}</button>
              </div>

              <div className="p-8 md:p-10">
                {/* 🌟 تبويب الحجز 🌟 */}
                {activeTab === 'book' && (
                  !user ? (
                    // 1. شاشة الدخول / التسجيل لغير المسجلين
                    <div className="animate-in fade-in">
                      <div className="text-center mb-8">
                        <UserIcon className="mx-auto text-[#C5A059] mb-4" size={40}/>
                        <h3 className="text-2xl font-bold text-[#2C2C2C]">{isRTL ? 'تسجيل الدخول لحجز موعد' : 'Login to Book'}</h3>
                        <p className="text-sm text-gray-500 mt-2">{isRTL ? 'نحتاج للتحقق من هويتك لضمان جودة حجوزاتنا.' : 'We need to verify your identity to secure the booking.'}</p>
                      </div>
                      
                      {authStep === 'details' ? (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                          <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                            <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'login' ? 'bg-white shadow-sm border border-gray-100 text-[#2C2C2C]' : 'text-gray-500 hover:text-gray-700'}`}>{isRTL ? 'تسجيل دخول (عائد)' : 'Login (Returning)'}</button>
                            <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'register' ? 'bg-white shadow-sm border border-gray-100 text-[#2C2C2C]' : 'text-gray-500 hover:text-gray-700'}`}>{isRTL ? 'حساب جديد' : 'New Account'}</button>
                          </div>
                          
                          <div className="animate-in fade-in space-y-4">
                            {authMode === 'login' ? (
                              <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الجوال أو الإيميل' : 'Phone or Email'}</label>
                                <input type="text" value={loginVal} onChange={e=>setLoginVal(e.target.value)} dir="ltr" placeholder="05XXXXXXXX / name@email.com" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required />
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label><input type="text" value={regFullName} onChange={e=>setRegFullName(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الواتساب' : 'WhatsApp Number'}</label><input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value)} dir="ltr" placeholder="05XXXXXXXX" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label><input type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} dir="ltr" placeholder="name@example.com" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required /></div>
                              </div>
                            )}
                          </div>
                          
                          <button type="submit" disabled={isAuthenticating || resendTimer>0} className={`w-full py-4 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md mt-6 ${resendTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2C2C2C] hover:bg-[#C5A059]'}`}>
                            {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : <KeyRound size={20}/>} 
                            {resendTimer > 0 ? (isRTL ? `انتظر ${resendTimer} ثانية للمحاولة` : `Wait ${resendTimer}s`) : (isRTL ? 'إرسال رمز التحقق' : 'Send OTP')}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right">
                          <div className="text-center mb-6">
                            <h3 className="font-bold text-xl text-[#2C2C2C]">{isRTL ? 'أدخل رمز التحقق' : 'Enter OTP Code'}</h3>
                            <p className="text-sm text-gray-500 mt-2">{isRTL ? `أرسلنا الرمز المكون من 4 أرقام إلى ` : `A 4-digit code was sent to `} <b className="text-[#C5A059]" dir="ltr">{activeContactForOTP}</b></p>
                          </div>
                          <input type="text" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="----" maxLength={4} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-center text-4xl tracking-[1em] font-bold" required />
                          <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center gap-2 transition-colors shadow-md">
                            {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} {isRTL ? 'تأكيد الدخول' : 'Verify & Login'}
                          </button>
                          <button type="button" onClick={() => setAuthStep('details')} className="w-full text-sm font-bold text-gray-400 hover:text-[#C5A059] transition-colors underline">{isRTL ? 'تعديل البيانات' : 'Edit Details'}</button>
                        </form>
                      )}
                    </div>
                  ) : (
                    // 2. شاشة حجز الموعد الفعلي للمستخدمين المسجلين
                    <form className="space-y-6 animate-in fade-in" onSubmit={executeBooking}>
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-[#C5A059] text-white rounded-full flex items-center justify-center font-bold text-xl shadow-inner">{user.full_name?.charAt(0) || 'U'}</div>
                          <div>
                            <p className="font-bold text-[#2C2C2C] text-sm">{user.full_name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5" dir="ltr">{user.phone || user.email}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setUser(null)} className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100">{isRTL ? 'تسجيل خروج' : 'Logout'}</button>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'نوع الخدمة المطلوبة' : 'Service Type'}</label>
                        <select value={bookingData.service} onChange={e=>setBookingData({...bookingData, service: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white cursor-pointer font-bold text-gray-700">
                          <option>{isRTL ? 'استشارة تصميم داخلي' : 'Interior Design Consultation'}</option>
                          <option>{isRTL ? 'استفسار مبيعات وتفصيل' : 'Sales & Custom Furniture'}</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'تاريخ الموعد' : 'Date'}</label>
                          <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingData.date} onChange={e=>setBookingData({...bookingData, date: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white cursor-pointer font-bold text-gray-700" required/>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الوقت المناسب' : 'Time Slot'}</label>
                          <select value={bookingData.time} onChange={e=>setBookingData({...bookingData, time: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white cursor-pointer font-bold disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700" disabled={!bookingData.date} required>
                            <option value="" disabled>{!bookingData.date ? (isRTL ? 'اختر التاريخ أولاً' : 'Select date first') : (isRTL ? 'اختر الوقت...' : 'Select time...')}</option>
                            {availableSlots.map(s => <option key={s} value={s}>{parseInt(s) > 12 ? `${parseInt(s) - 12}:00 PM` : parseInt(s) === 12 ? '12:00 PM' : `${s} AM`}</option>)}
                          </select>
                        </div>
                      </div>

                      <button type="submit" disabled={isBooking} className="w-full py-5 bg-[#2C2C2C] text-white font-bold rounded-2xl hover:bg-[#C5A059] transition-all shadow-xl flex justify-center items-center gap-3 mt-8 disabled:opacity-70 group">
                        {isBooking ? <Loader2 className="animate-spin" size={24}/> : <CalendarCheck size={24} className="group-hover:scale-110 transition-transform" />} 
                        {isRTL ? 'تأكيد الحجز الآن' : 'Confirm Booking Now'}
                      </button>
                    </form>
                  )
                )}

                {/* نموذج المراسلة العادية */}
                {activeTab === 'message' && (
                  <form className="space-y-6 animate-in fade-in" onSubmit={(e) => { e.preventDefault(); alert('سيتم تفعيل الإرسال في المرحلة القادمة!'); }}>
                     <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">{isRTL ? 'يسعدنا تواصلك' : 'We love to hear from you'}</h3>
                      <p className="text-gray-500">{isRTL ? 'اترك لنا رسالة وسنقوم بالرد عليك في أقرب وقت.' : 'Leave us a message and we will get back to you.'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم' : 'Name'}</label><input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required /></div>
                      <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label><input type="email" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" dir="ltr" required /></div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الرسالة' : 'Message'}</label><textarea rows={5} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 resize-none" required></textarea></div>
                    <button className="w-full py-4 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] transition-colors shadow-lg flex justify-center items-center gap-2">
                      <Send size={20} /> {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};