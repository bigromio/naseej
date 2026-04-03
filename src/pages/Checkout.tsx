import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase'; // 👈 استدعاء قاعدة البيانات
import { CheckCircle, MapPin, CreditCard, ShoppingBag, ArrowRight, ArrowLeft, Loader2, Plus, Server, Truck, Smartphone, KeyRound, Mail, User as UserIcon } from 'lucide-react';
import { triggerAutomation } from '@/lib/automations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// عنوان سيرفر Contabo الخاص بك
const NOTIFICATION_API = 'http://167.86.73.97:8080/send';

export const Checkout = () => {
  const navigate = useNavigate();
  const { language, cart, user, setUser, products, addToCart, clearCart } = useStore();
  const isRTL = language === 'ar';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [finalTotal, setFinalTotal] = useState(0); // 👈 متغير جديد لحفظ الإجمالي الحقيقي لصفحة الشكر
  
  const [address, setAddress] = useState(user?.address || '');
  const [isLocating, setIsLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'tabby' | 'tamara'>('card');

  // جلب العنوان المحفوظ فور تسجيل الدخول
  useEffect(() => { if (user?.address) setAddress(user.address); }, [user]);

  // 🌟 نظام تحديد الموقع الجغرافي (GPS) 🌟
  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert(isRTL ? 'خدمة الموقع غير مدعومة في متصفحك' : 'Geolocation is not supported');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=${isRTL ? 'ar' : 'en'}`);
        const data = await res.json();
        setAddress(data.display_name || `${pos.coords.latitude}, ${pos.coords.longitude}`);
      } catch (e) {
        setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
      }
      setIsLocating(false);
    }, () => {
      alert(isRTL ? 'يرجى السماح بصلاحية الموقع من إعدادات المتصفح' : 'Please allow location permission');
      setIsLocating(false);
    });
  };

  // 🌟 نظام إصدار فاتورة PDF الأنيقة 🌟
  const handlePrintInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const invoiceHTML = `
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>${isRTL ? 'فاتورة طلب' : 'Invoice'} #${orderId}</title>
        <style>
           body { font-family: 'Segoe UI', Tahoma, Arial; padding: 40px; color: #333; line-height: 1.6; }
           .header { text-align: center; border-bottom: 2px solid #C5A059; padding-bottom: 20px; margin-bottom: 30px; }
           .details { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 12px; }
           table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
           th, td { padding: 12px; border: 1px solid #e0e0e0; text-align: ${isRTL ? 'right' : 'left'}; }
           th { background-color: #2C2C2C; color: white; }
           .total { font-size: 24px; font-weight: bold; color: #C5A059; text-align: ${isRTL ? 'left' : 'right'}; }
           .policy { margin-top: 50px; font-size: 13px; color: #666; border-top: 1px dashed #ccc; padding-top: 20px; }
        </style>
      </head>
      <body onload="window.print()">
        <div class="header">
          <h1 style="color: #C5A059; margin:0;">نسيج - NASEEJ</h1>
          <h3 style="margin-5px 0 0 0; color: #666;">${isRTL ? 'فاتورة ضريبية مبسطة' : 'Tax Invoice'}</h3>
        </div>
        <div class="details">
          <p><strong>${isRTL ? 'رقم الطلب:' : 'Order ID:'}</strong> #${orderId}</p>
          <p><strong>${isRTL ? 'العميل:' : 'Customer:'}</strong> ${user?.full_name}</p>
          <p><strong>${isRTL ? 'العنوان:' : 'Address:'}</strong> ${address}</p>
        </div>
        <table>
           <thead><tr><th>${isRTL ? 'المنتج' : 'Product'}</th><th>${isRTL ? 'الكمية' : 'Qty'}</th><th>${isRTL ? 'السعر' : 'Price'}</th></tr></thead>
           <tbody>
             ${cart.map(item => `<tr><td>${isRTL ? item.title_ar : item.title_en}</td><td>${item.quantity}</td><td>${(item.discount_price || item.base_price) * (item.quantity || 1)} ${isRTL ? 'ر.س' : 'SAR'}</td></tr>`).join('')}
           </tbody>
        </table>
        <div class="total">${isRTL ? 'الإجمالي:' : 'Total:'} ${finalTotal.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}</div>
        <div class="policy">
          <strong>${isRTL ? 'سياسة الشحن والاسترجاع:' : 'Shipping & Return Policy:'}</strong><br/>
          ${isRTL ? '- يتم تجهيز وشحن الطلبات خلال 3 إلى 5 أيام عمل.<br/>- الاسترجاع متاح خلال 14 يوماً من تاريخ الاستلام بشرط بقاء المنتج بحالته الأصلية ومغلفاً.<br/>- للمساعدة، تواصل معنا عبر واتساب.' : '- Orders are shipped within 3-5 business days.<br/>- Returns accepted within 14 days in original packaging.'}
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  // ==========================================
  // 🌟 نظام تسجيل الدخول المدمج الذكي (Unified OTP)
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
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('05')) {
      cleanPhone = '966' + cleanPhone.substring(1);
    }
    return cleanPhone;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resendTimer > 0) return;

    let targetPhone = '';
    let targetEmail = '';
    let dbContactKey = '';

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
      dbContactKey = regPhone; 
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
      
      setActiveContactForOTP(dbContactKey);
      setResendTimer(60); 
      setAuthStep('otp');
    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ في إرسال الرمز.' : 'Error sending OTP.');
    } finally {
      setIsAuthenticating(false);
    }
  };

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
        const { data: existingUserCheck } = await supabase.from('users').select('*').eq('phone', regPhone).maybeSingle();
        if (existingUserCheck) {
          finalUser = existingUserCheck;
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

  // ==========================================
  // 🌟 إرسال الطلب وإشعارات الشراء (Real Notifications)
  // ==========================================
  const subtotal = cart.reduce((total, item) => total + ((item.discount_price || item.base_price) * (item.quantity || 1)), 0);
  const shipping = subtotal > 5000 ? 0 : 150;
  const total = subtotal + shipping;
  const installmentAmount = (total / 4).toFixed(2); 

  // 🌟 دالة توليد الفاتورة كملف PDF (Base64) 🌟
  const generateInvoicePDF = async (orderId: string, totalAmount: number) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="padding: 40px; font-family: Tahoma, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'}; width: 800px; background: white; color: black;">
        <h1 style="color: #C5A059; text-align: center; font-size: 32px; margin-bottom: 5px;">نسيج - NASEEJ</h1>
        <h3 style="text-align: center; color: #666; margin-top: 0;">${isRTL ? 'فاتورة ضريبية مبسطة' : 'Tax Invoice'} #${orderId}</h3>
        <hr style="border: 1px solid #C5A059; margin-bottom: 20px;" />
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>${isRTL ? 'العميل:' : 'Customer:'}</strong> ${user?.full_name}</p>
            <p style="margin: 5px 0;"><strong>${isRTL ? 'العنوان:' : 'Address:'}</strong> ${address}</p>
          </div>
          <div style="text-align: ${isRTL ? 'left' : 'right'};">
            <p style="margin: 5px 0;"><strong>${isRTL ? 'التاريخ:' : 'Date:'}</strong> ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; direction: ${isRTL ? 'rtl' : 'ltr'};">
          <thead>
            <tr style="background: #2C2C2C; color: white;">
              <th style="padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; border: 1px solid #ddd;">${isRTL ? 'المنتج' : 'Product'}</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">${isRTL ? 'الكمية' : 'Qty'}</th>
              <th style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; border: 1px solid #ddd;">${isRTL ? 'السعر' : 'Price'}</th>
            </tr>
          </thead>
          <tbody>
            ${cart.map(item => `
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd;">${isRTL ? item.title_ar : item.title_en}</td>
                <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 12px; text-align: ${isRTL ? 'left' : 'right'}; border: 1px solid #ddd;">${(item.discount_price || item.base_price) * (item.quantity || 1)} ${isRTL ? 'ر.س' : 'SAR'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h2 style="text-align: ${isRTL ? 'left' : 'right'}; color: #C5A059; margin-top: 30px;">${isRTL ? 'الإجمالي:' : 'Total:'} ${totalAmount.toLocaleString()} ${isRTL ? 'ر.س' : 'SAR'}</h2>
      </div>
    `;
    document.body.appendChild(div);
    
    // تحويل الـ HTML إلى صورة عالية الدقة ثم إلى PDF (لضمان دعم اللغة العربية 100%)
    const canvas = await html2canvas(div, { scale: 2, useCORS: true });
    document.body.removeChild(div);
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('datauristring'); // يرجع الملف بصيغة Base64 جاهز للإرسال
  };

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
      // 🌟 1. حفظ الطلب فعلياً في قاعدة البيانات 🌟
      // تحديث عنوان العميل في حسابه إذا كان مختلفاً أو فارغاً ليتم حفظه للمرات القادمة
      if (user && address !== user.address) {
        await supabase.from('users').update({ address }).eq('id', user.id);
        setUser({ ...user, address });
      }

      const { error: dbError } = await supabase.from('orders').insert([{
        id: newOrderId,
        user_id: user?.id || null,
        customer_name: user?.full_name || (isRTL ? 'عميل نسيج' : 'Naseej Customer'),
        customer_phone: user?.phone || '',
        customer_email: user?.email || '',
        shipping_address: address, // 👈 حفظ العنوان في الطلب
        total: total,
        status: 'pending'
      }]);

      // 🌟 توليد الفاتورة كملف PDF 🌟
      const pdfBase64 = await generateInvoicePDF(newOrderId, total);

      // 🌟 تشغيل محرك الأوتوميشن الشامل مع إرفاق الفاتورة 🌟
      await triggerAutomation({
        eventName: 'order_confirmed',
        brand: 'naseej',
        userParams: {
          phone: user?.phone,
          email: user?.email,
          language: language
        },
        variables: {
          customer_name: user?.full_name || (isRTL ? 'عميلنا العزيز' : 'Dear Customer'),
          order_id: newOrderId,
          total: total.toLocaleString()
        },
        attachment: {
          name: `Naseej_Invoice_${newOrderId}.pdf`,
          base64: pdfBase64
        }
      });

      if (dbError) throw dbError;

      // 🌟 2. تشغيل محرك الأوتوميشن الشامل (تأكيد الطلب) 🌟

      // إتمام العملية بنجاح
      setFinalTotal(total); // 👈 حفظ الإجمالي هنا قبل مسح السلة
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
            {/* 👈 استخدام finalTotal هنا بدلاً من total */}
            <div className="flex justify-between items-center mt-2 border-t border-gray-200 pt-2"><span className="text-gray-500 text-sm">{isRTL ? 'الإجمالي:' : 'Total:'}</span><span className="font-bold text-[#2C2C2C]">{finalTotal.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={handlePrintInvoice} className="inline-flex items-center justify-center gap-2 bg-white border-2 border-[#C5A059] text-[#C5A059] px-8 py-4 rounded-xl font-bold hover:bg-[#C5A059] hover:text-white transition-colors shadow-sm">
              <MapPin size={20} /> {isRTL ? 'تحميل الفاتورة (PDF)' : 'Download Invoice'}
            </button>
            <Link to="/shop" className="inline-flex items-center justify-center gap-2 bg-[#2C2C2C] text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-md">
              <ShoppingBag size={20} /> {isRTL ? 'مواصلة التسوق' : 'Continue Shopping'}
            </Link>
          </div>
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

                    <button 
                      type="submit" 
                      disabled={resendTimer > 0 || isAuthenticating}
                      className={`w-full py-4 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md ${resendTimer > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2C2C2C] hover:bg-[#C5A059]'}`}
                    >
                      {isAuthenticating ? <Loader2 className="animate-spin" size={20}/> : (isRTL ? <ArrowLeft size={20}/> : <ArrowRight size={20}/>)} 
                      {resendTimer > 0 ? (isRTL ? `انتظر ${resendTimer} ثانية للمحاولة` : `Wait ${resendTimer}s`) : (isRTL ? 'إرسال رمز التحقق' : 'Send OTP Code')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100"><KeyRound size={28} className="text-[#C5A059]"/></div>
                      <h3 className="font-bold text-xl text-[#2C2C2C]">{isRTL ? 'أدخل رمز التحقق' : 'Enter OTP Code'}</h3>
                      <p className="text-sm text-gray-500 mt-2">{isRTL ? `أرسلنا الرمز المكون من 4 أرقام إلى ` : `A 4-digit code was sent to `} <b className="text-[#C5A059]" dir="ltr">{activeContactForOTP}</b></p>
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
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-[#2C2C2C] px-3 py-1 rounded-md text-xs font-bold uppercase">{user.role}</span>
                    <button type="button" onClick={() => setUser(null)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">{isRTL ? 'تسجيل خروج' : 'Logout'}</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label><input type="text" value={user.full_name || ''} disabled className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed font-bold" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'معلومات التواصل' : 'Contact Info'}</label><input type="text" value={user.phone || user.email || ''} disabled dir="ltr" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed text-end font-mono" /></div>
                </div>

                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-[#2C2C2C] flex items-center gap-2"><MapPin className="text-[#C5A059]" size={24}/> {isRTL ? 'عنوان التوصيل' : 'Shipping Address'}</h2>
                  <button type="button" onClick={handleLocateMe} disabled={isLocating} className="flex items-center gap-2 text-sm font-bold bg-[#C5A059]/10 text-[#C5A059] px-4 py-2 rounded-lg hover:bg-[#C5A059] hover:text-white transition-colors disabled:opacity-50">
                    {isLocating ? <Loader2 className="animate-spin" size={16}/> : <MapPin size={16}/>} {isRTL ? 'تحديد موقعي تلقائياً' : 'Locate Me'}
                  </button>
                </div>
                <div className="mb-8"><textarea required value={address} onChange={(e) => setAddress(e.target.value)} placeholder={isRTL ? 'المدينة، الحي، اسم الشارع، رقم المبنى...' : 'City, District, Street name, Building no...'} rows={3} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white resize-none leading-relaxed"></textarea></div>

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