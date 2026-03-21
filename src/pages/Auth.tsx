import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Mail, Phone, User, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

export const Auth = () => {
  const { language } = useStore();
  
  // حالات الصفحة
  const [isLogin, setIsLogin] = useState(true); // true = تسجيل دخول, false = حساب جديد
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'form' | 'otp'>('form'); // form = إدخال البيانات, otp = إدخال الرمز
  const [isLoading, setIsLoading] = useState(false);
  
  // بيانات النموذج
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    otp: ''
  });

  // نصوص الترجمة المدمجة
  const text = {
    ar: {
      loginTab: 'تسجيل الدخول',
      registerTab: 'حساب جديد',
      welcomeLogin: 'مرحباً بعودتك إلى نسيج',
      welcomeRegister: 'انضم إلى عالم نسيج الفاخر',
      phoneMethod: 'رقم الجوال',
      emailMethod: 'البريد الإلكتروني',
      nameTitle: 'الاسم الكامل',
      phoneTitle: 'رقم الجوال (للواتساب)',
      emailTitle: 'البريد الإلكتروني',
      sendOtp: 'إرسال رمز التحقق',
      enterOtpTitle: 'أدخل رمز التحقق',
      otpSentTo: 'تم إرسال رمز OTP إلى',
      verifyBtn: 'تأكيد الدخول',
      resend: 'لم يصلك الرمز؟ إعادة إرسال',
      back: 'تعديل البيانات'
    },
    en: {
      loginTab: 'Login',
      registerTab: 'Register',
      welcomeLogin: 'Welcome back to Naseej',
      welcomeRegister: 'Join Naseej Luxury World',
      phoneMethod: 'Phone Number',
      emailMethod: 'Email Address',
      nameTitle: 'Full Name',
      phoneTitle: 'WhatsApp Number',
      emailTitle: 'Email Address',
      sendOtp: 'Send Verification Code',
      enterOtpTitle: 'Enter OTP Code',
      otpSentTo: 'Code has been sent to',
      verifyBtn: 'Verify & Login',
      resend: 'Didn\'t receive code? Resend',
      back: 'Edit Details'
    }
  };

  const t = text[language as keyof typeof text];
  const isRTL = language === 'ar';

  // --- دوال الاتصال بالسيرفر (Contabo Placeholder) ---

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: سيتم استبدال هذا برابط سيرفر Contabo الحقيقي لاحقاً
    const CONTABO_API_URL = 'http://192.168.1.100:3001/api/auth/send-otp';
    
    console.log(`[Mock API] Sending request to: ${CONTABO_API_URL}`);
    console.log(`[Mock API] Payload:`, {
      type: isLogin ? 'login' : 'register',
      method: isLogin ? loginMethod : 'both',
      data: formData
    });

    // محاكاة تأخير السيرفر (1.5 ثانية) ثم الانتقال لشاشة الرمز
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: سيتم ربط هذا مع Supabase للتحقق وإنشاء جلسة المستخدم
    const SUPABASE_VERIFY_URL = 'http://192.168.1.100:3001/api/auth/verify';
    console.log(`[Mock API] Verifying OTP: ${formData.otp} at ${SUPABASE_VERIFY_URL}`);

    setTimeout(() => {
      setIsLoading(false);
      alert(language === 'ar' ? 'تم الدخول بنجاح! سيتم توجيهك...' : 'Logged in successfully! Redirecting...');
      // سيتم إضافة التوجيه لاحقاً: navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
        
        {/* شريط زينة علوي */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8C7A9E] via-[#C5A059] to-[#8C7A9E]"></div>

        {step === 'form' ? (
          <>
            {/* تبويبات الدخول / التسجيل */}
            <div className="flex bg-gray-50 rounded-lg p-1 mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${isLogin ? 'bg-white text-[#2C2C2C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.loginTab}
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isLogin ? 'bg-white text-[#2C2C2C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.registerTab}
              </button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                {isLogin ? t.welcomeLogin : t.welcomeRegister}
              </h2>
            </div>

            <form onSubmit={handleRequestOTP} className="space-y-5">
              
              {/* حقول التسجيل الجديد */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t.nameTitle}</label>
                  <div className="relative">
                    <User className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
                    <input 
                      type="text" required
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-all`}
                    />
                  </div>
                </div>
              )}

              {/* أزرار اختيار طريقة الدخول (تظهر في حالة الدخول فقط) */}
              {isLogin && (
                <div className="flex gap-4 mb-4">
                  <button type="button" onClick={() => setLoginMethod('phone')} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-bold transition-all ${loginMethod === 'phone' ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Phone size={16} /> {t.phoneMethod}
                  </button>
                  <button type="button" onClick={() => setLoginMethod('email')} className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg text-sm font-bold transition-all ${loginMethod === 'email' ? 'border-[#C5A059] text-[#C5A059] bg-[#C5A059]/5' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Mail size={16} /> {t.emailMethod}
                  </button>
                </div>
              )}

              {/* حقل الجوال */}
              {(!isLogin || loginMethod === 'phone') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t.phoneTitle}</label>
                  <div className="relative flex" dir="ltr">
                    <span className="flex items-center justify-center px-3 border border-r-0 border-gray-200 bg-gray-100 text-gray-600 rounded-l-lg font-bold">
                      +966
                    </span>
                    <input 
                      type="tel" required placeholder="5X XXX XXXX"
                      value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-r-lg outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* حقل الإيميل */}
              {(!isLogin || loginMethod === 'email') && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t.emailTitle}</label>
                  <div className="relative">
                    <Mail className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
                    <input 
                      type="email" required dir="ltr"
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className={`w-full p-3 ${isRTL ? 'pr-10 text-right' : 'pl-10 text-left'} border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-all`}
                    />
                  </div>
                </div>
              )}

              <button disabled={isLoading} type="submit" className="w-full py-3 mt-4 bg-[#2C2C2C] text-white rounded-lg font-bold hover:bg-black transition-colors flex justify-center items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{t.sendOtp} <ShieldCheck size={20} /></>}
              </button>
            </form>
          </>
        ) : (
          
          /* شاشة إدخال الرمز OTP */
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-[#C5A059]/10 text-[#C5A059] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">{t.enterOtpTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">
              {t.otpSentTo} <br/> 
              <strong className="text-black" dir="ltr">
                {loginMethod === 'phone' ? `+966 ${formData.phone}` : formData.email}
              </strong>
            </p>

            <form onSubmit={handleVerifyOTP}>
              <input 
                type="text" required maxLength={4} placeholder="• • • •" dir="ltr"
                value={formData.otp} onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/\D/g, '')})}
                className="w-full text-center text-3xl tracking-[1em] p-4 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] bg-gray-50 focus:bg-white transition-all mb-6"
              />
              
              <button disabled={isLoading || formData.otp.length < 4} type="submit" className="w-full py-3 bg-[#2C2C2C] text-white rounded-lg font-bold hover:bg-black transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : t.verifyBtn}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3">
              <button className="text-sm font-bold text-[#C5A059] hover:underline">
                {t.resend}
              </button>
              <button onClick={() => setStep('form')} className="text-sm text-gray-500 hover:text-black flex justify-center items-center gap-1">
                {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t.back}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};