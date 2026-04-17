import { supabase } from './supabase';

const NOTIFICATION_API = 'http://167.86.73.97:8080/send';

// قائمة الإجراءات (الأحداث) المعرفة في النظام
// 🌟 قائمة الأحداث المعتمدة في النظام 🌟
export const SYSTEM_EVENTS = {
  welcome_msg: 'رسالة ترحيبية (Welcome Message)',
  order_confirmed: 'تأكيد الطلب (Order Confirmed)',
  order_shipped: 'تم الشحن (Order Shipped)',
  order_delivered: 'تم التوصيل (Order Delivered)', 
  abandoned_cart: 'السلة المتروكة (Abandoned Cart)', 
  manufacturing_update: 'تحديث التصنيع (Manufacturing Update)',
  appointment_booked: 'تأكيد الموعد (Appointment Confirmed)',
  appointment_rescheduled: 'تعديل الموعد (Appointment Rescheduled)',
  custom_campaign: 'حملة مخصصة (Custom Campaign)'
};

interface TriggerProps {
  eventName: keyof typeof SYSTEM_EVENTS | string;
  brand?: string;
  userParams: {
    phone?: string | null;
    email?: string | null;
    language?: 'ar' | 'en';
  };
  variables: Record<string, string>;
  attachment?: { name: string, base64: string }; // 👈 إضافة هذا السطر
}

export const triggerAutomation = async ({ eventName, brand = 'naseej', userParams, variables, attachment }: TriggerProps) => {
  const isRTL = userParams.language !== 'en';

  try {
    // 🌟 جلب إعدادات البراند (للحصول على قالب الـ HTML العام للإيميل) 🌟
    const { data: settings } = await supabase.from('integration_settings').select('email_layout').eq('project_name', brand).maybeSingle();
    const emailLayout = settings?.email_layout || '<div dir="{{dir}}" style="padding: 20px; font-family: Tahoma;">{{message}}</div>';

    // 1. جلب *جميع* القوالب المفعلة لهذا الإجراء
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('content_ar, content_en, channel, subject')
      .eq('project_name', brand)
      .eq('event_name', eventName)
      .eq('is_active', true);

    if (error || !templates || templates.length === 0) return { success: false, reason: 'No active templates' };

    const formatPhone = (p: string) => {
      let clean = p.replace(/\D/g, '');
      return clean.startsWith('05') ? '966' + clean.substring(1) : clean;
    };

    // 2. الدوران على كل القوالب
    const sendPromises = templates.map(async (template) => {
      let finalMessage = isRTL ? template.content_ar : template.content_en;
      if (!finalMessage) return;

      // استبدال المتغيرات
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        finalMessage = finalMessage.replace(regex, value);
      });

      const payload: any = { brand };
      // 🌟 أضف هذا الجزء لدعم إرسال الملفات 🌟
      if (attachment) {
        payload.media_url = attachment.base64;
        payload.file_name = attachment.name;
      }

      if (template.channel === 'whatsapp' && userParams.phone) {
        payload.phone = formatPhone(userParams.phone);
        payload.message = finalMessage;
      } 
      else if (template.channel === 'email' && userParams.email) {
        payload.email = userParams.email;
        payload.subject = template.subject || (isRTL ? 'إشعار جديد' : 'New Notification');
        // 🌟 حقن الرسالة داخل قالب الـ HTML الذي جلبناه من لوحة التحكم 🌟
        payload.html = emailLayout
          .replace('{{dir}}', isRTL ? 'rtl' : 'ltr')
          .replace('{{message}}', finalMessage.replace(/\n/g, '<br>'));
      } else {
        return; // تجاوز إذا كانت وسيلة التواصل غير متوفرة لهذه القناة
      }

      
      // إرسال الطلب للسيرفر
      return fetch(NOTIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.error(`Failed to send ${template.channel}:`, err));
    });

    // تنفيذ جميع الإرسالات في نفس اللحظة
    await Promise.all(sendPromises);

    return { success: true };

  } catch (err) {
    console.error(`Automation Error [${eventName}]:`, err);
    return { success: false, error: err };
  }
};