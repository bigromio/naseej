import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { 
  Server, Mail, MessageSquare, Smartphone, Power, Save, RefreshCw, 
  Loader2, Settings, DownloadCloud, Megaphone, Users, FileUp, Paperclip, Send, Plus, Trash2, CheckSquare
} from 'lucide-react';
import { SYSTEM_EVENTS } from '@/lib/automations';

export const AdminCampaigns = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'servers' | 'emails' | 'templates' | 'campaigns'>('servers');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ==========================================
  // 1. حالات البيانات (States)
  // ==========================================
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [storeCustomers, setStoreCustomers] = useState<any[]>([]); // العملاء المسجلين للحملات

  const [campaignData, setCampaignData] = useState({
    brand: 'naseej',
    channel: 'whatsapp',
    audience: 'all_customers', // all_customers, selected_customers, excel
    selectedCustomers: [] as string[], // لحفظ IDs العملاء المحددين
    message: '',
    delaySeconds: 10,
  });

  const [mediaFile, setMediaFile] = useState<{ name: string, base64: string } | null>(null);

  const EVENT_TYPES: Record<string, string> = {
    order_confirmed: isRTL ? 'تأكيد الطلب' : 'Order Confirmed',
    order_shipped: isRTL ? 'تتبع الشحن' : 'Shipping Tracking',
    manufacturing_update: isRTL ? 'تتبع التصنيع' : 'Manufacturing Update',
    appointment_new: isRTL ? 'تأكيد الموعد' : 'Appointment Confirmed',
    appointment_reminder: isRTL ? 'تذكير بالموعد' : 'Appointment Reminder',
    custom_campaign: isRTL ? 'حملة إعلانية مخصصة' : 'Custom Campaign'
  };

  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  // ==========================================
  // 2. دوال جلب البيانات
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: setItems } = await supabase.from('integration_settings').select('*').order('project_name');
      if (setItems) setIntegrations(setItems);

      const { data: tplItems } = await supabase.from('notification_templates').select('*').order('project_name');
      if (tplItems) setTemplates(tplItems);

      // جلب العملاء للحملات المخصصة
      const { data: usersData } = await supabase.from('users').select('id, full_name, phone, email').eq('role', 'customer');
      if (usersData) setStoreCustomers(usersData);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // مراقبة التحديثات الحية لـ QR Code
    const subscription = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'integration_settings' }, (payload) => {
        setIntegrations(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
      }).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  // ==========================================
  // 3. دوال التعديل والحفظ
  // ==========================================
  const handleIntegrationsChange = (index: number, field: string, value: any) => {
    const updated = [...integrations];
    updated[index][field] = value;
    setIntegrations(updated);
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    try {
      for (const item of integrations) {
        await supabase.from('integration_settings').upsert({
          id: item.id, project_name: item.project_name,
          pm2_restart_minutes: item.pm2_restart_minutes,
          smtp_host: item.smtp_host, smtp_port: item.smtp_port,
          smtp_user: item.smtp_user, smtp_pass: item.smtp_pass, smtp_from_name: item.smtp_from_name,
          email_layout: item.email_layout
        });
      }
      alert(isRTL ? 'تم حفظ إعدادات الربط بنجاح!' : 'Settings saved successfully!');
    } catch (error) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 دالة حفظ القوالب الذكية (المفصولة لتجنب الفشل الصامت) 🌟
  const handleSaveTemplates = async () => {
    // 1. التحقق من التكرار
    const activeMap = new Map();
    for (const tpl of templates) {
      if (tpl.is_active && tpl.event_name) {
        const key = `${tpl.channel}_${tpl.event_name}`; 
        if (activeMap.has(key)) {
          return alert(isRTL 
            ? `⚠️ خطأ: لديك أكثر من قالب مفعل لنفس القناة (${tpl.channel.toUpperCase()}) ونفس الإجراء. يرجى تعطيل أو حذف المكرر لتجنب إرسال رسائل مزدوجة.` 
            : `⚠️ Error: Duplicate active templates for channel (${tpl.channel}) and the same event.`);
        }
        activeMap.set(key, true);
      }
    }

    setIsSavingTemplates(true);
    try {
      // 2. فصل القوالب الجديدة عن الموجودة مسبقاً
      const newTemplates = templates
        .filter(t => t.id.toString().startsWith('temp-'))
        .map(t => ({
          project_name: t.project_name || 'naseej',
          channel: t.channel,
          event_name: t.event_name,
          is_active: t.is_active,
          content_ar: t.content_ar,
          content_en: t.content_en,
          subject: t.subject
        }));

      const existingTemplates = templates
        .filter(t => !t.id.toString().startsWith('temp-'))
        .map(t => ({
          id: t.id, // نحتفظ بالـ ID للقوالب القديمة لكي يتم تحديثها
          project_name: t.project_name || 'naseej',
          channel: t.channel,
          event_name: t.event_name,
          is_active: t.is_active,
          content_ar: t.content_ar,
          content_en: t.content_en,
          subject: t.subject
        }));

      // 3. إضافة القوالب الجديدة (INSERT)
      if (newTemplates.length > 0) {
        const { error: insertError } = await supabase.from('notification_templates').insert(newTemplates);
        if (insertError) throw insertError;
      }

      // 4. تحديث القوالب القديمة (UPSERT)
      if (existingTemplates.length > 0) {
        const { error: updateError } = await supabase.from('notification_templates').upsert(existingTemplates);
        if (updateError) throw updateError;
      }

      alert(isRTL ? '✅ تم حفظ جميع القوالب بنجاح في قاعدة البيانات!' : '✅ Templates saved successfully!');
      
      await fetchData(); 

    } catch (error) {
      console.error("Save Templates Error:", error);
      alert(isRTL ? '❌ حدث خطأ أثناء الحفظ. يرجى مراجعة الـ Console.' : '❌ Error saving templates.');
    } finally {
      setIsSavingTemplates(false);
    }
  };

  // إضافة براند جديد ديناميكياً
  const handleAddNewBrand = () => {
    const newBrandName = prompt(isRTL ? 'أدخل اسم البراند الجديد (باللغة الإنجليزية، مثل: mybrand):' : 'Enter new brand name (e.g. mybrand):');
    if (!newBrandName) return;
    
    const newBrand = {
      id: `temp-${Date.now()}`, project_name: newBrandName.toLowerCase(),
      wa_session_id: `${newBrandName.toLowerCase()}-session`, wa_status: 'disconnected', pm2_restart_minutes: 30,
      smtp_host: '', smtp_port: 465, smtp_user: '', smtp_pass: '', smtp_from_name: ''
    };
    setIntegrations([...integrations, newBrand]);
  };

  // حذف براند موجود
  const handleDeleteBrand = async (id: string, projectName: string) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من حذف البراند "${projectName}" نهائياً؟` : `Are you sure you want to delete "${projectName}"?`)) {
      return;
    }
    setIsSaving(true);
    try {
      // 1. الحذف من قاعدة البيانات
      const { error } = await supabase.from('integration_settings').delete().eq('id', id);
      if (error) throw error;
      
      // 2. الحذف من الواجهة (State)
      setIntegrations(integrations.filter(item => item.id !== id));
      alert(isRTL ? 'تم حذف البراند بنجاح!' : 'Brand deleted successfully!');
    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ أثناء الحذف.' : 'Error deleting brand.');
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 دالة الحذف النهائي للقوالب (الصارمة) 🌟
  const handleDeleteTemplate = async (id: any, index: number) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا القالب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Delete this template permanently?')) return;
    
    // إذا كان القالب موجوداً فعلياً في قاعدة البيانات (وليس مجرد قالب جديد لم يُحفظ بعد)
    if (String(id).indexOf('temp-') === -1) {
      setIsSavingTemplates(true); // إيقاف الأزرار حتى ننتهي من الحذف
      try {
        // إضافة .select() تجبر قاعدة البيانات على إرجاع ما تم حذفه لنتأكد
        const { data, error } = await supabase
          .from('notification_templates')
          .delete()
          .eq('id', id)
          .select();

        if (error) throw error;

        // إذا لم تُرجع قاعدة البيانات أي بيانات، فهذا يعني أن الحذف تم حظره (RLS)
        if (!data || data.length === 0) {
          console.warn("⚠️ تم تجاهل أمر الحذف من قاعدة البيانات.");
          setIsSavingTemplates(false);
          return alert(isRTL ? '❌ لم يتم الحذف! تأكد من تفعيل صلاحيات الحذف (RLS) في Supabase.' : '❌ Not deleted! Check Supabase RLS policies.');
        }

      } catch (err: any) {
        console.error("Delete Error:", err);
        setIsSavingTemplates(false);
        return alert(isRTL ? `❌ خطأ في الحذف: ${err.message}` : `❌ Error deleting: ${err.message}`);
      }
      setIsSavingTemplates(false);
    }
    
    // إزالته من الواجهة فوراً بعد التأكد من مسحه من القاعدة
    const newTpls = [...templates];
    newTpls.splice(index, 1);
    setTemplates(newTpls);
  };

  // إضافة قالب جديد ديناميكياً
  const handleAddNewTemplate = () => {
    if (integrations.length === 0) return alert(isRTL ? 'يجب إضافة براند أولاً' : 'Add a brand first');
    const newTemplate = {
      id: `temp-${Date.now()}`, project_name: integrations[0].project_name,
      channel: 'whatsapp', event_name: 'custom_campaign', is_active: true, subject: '', content: ''
    };
    setTemplates([newTemplate, ...templates]);
  };

  // محاكاة أوامر السيرفر والحملات
  const handleServerCommand = (commandType: 'restart' | 'update') => {
    alert(commandType === 'update' ? 'جاري تحديث مكتبة الواتساب في السيرفر...' : 'جاري إعادة تشغيل محرك الواتساب...');
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignData.message) return alert(isRTL ? 'يرجى كتابة نص الحملة' : 'Please enter message');
    
    let targetCustomers = [];
    if (campaignData.audience === 'all_customers') {
      targetCustomers = storeCustomers;
    } else if (campaignData.audience === 'selected_customers') {
      targetCustomers = storeCustomers.filter(c => campaignData.selectedCustomers.includes(c.id));
      if (targetCustomers.length === 0) return alert(isRTL ? 'يرجى تحديد عميل واحد على الأقل' : 'Select at least one customer');
    } else {
      return alert(isRTL ? 'ميزة قراءة الإكسل ستتوفر قريباً، يرجى استخدام التحديد اليدوي حالياً.' : 'Excel parsing coming soon.');
    }

    if (!window.confirm(isRTL ? `هل أنت متأكد من جدولة الحملة لـ ${targetCustomers.length} عميل؟` : `Schedule campaign for ${targetCustomers.length} customers?`)) return;

    setIsSaving(true);

    try {
      // 1. تصفية وتجهيز قائمة المستهدفين
      const audienceList = targetCustomers.map(c => ({
        id: c.id,
        name: c.full_name,
        contact: campaignData.channel === 'whatsapp' ? c.phone : c.email
      })).filter(c => c.contact); // استبعاد أي عميل ليس لديه رقم جوال أو إيميل حسب القناة

      if (audienceList.length === 0) {
          alert(isRTL ? 'العملاء المحددين لا يمتلكون وسيلة تواصل مطابقة لهذه القناة' : 'No valid contacts found for this channel');
          setIsSaving(false);
          return;
      }

      // 2. إرسال المهمة إلى طابور قاعدة البيانات (Job Queue) بدلاً من السيرفر المباشر
      const { error } = await supabase.from('campaign_queues').insert([{
        project_name: campaignData.brand,
        channel: campaignData.channel,
        message: campaignData.message,
        media_url: mediaFile ? mediaFile.base64 : null,
        target_audience: audienceList,
        total_count: audienceList.length,
        status: 'pending',
        delay_seconds: campaignData.delaySeconds
      }]);

      if (error) throw error;

      // 3. نجاح العملية (بسرعة البرق)
      alert(isRTL ? `تمت جدولة الحملة بنجاح! 🎉\nالسيرفر سيقوم الآن بسحبها وإرسالها في الخلفية لـ ${audienceList.length} عميل.` : `Campaign scheduled successfully for ${audienceList.length} customers! 🎉`);
      
      // تفريغ الحقول بعد النجاح
      setCampaignData({...campaignData, message: '', selectedCustomers: []});
      setMediaFile(null); 

    } catch (error) {
      console.error(error);
      alert(isRTL ? 'حدث خطأ أثناء جدولة الحملة.' : 'Error scheduling campaign.');
    } finally {
      setIsSaving(false);
    }
  };

  // معالجة الملف المرفق وتحويله إلى Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert(isRTL ? 'حجم الملف يتجاوز 16 ميجابايت' : 'File size exceeds 16MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaFile({
        name: file.name,
        base64: event.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // يتم استكمال الواجهة في الجزء الثاني والثالث...
  // ==========================================
  
return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 🌟 رأس الصفحة وزر الحفظ 🌟 */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
            <Megaphone className="text-[#C5A059]" /> {isRTL ? 'الحملات الإعلانية والإشعارات' : 'Campaigns & Notifications'}
          </h2>
          <p className="text-gray-500 text-sm">{isRTL ? 'إدارة الواتساب، الإيميل المتعدد، قوالب الأوتوميشن، وإطلاق الحملات.' : 'Manage multi-tenant WhatsApp, Email, automation templates, and campaigns.'}</p>
        </div>
        <div className="flex gap-3">
          {activeTab !== 'campaigns' && (
            <button 
              onClick={activeTab === 'templates' ? handleSaveTemplates : handleSaveIntegrations} 
              disabled={isSaving} 
              className="bg-[#2C2C2C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#C5A059] transition-colors flex items-center gap-2 shadow-md disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
              {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* 🌟 أزرار التبديل (Tabs) 🌟 */}
      <div className="flex gap-4 border-b border-gray-200 px-2 overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('servers')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'servers' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Smartphone size={20} /> {isRTL ? 'إدارة الواتساب والسيرفر' : 'WhatsApp & Server'}</button>
        <button onClick={() => setActiveTab('emails')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'emails' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Mail size={20} /> {isRTL ? 'إعدادات الإيميل المتعددة' : 'Multiple SMTPs'}</button>
        <button onClick={() => setActiveTab('templates')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'templates' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MessageSquare size={20} /> {isRTL ? 'قوالب الأوتوميشن' : 'Automation Templates'}</button>
        <button onClick={() => setActiveTab('campaigns')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'campaigns' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><Megaphone size={20} /> {isRTL ? 'إطلاق حملة إعلانية' : 'Launch Campaign'}</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* ================================== */}
        {/* 1. إدارة الواتساب والسيرفر (Multi-Tenancy) */}
        {/* ================================== */}
        {activeTab === 'servers' && (
          <div className="p-8 space-y-10 animate-in fade-in">
            
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><Server size={20}/> {isRTL ? 'التحكم المركزي بالسيرفر (Contabo)' : 'Central Server Control'}</h3>
                <p className="text-sm text-red-600 mt-1">{isRTL ? 'احذر: تحديث المكتبة سيقوم بإيقاف الإرسال لمدة دقيقة حتى يعيد السيرفر تشغيل نفسه.' : 'Warning: Updating library will restart the server.'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddNewBrand} className="bg-white text-[#2C2C2C] border border-[#2C2C2C] px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                  <Plus size={18}/> {isRTL ? 'إضافة براند جديد' : 'Add New Brand'}
                </button>
                <button onClick={() => handleServerCommand('update')} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-md">
                  <DownloadCloud size={20}/> {isRTL ? 'تحديث مكتبة WhatsApp' : 'Update WhatsApp Lib'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {integrations.map((item, index) => (
                <div key={item.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-[#2C2C2C] uppercase flex items-center gap-2">
                        {item.project_name} <span className="text-xs text-gray-400 normal-case">(Brand)</span>
                      </h3>
                      <span className="bg-[#C5A059] text-white text-xs px-3 py-1 rounded-full font-bold">Session: {item.wa_session_id}</span>
                    </div>
                    
                    {/* زر الحذف */}
                    <button 
                      onClick={() => handleDeleteBrand(item.id, item.project_name)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 bg-white rounded-lg border border-gray-100 shadow-sm transition-colors"
                      title={isRTL ? 'حذف البراند' : 'Delete Brand'}
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                    <div className="w-32 h-32 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm p-2 shrink-0">
                      {item.wa_status === 'connected' ? <Power size={48} className="text-green-500"/> :
                       item.wa_status === 'qr_ready' ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(item.wa_qr_code || 'wait')}`} alt="QR Code" className="w-full h-full" /> :
                       <Power size={48} className="text-red-500"/>}
                    </div>
                    <div>
                      <h4 className={`text-lg font-bold mb-1 ${item.wa_status === 'connected' ? 'text-green-600' : item.wa_status === 'qr_ready' ? 'text-blue-600' : 'text-red-600'}`}>
                        {item.wa_status === 'connected' ? (isRTL ? 'متصل وجاهز للإرسال ✅' : 'Connected ✅') : 
                         item.wa_status === 'qr_ready' ? (isRTL ? 'امسح الـ QR بجوال البراند 📱' : 'Scan QR Code 📱') : 
                         (isRTL ? 'غير متصل ❌' : 'Disconnected ❌')}
                      </h4>
                      <button onClick={() => handleServerCommand('restart')} className="mt-3 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 text-sm flex items-center gap-2 transition-colors">
                        <RefreshCw size={16} /> {isRTL ? 'إعادة طلب QR / تسجيل خروج' : 'Refresh QR / Logout'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'تفريغ الذاكرة التلقائي (بالدقائق)' : 'Auto-restart (Minutes)'}</label>
                    <input type="number" value={item.pm2_restart_minutes} onChange={e => handleIntegrationsChange(index, 'pm2_restart_minutes', parseInt(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white font-bold" />
                    <p className="text-xs text-gray-500 mt-2">{isRTL ? 'يُطبق على هذا الرقم فقط ليتم إغلاق متصفحه المخفي وإعادة فتحه لعدم استهلاك الرام.' : 'Applies to this number only to free up RAM.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* 2. إعدادات الإيميل المتعددة */}
        {/* ================================== */}
        {activeTab === 'emails' && (
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
            {integrations.map((item, index) => (
              <div key={item.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200 relative">
                <h3 className="text-xl font-bold text-[#2C2C2C] uppercase mb-6 border-b border-gray-200 pb-4 flex items-center gap-2">
                  <Mail className="text-[#C5A059]"/> {item.project_name} SMTP
                </h3>
                <div className="space-y-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'اسم المرسل (الذي يظهر للعميل)' : 'Sender Name'}</label><input type="text" value={item.smtp_from_name} onChange={e => handleIntegrationsChange(index, 'smtp_from_name', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'الخادم (Host)' : 'Host'}</label><input type="text" value={item.smtp_host} onChange={e => handleIntegrationsChange(index, 'smtp_host', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'اسم المستخدم (الإيميل)' : 'Username'}</label><input type="email" value={item.smtp_user} onChange={e => handleIntegrationsChange(index, 'smtp_user', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'كلمة المرور' : 'Password'}</label><input type="password" value={item.smtp_pass} onChange={e => handleIntegrationsChange(index, 'smtp_pass', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'المنفذ (Port)' : 'Port'}</label><input type="number" value={item.smtp_port} onChange={e => handleIntegrationsChange(index, 'smtp_port', parseInt(e.target.value))} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059]" dir="ltr" /></div>
                    <div className="mt-6 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'كود الإطار العام للإيميلات (Master HTML Layout)' : 'Master HTML Layout'}</label>
                    <p className="text-xs text-gray-500 mb-3">{isRTL ? 'يجب أن يحتوي الكود على المتغير {{message}} ليتم حقن نص القوالب بداخله، و {{dir}} لاتجاه النص.' : 'Must contain {{message}} and {{dir}}'}</p>
                    <textarea rows={8} value={item.email_layout || ''} onChange={e => handleIntegrationsChange(index, 'email_layout', e.target.value)} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] font-mono text-xs text-left bg-[#1e1e1e] text-green-400" dir="ltr" placeholder="<div dir='{{dir}}'>{{message}}</div>"></textarea>
                  </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================================== */}
        {/* 3. قوالب الأوتوميشن الشاملة */}
        {/* ================================== */}
        {activeTab === 'templates' && (
          <div className="p-8 animate-in fade-in space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
              <div className="text-yellow-800 text-sm font-bold flex gap-3 items-start">
                <Settings size={24} className="shrink-0 mt-0.5 text-yellow-600"/>
                <div>
                  <p className="text-base mb-1">{isRTL ? 'المتغيرات المتاحة للاستخدام في القوالب:' : 'Available variables for templates:'}</p>
                  <p className="font-mono bg-yellow-100 px-2 py-1 rounded inline-block mt-1" dir="ltr">{"{{customer_name}}, {{order_id}}, {{total}}, {{appointment_date}}, {{tracking_link}}"}</p>
                </div>
              </div>
              <button onClick={handleAddNewTemplate} className="bg-yellow-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-yellow-700 transition-colors flex items-center gap-2 shadow-sm shrink-0">
                <Plus size={20}/> {isRTL ? 'إضافة قالب جديد' : 'Add New Template'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {templates.map((tpl, index) => (
                <div key={tpl.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-200 flex flex-col relative transition-all hover:border-[#C5A059]/50 shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-5 border-b border-gray-200 pb-4">
                    <div className="flex-1">
                      {/* اختيار البراند للقالب */}
                      <select 
                        value={tpl.project_name} 
                        onChange={e => { const newTpls = [...templates]; newTpls[index].project_name = e.target.value; setTemplates(newTpls); }}
                        className="bg-gray-200 text-gray-700 text-xs font-black uppercase px-2 py-1 rounded tracking-widest mb-2 outline-none cursor-pointer border border-gray-300"
                      >
                        {integrations.map(i => <option key={i.id} value={i.project_name}>{i.project_name}</option>)}
                      </select>
                      
                      <div className="flex items-center gap-2 mt-1">
                        {/* اختيار القناة */}
                        <select 
                          value={tpl.channel} 
                          onChange={e => { const newTpls = [...templates]; newTpls[index].channel = e.target.value; setTemplates(newTpls); }}
                          className={`bg-transparent font-bold outline-none cursor-pointer ${tpl.channel === 'whatsapp' ? 'text-green-600' : 'text-blue-600'}`}
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="email">Email</option>
                        </select>
                        <span className="text-gray-300">|</span>
                        {/* 🌟 اختيار نوع الحدث أو كتابته يدوياً 🌟 */}
                        <div className="flex flex-col w-full">
                          <select 
                            value={Object.keys(SYSTEM_EVENTS).includes(tpl.event_name) ? tpl.event_name : 'custom_event'} 
                            onChange={e => { 
                              const newTpls = [...templates]; 
                              newTpls[index].event_name = e.target.value === 'custom_event' ? '' : e.target.value; 
                              setTemplates(newTpls); 
                            }}
                            className="bg-transparent font-bold text-[#C5A059] outline-none cursor-pointer text-sm w-full"
                          >
                            <option value="" disabled>{isRTL ? 'اختر الإجراء...' : 'Select Event...'}</option>
                            {Object.entries(SYSTEM_EVENTS).map(([key, val]) => (
                              <option key={key} value={key}>{val as string}</option>
                            ))}
                            <option value="custom_event">{isRTL ? '✍️ إجراء مخصص (كتابة يدوية)' : '✍️ Custom Event'}</option>
                          </select>

                          {/* حقل الكتابة يظهر فقط عند اختيار "إجراء مخصص" */}
                          {(!Object.keys(SYSTEM_EVENTS).includes(tpl.event_name) || tpl.event_name === '') && (
                            <input 
                              type="text" 
                              value={tpl.event_name} 
                              onChange={e => { const newTpls = [...templates]; newTpls[index].event_name = e.target.value; setTemplates(newTpls); }}
                              placeholder={isRTL ? 'اكتب الحدث البرمجي (مثال: order_shipped)' : 'Event name (e.g. order_shipped)'}
                              className="mt-2 p-2 border border-gray-200 rounded-lg text-xs font-mono outline-none focus:border-[#C5A059] w-full bg-gray-50 shadow-inner text-gray-700"
                              dir="ltr"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-bold text-gray-600">{isRTL ? 'تفعيل' : 'Active'}</span>
                        <input type="checkbox" checked={tpl.is_active} onChange={e => { const newTpls = [...templates]; newTpls[index].is_active = e.target.checked; setTemplates(newTpls); }} className="w-4 h-4 accent-[#C5A059]" />
                      </label>
                      <button 
                        onClick={() => handleDeleteTemplate(tpl.id, index)} 
                        className="text-red-400 hover:text-red-600 p-1 bg-white rounded-md border border-gray-100 shadow-sm transition-colors" 
                        title={isRTL ? 'حذف القالب' : 'Delete Template'}
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>

                  {tpl.channel === 'email' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-1">{isRTL ? 'عنوان الإيميل (Subject)' : 'Email Subject'}</label>
                      <input type="text" value={tpl.subject || ''} onChange={e => { const newTpls = [...templates]; newTpls[index].subject = e.target.value; setTemplates(newTpls); }} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white text-sm" placeholder={isRTL ? 'مثال: تأكيد موعدك مع نسيج' : 'e.g. Appointment Confirmation'} />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-4 mt-4 border-t border-gray-100 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-[#C5A059] mb-2">{isRTL ? 'النص بالعربية' : 'Arabic Content'}</label>
                      <textarea rows={4} value={tpl.content_ar || ''} onChange={e => { const newTpls = [...templates]; newTpls[index].content_ar = e.target.value; setTemplates(newTpls); }} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white resize-none font-mono text-sm leading-relaxed" dir="rtl" placeholder="مرحباً {{customer_name}}..."></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-600 mb-2">{isRTL ? 'النص بالإنجليزية' : 'English Content'}</label>
                      <textarea rows={4} value={tpl.content_en || ''} onChange={e => { const newTpls = [...templates]; newTpls[index].content_en = e.target.value; setTemplates(newTpls); }} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-blue-400 bg-white resize-none font-mono text-sm leading-relaxed" dir="ltr" placeholder="Hello {{customer_name}}..."></textarea>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================== */}
        {/* 4. الحملات الإعلانية (Marketing Campaigns) */}
        {/* ================================== */}
        {activeTab === 'campaigns' && (
          <div className="p-8 animate-in fade-in max-w-4xl mx-auto">
            <form onSubmit={handleSendCampaign} className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 pb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'إرسال الحملة باسم براند' : 'Send on behalf of brand'}</label>
                  <select value={campaignData.brand} onChange={e => setCampaignData({...campaignData, brand: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 uppercase font-bold text-[#C5A059] cursor-pointer">
                    {integrations.map(i => <option key={i.id} value={i.project_name}>{i.project_name}</option>)}
                  </select>
                </div>

                {/* 🌟 وحدة التحكم في وقت الإرسال 🌟 */}
                <div className="col-span-2 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-blue-900">
                      {isRTL ? 'مؤقت التأخير بين الرسائل (بالثواني)' : 'Delay between messages (Seconds)'}
                    </label>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-mono font-bold">
                      {campaignData.delaySeconds} {isRTL ? 'ثانية' : 'sec'}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="60" 
                    step="1"
                    value={campaignData.delaySeconds}
                    onChange={(e) => setCampaignData({...campaignData, delaySeconds: parseInt(e.target.value)})}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-blue-400 uppercase">
                    <span>{isRTL ? 'سريع (مخاطرة)' : 'Fast (Risky)'}</span>
                    <span>{isRTL ? 'آمن جداً' : 'Ultra Safe'}</span>
                  </div>
              </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'قناة الإرسال' : 'Channel'}</label>
                  <select value={campaignData.channel} onChange={e => setCampaignData({...campaignData, channel: e.target.value})} className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 font-bold cursor-pointer">
                    <option value="whatsapp">WhatsApp 📱</option>
                    <option value="email">Email 📧</option>
                  </select>
                  
                </div>
              </div>

              <div className="border-b border-gray-100 pb-8">
                <label className="block text-sm font-bold text-gray-700 mb-4">{isRTL ? 'الجمهور المستهدف' : 'Target Audience'}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all ${campaignData.audience === 'all_customers' ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                    <input type="radio" name="audience" checked={campaignData.audience === 'all_customers'} onChange={() => setCampaignData({...campaignData, audience: 'all_customers'})} className="hidden" />
                    <Users size={32} className={campaignData.audience === 'all_customers' ? 'text-[#C5A059]' : 'text-gray-400'} />
                    <span className="font-bold text-[#2C2C2C] text-center">{isRTL ? 'جميع العملاء' : 'All Customers'}</span>
                  </label>
                  
                  <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all ${campaignData.audience === 'selected_customers' ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                    <input type="radio" name="audience" checked={campaignData.audience === 'selected_customers'} onChange={() => setCampaignData({...campaignData, audience: 'selected_customers'})} className="hidden" />
                    <CheckSquare size={32} className={campaignData.audience === 'selected_customers' ? 'text-[#C5A059]' : 'text-gray-400'} />
                    <span className="font-bold text-[#2C2C2C] text-center">{isRTL ? 'تحديد مخصص' : 'Custom Select'}</span>
                  </label>

                  <label className={`flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all ${campaignData.audience === 'excel' ? 'border-[#C5A059] bg-[#C5A059]/5 shadow-md scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}>
                    <input type="radio" name="audience" checked={campaignData.audience === 'excel'} onChange={() => setCampaignData({...campaignData, audience: 'excel'})} className="hidden" />
                    <FileUp size={32} className={campaignData.audience === 'excel' ? 'text-[#C5A059]' : 'text-gray-400'} />
                    <span className="font-bold text-[#2C2C2C] text-center">{isRTL ? 'رفع ملف إكسل' : 'Upload Excel'}</span>
                  </label>
                </div>
                
                {/* قسم اختيار العملاء المخصصين */}
                {campaignData.audience === 'selected_customers' && (
                  <div className="mt-6 p-6 border border-gray-200 bg-gray-50 rounded-2xl animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-[#2C2C2C]">{isRTL ? 'اختر العملاء للحملة:' : 'Select customers for campaign:'}</h4>
                      <span className="text-xs font-bold text-white bg-[#C5A059] px-2 py-1 rounded-md">{campaignData.selectedCustomers.length} {isRTL ? 'محدد' : 'Selected'}</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {storeCustomers.map(c => (
                        <label key={c.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-[#C5A059] transition-colors shadow-sm">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={campaignData.selectedCustomers.includes(c.id)}
                              onChange={(e) => {
                                const selected = e.target.checked 
                                  ? [...campaignData.selectedCustomers, c.id]
                                  : campaignData.selectedCustomers.filter(id => id !== c.id);
                                setCampaignData({...campaignData, selectedCustomers: selected});
                              }}
                              className="w-5 h-5 accent-[#C5A059]" 
                            />
                            <span className="font-bold text-sm text-[#2C2C2C]">{c.full_name}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100" dir="ltr">
                            {campaignData.channel === 'whatsapp' ? (c.phone || 'لا يوجد رقم') : (c.email || 'لا يوجد إيميل')}
                          </span>
                        </label>
                      ))}
                      {storeCustomers.length === 0 && <p className="text-gray-500 text-sm">{isRTL ? 'لا يوجد عملاء مسجلين حالياً.' : 'No registered customers found.'}</p>}
                    </div>
                  </div>
                )}

                {/* قسم رفع ملف الإكسل */}
                {campaignData.audience === 'excel' && (
                  <div className="mt-6 p-8 border-2 border-dashed border-[#C5A059] bg-[#C5A059]/5 rounded-2xl text-center animate-in slide-in-from-top-2">
                    <input type="file" accept=".xlsx, .xls, .csv" className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#C5A059] file:text-white hover:file:bg-[#b08d4b] cursor-pointer" />
                    <p className="text-sm text-gray-500 mt-4">{isRTL ? 'يجب أن يحتوي الملف على عمود باسم Phone للواتساب، أو Email للإيميل.' : 'File must contain Phone or Email column'}</p>
                  </div>
                )}
              </div>

                
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'نص الحملة' : 'Campaign Message'}</label>
                <textarea 
                  rows={6} 
                  value={campaignData.message} 
                  onChange={e => setCampaignData({...campaignData, message: e.target.value})} 
                  className="w-full p-5 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] bg-gray-50 resize-none leading-relaxed" 
                  placeholder={isRTL ? 'اكتب رسالتك الإعلانية هنا، وتذكر أن تجعلها جذابة...' : 'Write your promotional message here...'} 
                  required
                ></textarea>
                
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl transition-colors font-bold text-sm border border-gray-200">
                      <Paperclip size={20} className="text-[#C5A059]"/> {isRTL ? 'إرفاق ملف' : 'Attach Media'}
                      <input type="file" className="hidden" accept="image/*,video/mp4,application/pdf" onChange={handleFileUpload} />
                    </label>
                    
                    {/* عرض اسم الملف المرفق وإمكانية حذفه */}
                    {mediaFile && (
                      <div className="flex items-center gap-2 bg-[#C5A059]/10 text-[#C5A059] px-4 py-2 rounded-lg border border-[#C5A059]/20">
                        <span className="text-sm font-bold truncate max-w-[150px]" dir="ltr">{mediaFile.name}</span>
                        <button type="button" onClick={() => setMediaFile(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">X</button>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {isRTL ? 'الحد الأقصى 16 ميجابايت (WhatsApp)' : 'Max 16MB for WhatsApp'}
                  </span>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-[#2C2C2C] text-white font-bold text-lg rounded-2xl hover:bg-[#C5A059] transition-all shadow-xl flex justify-center items-center gap-3 group">
                <Send size={24} className="group-hover:-translate-x-1 group-hover:-translate-y-1 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" /> 
                {isRTL ? 'إطلاق الحملة الآن' : 'Launch Campaign Now'}
              </button>
              
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

