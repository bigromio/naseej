import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Smartphone, Mail, KeyRound, Loader2, ArrowRight, ArrowLeft, CheckCircle, User as UserIcon } from 'lucide-react';

const NOTIFICATION_API = 'http://167.86.73.97:8080/send';

export const Auth = () => {
  const navigate = useNavigate();
  const { language, user, setUser } = useStore();
  const isRTL = language === 'ar';

  useEffect(() => {
    if (user) {
      navigate(user.role === 'customer' ? '/dashboard' : '/admin');
    }
  }, [user, navigate]);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authStep, setAuthStep] = useState<'details' | 'otp'>('details');
  const [resendTimer, setResendTimer] = useState(0);

  // 🌟 حالات البيانات الجديدة للتحقق الذكي الموحد 🌟
  const [loginVal, setLoginVal] = useState(''); // لتسجيل الدخول (يقبل رقم أو إيميل)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [activeContactForOTP, setActiveContactForOTP] = useState(''); // لحفظ المفتاح الذي سيتم التحقق منه في قاعدة البيانات

  const [otp, setOtp] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
    return cleanPhone;
  };

  // 1️⃣ إرسال الرمز الحقيقي وحفظه في قاعدة البيانات
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resendTimer > 0) return;

    let targetPhone = '';
    let targetEmail = '';
    let dbContactKey = '';

    // 🌟 التحقق وتوزيع البيانات حسب وضع التسجيل 🌟
    if (authMode === 'login') {
      if (!loginVal) return alert(isRTL ? 'يرجى إدخال الجوال أو الإيميل' : 'Enter phone or email');
      if (loginVal.includes('@')) {
        targetEmail = loginVal;
        dbContactKey = loginVal;
      } else {
        targetPhone = loginVal;
        dbContactKey = loginVal;
      }
    } else {
      if (!regFullName || !regPhone || !regEmail) {
        return alert(isRTL ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
      }
      targetPhone = regPhone;
      targetEmail = regEmail;
      dbContactKey = regPhone; // نستخدم رقم الجوال كمفتاح أساسي للتحقق في الداتا بيز
    }

    setIsAuthenticating(true);
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const { error: dbError } = await supabase.from('otp_verifications').upsert({
        contact_val: dbContactKey,
        code: newOtp,
        expires_at: new Date(Date.now() + 10 * 60000).toISOString()
      }, { onConflict: 'contact_val' });

      if (dbError) throw dbError;

      // 🌟 تجهيز رسالة موحدة للسيرفر (سيرسل للواتساب والإيميل معاً إذا توفرا) 🌟
      const payload: any = { brand: 'naseej' };
      
      if (targetPhone) {
        payload.phone = formatPhoneForWhatsApp(targetPhone);
        payload.message = isRTL 
          ? `مرحباً بك في نسيج 🛋️\n\nرمز التحقق الخاص بك هو: *${newOtp}*\n\nلا تشارك هذا الرمز مع أحد.` 
          : `Welcome to Naseej 🛋️\n\nYour OTP is: *${newOtp}*`;
      }
      if (targetEmail) {
        payload.email = targetEmail;
        payload.subject = isRTL ? 'رمز التحقق - نسيج' : 'OTP - Naseej';
        payload.html = `<div style="text-align:center; padding:20px; font-family:Tahoma;"><h2>${isRTL ? 'رمز التحقق الخاص بك:' : 'Your OTP code:'}</h2><h1 style="color:#C5A059; letter-spacing:5px;">${newOtp}</h1></div>`;
      }

      const response = await fetch(NOTIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed');
      
      setActiveContactForOTP(dbContactKey); // حفظ المرجع لخطوة التحقق
      setResendTimer(60);
      setAuthStep('otp');
    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ في إرسال الرمز. تأكد من اتصال السيرفر.' : 'Error sending OTP.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2️⃣ التحقق من الرمز من قاعدة البيانات بدقة عالية
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsAuthenticating(true);
    
    try {
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('contact_val', activeContactForOTP)
        .eq('code', otp)
        .single();

      if (otpError || !otpData) {
        setIsAuthenticating(false);
        return alert(isRTL ? 'رمز التحقق غير صحيح!' : 'Invalid OTP code!');
      }

      if (new Date() > new Date(otpData.expires_at)) {
        setIsAuthenticating(false);
        return alert(isRTL ? 'انتهت صلاحية الرمز، يرجى طلب رمز جديد.' : 'OTP expired, please request a new one.');
      }

      await supabase.from('otp_verifications').delete().eq('contact_val', activeContactForOTP);

      let finalUser = null;
      
      if (authMode === 'login') {
        // بحث عن المستخدم العائد بناءً على الإيميل أو الجوال
        const searchColumn = activeContactForOTP.includes('@') ? 'email' : 'phone';
        const { data: existingUser } = await supabase.from('users').select('*').eq(searchColumn, activeContactForOTP).single();
        
        if (existingUser) {
          finalUser = existingUser;
        } else {
          const newUser = { full_name: regFullName || (isRTL ? 'عميل نسيج' : 'Naseej Customer'), phone: regPhone || activeContactForOTP, email: regEmail || activeContactForOTP, role: 'customer' };
          const { data: insertedUser, error } = await supabase.from('users').insert([newUser]).select().single();
          if (error) throw error;
          finalUser = insertedUser;

          // 🌟 إطلاق إشعار الترحيب للعملاء الجدد 🌟
          import('@/lib/automations').then(({ triggerAutomation }) => {
            triggerAutomation({
              eventName: 'welcome_msg',
              brand: 'naseej',
              userParams: { phone: finalUser.phone, email: finalUser.email, language: isRTL ? 'ar' : 'en' },
              variables: { customer_name: finalUser.full_name }
            });
          });
        }
      } else {
        // 🌟 حساب جديد متكامل البيانات 🌟
        const { data: existingUserCheck } = await supabase.from('users').select('*').eq('phone', regPhone).maybeSingle();
        if (existingUserCheck) {
          finalUser = existingUserCheck; // إذا كان مسجلاً مسبقاً نعيده
        } else {
          const newUser = { full_name: regFullName, phone: regPhone, email: regEmail, role: 'customer' };
          const { data: insertedUser, error } = await supabase.from('users').insert([newUser]).select().single();
          if (error) throw error;
          finalUser = insertedUser;
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C5A059]/10 text-[#C5A059] rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
            <UserIcon size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#2C2C2C]">{isRTL ? 'مرحباً بك في نسيج' : 'Welcome to Naseej'}</h1>
          <p className="text-gray-500 text-sm mt-2">{isRTL ? 'سجل دخولك لمتابعة طلباتك بسهولة' : 'Login to track your orders easily'}</p>
        </div>

        {authStep === 'details' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-200">
              <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'login' ? 'bg-white text-[#2C2C2C] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>{isRTL ? 'تسجيل دخول' : 'Login'}</button>
              <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'register' ? 'bg-white text-[#2C2C2C] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>{isRTL ? 'حساب جديد' : 'Register'}</button>
            </div>

            <div className="animate-in fade-in space-y-4">
              {authMode === 'login' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الجوال أو البريد الإلكتروني' : 'Phone or Email'}</label>
                  <input type="text" value={loginVal} onChange={e => setLoginVal(e.target.value)} dir="ltr" placeholder="05XXXXXXXX / name@email.com" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} placeholder={isRTL ? 'محمد عبدالله' : 'Mohammed Abdullah'} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الواتساب' : 'WhatsApp Number'}</label>
                    <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} dir="ltr" placeholder="05XXXXXXXX" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} dir="ltr" placeholder="name@example.com" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required />
                  </div>
                </div>
              )}
            </div>

            <button type="button" disabled={resendTimer > 0 || isAuthenticating} onClick={handleSendOTP} className={`w-full py-4 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md ${resendTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2C2C2C] hover:bg-[#C5A059]'}`}>
              {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : (isRTL ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>)} 
              {resendTimer > 0 ? (isRTL ? `انتظر ${resendTimer} ثانية للمحاولة` : `Wait ${resendTimer}s`) : (isRTL ? 'إرسال رمز التحقق' : 'Send OTP Code')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right">
            <div className="text-center mb-6">
              <KeyRound size={40} className="text-[#C5A059] mx-auto mb-4"/>
              <p className="text-sm text-gray-500">{isRTL ? `أرسلنا الرمز المكون من 4 أرقام إليك، يرجى التحقق.` : `A 4-digit code was sent to you.`}</p>
            </div>
            <div>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="----" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-center text-4xl tracking-[1em] font-bold" maxLength={4} required />
            </div>
            <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center gap-2">
              {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} {isRTL ? 'تأكيد الدخول' : 'Verify & Login'}
            </button>
            <button type="button" onClick={() => setAuthStep('details')} className="w-full text-sm font-bold text-gray-400 hover:text-[#C5A059] underline">{isRTL ? 'تعديل البيانات' : 'Edit Details'}</button>
          </form>
        )}
      </div>
    </div>
  );
};