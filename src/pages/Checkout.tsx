import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { CheckCircle, MapPin, CreditCard, ShoppingBag, ArrowRight, ArrowLeft, Loader2, Plus, Server, Truck, Smartphone, KeyRound, Mail, User as UserIcon } from 'lucide-react';

// عنوان سيرفر Contabo الخاص بك
const NOTIFICATION_API = 'http://167.86.73.97:8080/send';

export const Checkout = () => {
  const navigate = useNavigate();
  const { language, cart, user, setUser, products, addToCart, clearCart } = useStore();
  const isRTL = language === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'tabby' | 'tamara'>('card');

  // ==========================================
  // 🌟 نظام تسجيل الدخول المدمج (Real OTP)
  // ==========================================
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [authStep, setAuthStep] = useState<'details' | 'otp'>('details');
  
  const [contactVal, setContactVal] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // حفظ الرمز الحقيقي هنا
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // دالة تنسيق رقم الجوال ليقبله الواتساب (تحويل 05 إلى 9665)
  const formatPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  // 1️⃣ إرسال الرمز الحقيقي عبر سيرفرك
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactVal) return;
    if (authMode === 'register' && !fullName) {
      alert(isRTL ? 'يرجى إدخال الاسم الكريم' : 'Please enter your full name');
      return;
    }

    setIsAuthenticating(true);
    
    // إنشاء رمز OTP عشوائي من 4 أرقام
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);

    try {
      const payload: any = {};
      
      if (authMethod === 'phone') {
        payload.phone = formatPhoneForWhatsApp(contactVal);
        payload.message = isRTL 
          ? `مرحباً بك في نسيج 🛋️\n\nرمز التحقق الخاص بك هو: *${newOtp}*\n\nلا تشارك هذا الرمز مع أحد.` 
          : `Welcome to Naseej 🛋️\n\nYour OTP code is: *${newOtp}*\n\nDo not share this code.`;
      } else {
        payload.email = contactVal;
        payload.subject = isRTL ? 'رمز التحقق - نسيج' : 'OTP Verification - Naseej';
        payload.html = `
          <div style="text-align: center; padding: 20px; font-family: Tahoma;">
            <h2>${isRTL ? 'مرحباً بك في نسيج' : 'Welcome to Naseej'}</h2>
            <p>${isRTL ? 'رمز التحقق الخاص بك هو:' : 'Your OTP code is:'}</p>
            <h1 style="color: #C5A059; letter-spacing: 5px; font-size: 32px;">${newOtp}</h1>
          </div>
        `;
      }

      // إرسال الطلب إلى سيرفر Contabo
      const response = await fetch(NOTIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to send message via Server');

      setAuthStep('otp'); // الانتقال لشاشة إدخال الرمز
    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ في الإرسال. تأكد من صحة البيانات أو عمل السيرفر.' : 'Failed to send OTP. Please check your connection.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2️⃣ التحقق من الرمز المدخل
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setIsAuthenticating(true);
    
    // مطابقة الرمز المدخل مع الرمز المولد حقيقياً
    if (otp === generatedOtp) {
      setIsAuthenticating(false);
      setUser({
        id: 'user-' + Math.floor(Math.random() * 10000),
        full_name: authMode === 'register' ? fullName : (isRTL ? 'عميل نسيج العائد' : 'Returning Customer'),
        phone: authMethod === 'phone' ? contactVal : '',
        email: authMethod === 'email' ? contactVal : '',
        role: 'customer'
      });
    } else {
      setIsAuthenticating(false);
      alert(isRTL ? 'رمز التحقق غير صحيح، حاول مجدداً.' : 'Invalid OTP code. Please try again.');
    }
  };

  // ==========================================
  // 🌟 إرسال الطلب وإشعارات الشراء (Real Notifications)
  // ==========================================
  const subtotal = cart.reduce((total, item) => total + ((item.discount_price || item.base_price) * (item.quantity || 1)), 0);
  const shipping = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shipping;
  const installmentAmount = (total / 4).toFixed(2); 

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      alert(isRTL ? 'يرجى إدخال عنوان التوصيل.' : 'Please enter your shipping address.');
      return;
    }

    setIsSubmitting(true);
    const newOrderId = `NSJ-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newOrderId);

    try {
      // تجهيز رسالة الفاتورة
      const invoiceText = isRTL 
        ? `🎉 شكراً لتسوقك من نسيج يا ${user?.full_name}!\n\n📦 *رقم الطلب:* #${newOrderId}\n💰 *الإجمالي:* ${total} ر.س\n💳 *طريقة الدفع:* ${paymentMethod.toUpperCase()}\n\nجاري تجهيز طلبك وسيتم التواصل معك قريباً.`
        : `🎉 Thank you for shopping with Naseej, ${user?.full_name}!\n\n📦 *Order ID:* #${newOrderId}\n💰 *Total:* ${total} SAR\n💳 *Payment Method:* ${paymentMethod.toUpperCase()}\n\nYour order is being processed.`;

      const payload: any = {};
      if (user?.phone) {
        payload.phone = formatPhoneForWhatsApp(user.phone);
        payload.message = invoiceText;
      } else if (user?.email) {
        payload.email = user.email;
        payload.subject = isRTL ? `تأكيد الطلب #${newOrderId} - نسيج` : `Order Confirmation #${newOrderId} - Naseej`;
        payload.html = `
          <div dir="${isRTL ? 'rtl' : 'ltr'}" style="text-align: start; padding: 20px; font-family: Tahoma;">
            <h2 style="color: #C5A059;">${isRTL ? 'تم تأكيد طلبك!' : 'Order Confirmed!'}</h2>
            <p>${invoiceText.replace(/\n/g, '<br>')}</p>
          </div>
        `;
      }

      // إرسال الإشعار عبر السيرفر
      await fetch(NOTIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // إتمام العملية بنجاح وتفريغ السلة
      setIsSubmitting(false);
      setIsSuccess(true);
      clearCart();

    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ أثناء معالجة الطلب.' : 'Error processing order.');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (cart.length === 0 && !isSuccess) navigate('/shop');
    window.scrollTo(0, 0);
  }, [cart.length, isSuccess, navigate]);

  const relatedProducts = products.filter(p => !cart.some(c => c.id === p.id)).slice(0, 3);

  // ==========================================
  // 🌟 شاشة الشكر
  // ==========================================
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/50 py-20 px-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle size={48} /></div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] mb-4">{isRTL ? 'شكراً لتسوقك معنا!' : 'Thank you for your order!'}</h1>
          <p className="text-gray-500 mb-2">{isRTL ? 'تم استلام طلبك بنجاح، وجاري تجهيزه.' : 'Your order has been received and is being processed.'}</p>
          <p className="text-sm font-bold text-[#C5A059] mb-8">{isRTL ? 'تم إرسال الفاتورة إلى بريدك الإلكتروني والواتساب.' : 'Invoice sent to your Email & WhatsApp.'}</p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-start border border-gray-100">
            <div className="flex justify-between items-center mb-2"><span className="text-gray-500 text-sm">{isRTL ? 'رقم الطلب:' : 'Order ID:'}</span><span className="font-bold text-[#2C2C2C]">#{orderId}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500 text-sm">{isRTL ? 'طريقة الدفع:' : 'Payment:'}</span><span className="font-bold text-[#2C2C2C] uppercase">{paymentMethod}</span></div>
            <div className="flex justify-between items-center mt-2 border-t border-gray-200 pt-2"><span className="text-gray-500 text-sm">{isRTL ? 'الإجمالي:' : 'Total:'}</span><span className="font-bold text-[#2C2C2C]">{total.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span></div>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-[#2C2C2C] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#C5A059] transition-colors shadow-md">
            <ShoppingBag size={20} /> {isRTL ? 'مواصلة التسوق' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-10 flex items-center gap-3">
          <CreditCard className="text-[#C5A059]" size={36}/> {isRTL ? 'إتمام الطلب' : 'Checkout'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            
            {!user ? (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center gap-2">
                  <UserIcon className="text-[#C5A059]" size={28}/> 
                  {isRTL ? 'تسجيل الدخول / إنشاء حساب' : 'Login / Register'}
                </h2>
                
                {authStep === 'details' ? (
                  <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-200">
                      <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'login' ? 'bg-white text-[#2C2C2C] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>
                        {isRTL ? 'تسجيل دخول (عائد)' : 'Login (Returning)'}
                      </button>
                      <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-colors ${authMode === 'register' ? 'bg-white text-[#2C2C2C] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-700'}`}>
                        {isRTL ? 'حساب جديد' : 'New Account'}
                      </button>
                    </div>

                    <div className="flex gap-4">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${authMethod === 'phone' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="method" checked={authMethod === 'phone'} onChange={() => setAuthMethod('phone')} className="hidden" />
                        <Smartphone size={20} className={authMethod === 'phone' ? 'text-[#C5A059]' : 'text-gray-400'} />
                        <span className={`font-bold ${authMethod === 'phone' ? 'text-[#C5A059]' : 'text-gray-500'}`}>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-colors ${authMethod === 'email' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="method" checked={authMethod === 'email'} onChange={() => setAuthMethod('email')} className="hidden" />
                        <Mail size={20} className={authMethod === 'email' ? 'text-[#C5A059]' : 'text-gray-400'} />
                        <span className={`font-bold ${authMethod === 'email' ? 'text-[#C5A059]' : 'text-gray-500'}`}>{isRTL ? 'إيميل' : 'Email'}</span>
                      </label>
                    </div>

                    {authMode === 'register' && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        {authMethod === 'phone' ? (isRTL ? 'رقم الجوال' : 'Phone Number') : (isRTL ? 'البريد الإلكتروني' : 'Email Address')}
                      </label>
                      <input type={authMethod === 'phone' ? 'tel' : 'email'} value={contactVal} onChange={e => setContactVal(e.target.value)} dir="ltr" placeholder={authMethod === 'phone' ? '05XXXXXXXX' : 'name@example.com'} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-end font-mono" required />
                    </div>

                    <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-[#C5A059] transition-colors flex justify-center items-center gap-2 shadow-md">
                      {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : (isRTL ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>)} 
                      {isRTL ? 'إرسال رمز التحقق' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100"><KeyRound size={28} className="text-[#C5A059]"/></div>
                      <h3 className="font-bold text-xl text-[#2C2C2C]">{isRTL ? 'أدخل رمز التحقق' : 'Enter OTP Code'}</h3>
                      <p className="text-sm text-gray-500 mt-2">{isRTL ? `أرسلنا الرمز المكون من 4 أرقام إلى ` : `A 4-digit code was sent to `} <b className="text-[#C5A059]" dir="ltr">{contactVal}</b></p>
                    </div>
                    <div>
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="----" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-center text-4xl tracking-[1em] font-bold" maxLength={4} required />
                    </div>
                    <button type="submit" disabled={isAuthenticating} className="w-full py-4 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] transition-colors flex justify-center items-center gap-2 shadow-md">
                      {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} {isRTL ? 'تأكيد الدخول' : 'Verify & Login'}
                    </button>
                    <button type="button" onClick={() => setAuthStep('details')} className="w-full text-sm font-bold text-gray-400 hover:text-[#C5A059] transition-colors underline">{isRTL ? 'تعديل البيانات' : 'Edit Details'}</button>
                  </form>
                )}
              </div>
            ) : (
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-[#2C2C2C] flex items-center gap-2"><CheckCircle className="text-green-500" size={24}/> {isRTL ? 'تم التحقق من بياناتك' : 'Verified Details'}</h2>
                  <button type="button" onClick={() => setUser(null)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">{isRTL ? 'تسجيل خروج' : 'Logout'}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label><input type="text" value={user.full_name || ''} disabled className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-bold" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'معلومات التواصل' : 'Contact Info'}</label><input type="text" value={user.phone || user.email || ''} disabled dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-end font-mono" /></div>
                </div>

                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4"><MapPin className="text-[#C5A059]" size={24}/> {isRTL ? 'عنوان التوصيل' : 'Shipping Address'}</h2>
                <div className="mb-8"><textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder={isRTL ? 'المدينة، الحي، اسم الشارع، رقم المبنى...' : 'City, District, Street name, Building no...'} rows={3} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white resize-none"></textarea></div>

                <h2 className="text-xl font-bold text-[#2C2C2C] mb-6 flex items-center gap-2 border-b border-gray-100 pb-4"><CreditCard className="text-[#C5A059]" size={24}/> {isRTL ? 'طريقة الدفع' : 'Payment Method'}</h2>
                <div className="space-y-4 mb-4">
                  <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}><div className="flex items-center gap-3"><input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 accent-[#C5A059]" /><span className="font-bold text-[#2C2C2C]">{isRTL ? 'البطاقة الائتمانية / مدى' : 'Credit Card / Mada'}</span></div><div className="flex gap-2"><div className="w-10 h-6 bg-white rounded shadow-sm flex items-center justify-center text-[10px] font-bold text-blue-900 border border-gray-200">VISA</div><div className="w-10 h-6 bg-white rounded shadow-sm flex items-center justify-center text-[10px] font-bold text-red-600 border border-gray-200">MADA</div></div></label>
                  <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'tabby' ? 'border-[#3EE2B1] bg-[#3EE2B1]/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}><div className="flex items-center gap-3"><input type="radio" name="payment" checked={paymentMethod === 'tabby'} onChange={() => setPaymentMethod('tabby')} className="w-5 h-5 accent-[#3EE2B1]" /><div><span className="font-bold text-[#2C2C2C] block">{isRTL ? 'قسمها على 4 دفعات بدون فوائد' : 'Split in 4 interest-free payments'}</span><span className="text-xs text-gray-500 font-bold">{installmentAmount} {isRTL ? 'ر.س / شهر' : 'SAR / month'}</span></div></div><div className="px-3 py-1 bg-[#3EE2B1] text-black rounded font-black text-sm tracking-widest shadow-sm">tabby</div></label>
                  <label className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'tamara' ? 'border-[#FFB2A6] bg-[#FFB2A6]/10' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}><div className="flex items-center gap-3"><input type="radio" name="payment" checked={paymentMethod === 'tamara'} onChange={() => setPaymentMethod('tamara')} className="w-5 h-5 accent-[#FF9885]" /><div><span className="font-bold text-[#2C2C2C] block">{isRTL ? 'قسطها على 4 دفعات بدون رسوم' : 'Pay in 4 without fees'}</span><span className="text-xs text-gray-500 font-bold">{installmentAmount} {isRTL ? 'ر.س / شهر' : 'SAR / month'}</span></div></div><div className="px-3 py-1 bg-[#FFB2A6] text-[#2C2C2C] rounded font-black text-sm tracking-wide shadow-sm">tamara</div></label>
                </div>
              </form>
            )}

            {user && relatedProducts.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in">
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'منتجات قد تعجبك (أضفها لطلبك الآن)' : 'Frequently bought together'}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedProducts.map(rp => (
                    <div key={rp.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center group hover:border-[#C5A059] transition-colors cursor-pointer">
                      <img src={rp.image_lifestyle} alt={isRTL ? rp.title_ar : rp.title_en} className="w-20 h-20 object-cover rounded-xl mb-3" />
                      <h4 className="font-bold text-[#2C2C2C] text-sm mb-1 line-clamp-1">{isRTL ? rp.title_ar : rp.title_en}</h4>
                      <span className="text-[#C5A059] font-bold text-sm mb-3">{rp.discount_price || rp.base_price} {isRTL ? 'ر.س' : 'SAR'}</span>
                      <button onClick={() => addToCart(rp, 1)} className="mt-auto w-full py-2 bg-gray-50 text-gray-700 font-bold rounded-lg group-hover:bg-[#2C2C2C] group-hover:text-white transition-colors flex justify-center items-center gap-1 text-sm"><Plus size={16}/> {isRTL ? 'أضف' : 'Add'}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* الجانب الأيسر: ملخص الطلب والتأكيد */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6">{isRTL ? 'ملخص الطلب' : 'Order Summary'}</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <img src={item.image_lifestyle} alt="img" className="w-16 h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"/>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#2C2C2C] text-sm line-clamp-1">{isRTL ? item.title_ar : item.title_en}</h4>
                      <p className="text-gray-500 text-sm">{isRTL ? 'الكمية:' : 'Qty:'} {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#C5A059] whitespace-nowrap">{(item.discount_price || item.base_price) * (item.quantity || 1)} {isRTL ? 'ر.س' : 'SAR'}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4 mb-8">
                <div className="flex justify-between text-gray-600 font-medium"><span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span><span>{subtotal.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span></div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>{isRTL ? 'تكلفة الشحن' : 'Shipping'}</span>
                  {shipping === 0 ? <span className="text-green-500 font-bold">{isRTL ? 'مجاني' : 'Free'}</span> : <span>{shipping} {isRTL ? 'ر.س' : 'SAR'}</span>}
                </div>
                <div className="flex justify-between text-2xl font-bold text-[#2C2C2C] border-t border-gray-100 pt-4"><span>{isRTL ? 'الإجمالي' : 'Total'}</span><span>{total.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span></div>
              </div>

              <button 
                form="checkout-form"
                type="submit"
                disabled={isSubmitting || !user}
                className="w-full py-5 bg-[#2C2C2C] text-white font-bold text-lg rounded-2xl hover:bg-[#C5A059] transition-all shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                {!user ? (
                   <span className="relative z-10">{isRTL ? 'أكمل تسجيل الدخول أولاً' : 'Complete login first'}</span>
                ) : isSubmitting ? (
                  <span className="relative z-10 flex items-center gap-2"><Loader2 className="animate-spin" size={24} /> {isRTL ? 'جاري معالجة الطلب...' : 'Processing...'}</span>
                ) : (
                  <span className="relative z-10 flex items-center gap-2">{isRTL ? 'تأكيد ودفع' : 'Confirm & Pay'} {isRTL ? <ArrowLeft className="group-hover:-translate-x-1 transition-transform"/> : <ArrowRight className="group-hover:translate-x-1 transition-transform"/>}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};