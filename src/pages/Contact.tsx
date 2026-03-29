import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase'; // <-- استدعاء قاعدة البيانات
import { MapPin, Phone, Mail, Instagram, Clock, Calendar, MessageSquare, Send, CalendarCheck, Twitter, Facebook, Youtube, Linkedin, MessageCircle, Link as LinkIcon, Loader2 } from 'lucide-react';

export const Contact = () => {
  const { language, homeSections, fetchHomeSections, user } = useStore();
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
  // 🌟 نظام الحجوزات الذكي (Booking Logic)
  // ==========================================
  const [bookingData, setBookingData] = useState({
    name: (user as any)?.user_metadata?.full_name || (user as any)?.name || '',
    phone: '',
    service: isRTL ? 'استشارة تصميم داخلي' : 'Interior Design Consultation',
    date: '',
    time: ''
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  // توليد الأوقات المتاحة عند تغيير التاريخ
  useEffect(() => {
    if (!bookingData.date) {
      setAvailableSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        // جلب المواعيد المحجوزة مسبقاً في هذا اليوم (ولا تشمل الملغاة)
        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('appointment_date', bookingData.date)
          .neq('status', 'cancelled');
        
        if (error) throw error;

        // الأوقات الافتراضية للعمل (من 10 صباحاً إلى 9 مساءً - بنظام 24 ساعة)
        const allSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        
        // استخراج الأوقات المحجوزة
        const booked = data.map(app => app.appointment_time.substring(0, 5)); // تقليم الثواني إن وجدت
        
        // تصفية الأوقات وإبقاء المتاحة فقط
        const free = allSlots.filter(slot => !booked.includes(slot));
        setAvailableSlots(free);
        
        // تفريغ الوقت المختار إذا لم يعد متاحاً
        if (bookingData.time && !free.includes(bookingData.time)) {
          setBookingData(prev => ({ ...prev, time: '' }));
        }

      } catch (error) {
        console.error("Error fetching slots:", error);
      }
    };

    fetchBookedSlots();
  }, [bookingData.date]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
      alert(isRTL ? 'يرجى تعبئة جميع الحقول المطلوبة واختيار وقت متاح.' : 'Please fill all fields and select a valid time.');
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase.from('appointments').insert([{
        user_id: user?.id || null, // إذا كان مسجلاً دخول
        customer_name: bookingData.name,
        customer_phone: bookingData.phone,
        service_type: bookingData.service,
        appointment_date: bookingData.date,
        appointment_time: bookingData.time + ':00', // صيغة الوقت في SQL
        status: 'pending' // يظهر كـ "قيد المراجعة" في اللوحة
      }]);

      if (error) throw error;

      alert(isRTL ? '🎉 تم تسجيل طلب الحجز بنجاح! سنتواصل معك قريباً لتأكيد الموعد.' : '🎉 Booking request submitted successfully! We will contact you soon to confirm.');
      
      // إعادة تعيين النموذج
      setBookingData(prev => ({ ...prev, date: '', time: '', phone: '' }));
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsBooking(false);
    }
  };

  // ==========================================

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
                {/* 🌟 نموذج الحجز المبرمج */}
                {activeTab === 'book' && (
                  <form className="space-y-6 animate-in fade-in" onSubmit={handleBookSubmit}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">{isRTL ? 'احجز موعدك الآن' : 'Book Your Session'}</h3>
                      <p className="text-gray-500">{isRTL ? 'اختر الوقت المناسب لزيارتنا أو للتحدث مع خبراء التصميم.' : 'Choose the best time to visit or speak with our design experts.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الاسم الكريم' : 'Full Name'}</label>
                        <input type="text" value={bookingData.name} onChange={e => setBookingData({...bookingData, name: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الجوال' : 'Phone Number'}</label>
                        <input type="tel" value={bookingData.phone} onChange={e => setBookingData({...bookingData, phone: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" dir="ltr" placeholder="05XXXXXXXX" required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'نوع الخدمة المطلوبة' : 'Service Type'}</label>
                      <select value={bookingData.service} onChange={e => setBookingData({...bookingData, service: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50">
                        <option value={isRTL ? 'استشارة تصميم داخلي' : 'Interior Design Consultation'}>{isRTL ? 'استشارة تصميم داخلي' : 'Interior Design Consultation'}</option>
                        <option value={isRTL ? 'استفسار مبيعات وتفصيل' : 'Sales & Custom Furniture'}>{isRTL ? 'استفسار مبيعات وتفصيل' : 'Sales & Custom Furniture'}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'تاريخ الموعد' : 'Date'}</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 text-gray-700" required />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الوقت المناسب' : 'Time Slot'}</label>
                        <select value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 disabled:opacity-50" disabled={!bookingData.date} required>
                          <option value="" disabled>{!bookingData.date ? (isRTL ? 'اختر التاريخ أولاً' : 'Select date first') : (isRTL ? 'اختر الوقت...' : 'Select time...')}</option>
                          {availableSlots.map(slot => (
                            <option key={slot} value={slot}>
                              {/* تحويل صيغة 24 ساعة إلى 12 ساعة لتكون مفهومة للعميل */}
                              {parseInt(slot) > 12 ? `${parseInt(slot) - 12}:00 PM` : parseInt(slot) === 12 ? '12:00 PM' : `${slot} AM`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button disabled={isBooking} className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg flex justify-center items-center gap-2 mt-4 disabled:opacity-70">
                      {isBooking ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
                      {isRTL ? 'تأكيد الحجز' : 'Confirm Booking'}
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-4">{isRTL ? 'سيتم إرسال رسالة تأكيد عبر الواتساب والبريد الإلكتروني لاحقاً.' : 'A confirmation will be sent via WhatsApp and Email later.'}</p>
                  </form>
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