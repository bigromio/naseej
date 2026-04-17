import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { 
  Users, Plus, Trash2, ExternalLink, ShieldCheck, 
  ShieldAlert, Clock, FileText, Phone, Mail, Loader2, Server, Save
} from 'lucide-react';

export const AdminSuppliers = () => {
  const { language } = useStore();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // 🌟 حالات نافذة إضافة مورد 🌟
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    responsible_person: '',
    contact_phone: '',
    contact_email: ''
  });

  // ==========================================
  // 1. جلب البيانات
  // ==========================================
  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ==========================================
  // 2. وظائف الإدارة
  // ==========================================
  // 🌟 دالة حفظ المورد الجديد من النافذة 🌟
  const submitNewSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return alert(isRTL ? 'يرجى إدخال اسم المورد' : 'Supplier name is required');
    
    setIsSaving(true);
    try {
      const { data, error } = await supabase.from('suppliers').insert([{
        name: newSupplier.name,
        responsible_person: newSupplier.responsible_person,
        contact_phone: newSupplier.contact_phone,
        contact_email: newSupplier.contact_email,
        type: activeTab,
        status: activeTab === 'local' ? 'pending_approval' : 'approved'
      }]).select();

      if (error) throw error;
      
      setSuppliers([data[0], ...suppliers]);
      setIsAddModalOpen(false); // إغلاق النافذة
      setNewSupplier({ name: '', responsible_person: '', contact_phone: '', contact_email: '' }); // تفريغ الحقول
      alert(isRTL ? 'تم إضافة المورد بنجاح!' : 'Supplier added successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSupplierStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      setSuppliers(suppliers.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShieldCheck size={14}/> {isRTL ? 'معتمد' : 'Approved'}</span>;
      case 'pending_approval':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={14}/> {isRTL ? 'تحت الاعتماد' : 'Pending'}</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShieldAlert size={14}/> {isRTL ? 'مرفوض' : 'Rejected'}</span>;
      default:
        return null;
    }
  };

  // ==========================================
  // 3. دوال التواصل والاعتماد
  // ==========================================
  const handleSendApprovalLink = (supplier: any) => {
    let phone = prompt(isRTL ? 'أدخل رقم واتساب المورد (مع رمز الدولة):' : 'Enter supplier WhatsApp number (with country code):', supplier.contact_phone || '966');
    if (!phone) return;
    
    // حفظ الرقم إذا كان جديداً
    if (phone !== supplier.contact_phone) {
      supabase.from('suppliers').update({ contact_phone: phone }).eq('id', supplier.id).then();
    }

    const portalLink = `${window.location.origin}/supplier-portal/${supplier.id}`;
    const message = isRTL 
      ? `مرحباً بك كشريك محتمل مع نسيج 🤝\nيسعدنا انضمامك لقائمة موردينا. يرجى التكرم بزيارة الرابط التالي لرفع مستندات الاعتماد (السجل التجاري، العنوان الوطني، بيانات الحساب البنكي للمؤسسة) لكي نتمكن من البدء في إرسال أوامر التصنيع:\n\n${portalLink}`
      : `Welcome as a potential partner with Naseej 🤝\nPlease complete your approval profile by uploading your CR, National Address, and IBAN here:\n\n${portalLink}`;
    
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const saveApiKey = async (id: string, apiKey: string) => {
    try {
      const { error } = await supabase.from('suppliers').update({ api_key: apiKey }).eq('id', id);
      if (error) throw error;
      alert(isRTL ? 'تم حفظ مفتاح الربط (API Key) بنجاح!' : 'API Key saved successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!window.confirm(isRTL ? `هل أنت متأكد من حذف المورد "${name}" نهائياً؟` : `Delete supplier "${name}"?`)) return;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredSuppliers = suppliers.filter(s => s.type === activeTab);

  // ==========================================
  // 4. واجهة المستخدم (UI)
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 🌟 رأس الصفحة 🌟 */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-col sm:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2 flex items-center gap-2">
            <Users className="text-[#C5A059]" /> {isRTL ? 'إدارة الموردين والشركاء' : 'Suppliers & Partners'}
          </h2>
          <p className="text-gray-500 text-sm">{isRTL ? 'إدارة الورش المحلية، ملفات الاعتماد، والربط مع الدروبشيبينج الدولي.' : 'Manage local workshops, approval files, and international dropshipping.'}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} // 👈 تعديل هنا لفتح النافذة
          className="bg-[#2C2C2C] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#C5A059] transition-colors flex items-center gap-2 shadow-md w-full sm:w-auto justify-center"
        >
          <Plus size={20}/> {isRTL ? 'إضافة مورد جديد' : 'Add New Supplier'}
        </button>
      </div>

      {/* 🌟 أزرار التبديل (Tabs) 🌟 */}
      <div className="flex gap-4 border-b border-gray-200 px-2 overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('local')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'local' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <ShieldCheck size={20} /> {isRTL ? 'الموردين المحليين (نظام الاعتماد)' : 'Local Suppliers'}
        </button>
        <button onClick={() => setActiveTab('international')} className={`shrink-0 flex items-center gap-2 pb-4 px-4 font-bold text-lg border-b-2 transition-colors ${activeTab === 'international' ? 'border-[#C5A059] text-[#C5A059]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Server size={20} /> {isRTL ? 'الموردين الدوليين (API Dropshipping)' : 'International (API)'}
        </button>
      </div>

      {/* 🌟 قائمة الموردين 🌟 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-0 animate-in fade-in">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold">{isRTL ? 'لا يوجد موردين مضافين في هذا القسم.' : 'No suppliers added in this section.'}</p>
          </div>
        ) : (
          <table className="w-full text-start">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'اسم المورد' : 'Supplier Name'}</th>
                {activeTab === 'local' && <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'الحالة والاعتماد' : 'Status'}</th>}
                {activeTab === 'local' && <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'ملفات الاعتماد' : 'Approval Files'}</th>}
                {activeTab === 'international' && <th className="p-4 text-start font-bold text-gray-600">{isRTL ? 'مفتاح الربط (API Key)' : 'API Key'}</th>}
                <th className="p-4 text-center font-bold text-gray-600">{isRTL ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  
                  {/* اسم المورد ومعلومات الاتصال */}
                  <td className="p-4">
                    <div className="font-bold text-[#2C2C2C] text-lg mb-1">{supplier.name}</div>
                    <div className="text-sm text-gray-500 font-mono" dir="ltr">{supplier.id.split('-')[0]}***</div>
                  </td>

                  {/* حالة الاعتماد (للمحليين فقط) */}
                  {activeTab === 'local' && (
                    <td className="p-4">
                      {getStatusBadge(supplier.status)}
                      {supplier.status === 'pending_approval' && (
                        <button 
                          onClick={() => handleSendApprovalLink(supplier)}
                          className="mt-2 text-[10px] bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-md font-bold flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink size={12}/> {isRTL ? 'إرسال رابط الاعتماد للواتساب' : 'Send WhatsApp Link'}
                        </button>
                      )}
                    </td>
                  )}

                  {/* ملفات الاعتماد (للمحليين فقط) */}
                  {activeTab === 'local' && (
                    <td className="p-4">
                      {supplier.cr_file || supplier.iban_file ? (
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-bold text-[#2C2C2C]">{isRTL ? 'المؤسسة:' : 'Est:'} <span className="text-[#C5A059]">{supplier.establishment_name || 'غير متوفر'}</span></div>
                          <div className="flex gap-2">
                            {supplier.cr_file && <a href={supplier.cr_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1"><FileText size={12}/> السجل</a>}
                            {supplier.address_file && <a href={supplier.address_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1"><FileText size={12}/> العنوان</a>}
                            {supplier.iban_file && <a href={supplier.iban_file} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs flex items-center gap-1"><FileText size={12}/> الآيبان</a>}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono" dir="ltr">{supplier.iban_number}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{isRTL ? 'لم يقم برفع الملفات بعد' : 'No files uploaded yet'}</span>
                      )}
                    </td>
                  )}

                  {/* مفتاح الربط (للدوليين فقط) */}
                  {activeTab === 'international' && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="password" 
                          defaultValue={supplier.api_key || ''} 
                          onBlur={(e) => saveApiKey(supplier.id, e.target.value)}
                          placeholder={isRTL ? 'أدخل الـ API Key الخاص بالمورد هنا' : 'Enter API Key here'}
                          className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-[#C5A059] font-mono text-sm bg-gray-50"
                        />
                        <button className="text-gray-400 hover:text-[#C5A059] transition-colors" title="يتم الحفظ تلقائياً عند النقر خارج الحقل"><Save size={18}/></button>
                      </div>
                    </td>
                  )}

                  {/* الإجراءات */}
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {activeTab === 'local' && supplier.status === 'pending_approval' && (
                        <button 
                          onClick={() => updateSupplierStatus(supplier.id, 'approved')}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors title='اعتماد المورد'"
                        >
                          <ShieldCheck size={18}/>
                        </button>
                      )}
                      {activeTab === 'local' && supplier.status === 'pending_approval' && (
                        <button 
                          onClick={() => updateSupplierStatus(supplier.id, 'rejected')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition-colors title='رفض الاعتماد'"
                        >
                          <ShieldAlert size={18}/>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                        className="bg-red-50 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-colors title='حذف المورد'"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* 🌟 نافذة إضافة مورد جديد 🌟 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#2C2C2C] p-6 text-white">
              <h2 className="text-xl font-bold">{isRTL ? 'إضافة مورد / شريك جديد' : 'Add New Supplier'}</h2>
              <p className="text-gray-400 text-sm mt-1">
                {isRTL ? `سيتم إضافته كمورد (${activeTab === 'local' ? 'محلي' : 'دولي'})` : `Adding as ${activeTab} supplier`}
              </p>
            </div>
            
            <form onSubmit={submitNewSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'اسم المورد / الورشة / الشركة *' : 'Supplier / Company Name *'}</label>
                <input type="text" required value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'اسم الشخص المسؤول' : 'Responsible Person'}</label>
                <input type="text" value={newSupplier.responsible_person} onChange={e => setNewSupplier({...newSupplier, responsible_person: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'رقم الجوال (واتساب)' : 'Mobile (WhatsApp)'}</label>
                  <input type="tel" value={newSupplier.contact_phone} onChange={e => setNewSupplier({...newSupplier, contact_phone: e.target.value})} placeholder="9665..." className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{isRTL ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input type="email" value={newSupplier.contact_email} onChange={e => setNewSupplier({...newSupplier, contact_email: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-gray-50 font-mono" dir="ltr" />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : (isRTL ? 'إضافة المورد' : 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};