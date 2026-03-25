import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Trash2, ClipboardList, X, Save, Edit2, Loader2, Phone, Mail } from 'lucide-react';

export const AdminDashboard = () => {
  const { language, user: currentUser } = useStore();
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<'team' | 'customers'>('team');
  const [team, setTeam] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // حالات النوافذ المنبثقة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({ id: '', full_name: '', phone: '', email: '', role: 'employee' });
  const [taskData, setTaskData] = useState({ title: '', description: '' });

  const text = {
    ar: {
      tabTeam: 'إدارة الموظفين', tabCustomers: 'العملاء', searchEmp: 'ابحث...', 
      addEmp: 'إضافة موظف', addCust: 'إضافة عميل', editUser: 'تعديل البيانات',
      name: 'الاسم', phone: 'الجوال', email: 'الإيميل', role: 'الصلاحية', actions: 'إجراءات',
      assignTask: 'إسناد مهمة', delete: 'حذف', edit: 'تعديل', cancel: 'إلغاء', save: 'حفظ التغييرات',
      taskTitle: 'عنوان المهمة', taskDesc: 'وصف المهمة', successMsg: 'تمت العملية بنجاح!',
    },
    en: {
      tabTeam: 'Team', tabCustomers: 'Customers', searchEmp: 'Search...', 
      addEmp: 'Add Employee', addCust: 'Add Customer', editUser: 'Edit Data',
      name: 'Name', phone: 'Phone', email: 'Email', role: 'Role', actions: 'Actions',
      assignTask: 'Assign Task', delete: 'Delete', edit: 'Edit', cancel: 'Cancel', save: 'Save Changes',
      taskTitle: 'Task Title', taskDesc: 'Task Description', successMsg: 'Operation successful!',
    }
  };
  const t = text[language as keyof typeof text];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: teamData } = await supabase.from('users').select('*').in('role', ['owner', 'manager', 'employee']).order('created_at', { ascending: true });
      const { data: custData } = await supabase.from('users').select('*').eq('role', 'customer').order('created_at', { ascending: false });
      if (teamData) setTeam(teamData);
      if (custData) setCustomers(custData);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // فتح نافذة الإضافة
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', full_name: '', phone: '', email: '', role: activeTab === 'team' ? 'employee' : 'customer' });
    setIsModalOpen(true);
  };

  // فتح نافذة التعديل مع تعبئة البيانات
  const openEditModal = (user: any) => {
    setModalMode('edit');
    setFormData({ id: user.id, full_name: user.full_name, phone: user.phone, email: user.email || '', role: user.role });
    setIsModalOpen(true);
  };

  // معالجة الحفظ (إضافة أو تعديل)
  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { full_name: formData.full_name, phone: formData.phone, email: formData.email, role: formData.role };
      
      if (modalMode === 'add') {
        const { error } = await supabase.from('users').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('users').update(payload).eq('id', formData.id);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) { alert(error.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    try { await supabase.from('users').delete().eq('id', id); fetchData(); } 
    catch (error: any) { alert(error.message); }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tasks').insert([{ assigned_to: selectedUser.id, assigned_by: currentUser?.id, title: taskData.title, description: taskData.description }]);
      if (error) throw error;
      alert(t.successMsg);
      setIsTaskModalOpen(false); setTaskData({ title: '', description: '' });
    } catch (error: any) { alert(error.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex bg-white p-1 rounded-xl w-fit shadow-sm border border-gray-100">
        <button onClick={() => setActiveTab('team')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'team' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:text-black'}`}>{t.tabTeam}</button>
        <button onClick={() => setActiveTab('customers')} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'customers' ? 'bg-[#2C2C2C] text-white' : 'text-gray-500 hover:text-black'}`}>{t.tabCustomers}</button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full sm:w-1/3 mb-4 sm:mb-0">
          <Search className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400`} size={20} />
          <input type="text" placeholder={t.searchEmp} className={`w-full p-3 ${isRTL ? 'pr-10' : 'pl-10'} border border-gray-200 rounded-xl outline-none focus:border-[#C5A059] bg-white`} />
        </div>
        <button onClick={openAddModal} className="px-6 py-3 bg-[#C5A059] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#b08d4b] shadow-lg shadow-[#C5A059]/20">
          <Plus size={20} /> {activeTab === 'team' ? t.addEmp : t.addCust}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="p-4 font-bold">{t.name}</th>
                <th className="p-4 font-bold">{t.phone}</th>
                <th className="p-4 font-bold">{t.email}</th>
                <th className="p-4 font-bold">{activeTab === 'team' ? t.role : ''}</th>
                <th className="p-4 font-bold text-center">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {(activeTab === 'team' ? team : customers).map(person => (
                <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-[#2C2C2C]">{person.full_name}</td>
                  <td className="p-4 text-gray-500" dir="ltr">{person.phone}</td>
                  <td className="p-4 text-gray-500">{person.email || '-'}</td>
                  <td className="p-4 text-[#C5A059] font-bold uppercase">{activeTab === 'team' ? person.role : ''}</td>
                  <td className="p-4 flex justify-center gap-2">
                    
                    {/* زر التعديل (جديد) */}
                    <button onClick={() => openEditModal(person)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title={t.edit}><Edit2 size={18}/></button>
                    
                    {activeTab === 'team' && person.role !== 'owner' && (
                      <button onClick={() => { setSelectedUser(person); setIsTaskModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title={t.assignTask}><ClipboardList size={18}/></button>
                    )}
                    {activeTab === 'customers' && (
                      <>
                        <button className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"><Phone size={18}/></button>
                        <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Mail size={18}/></button>
                      </>
                    )}
                    {person.role !== 'owner' && (
                      <button onClick={() => handleDeleteUser(person.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title={t.delete}><Trash2 size={18}/></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------- نافذة التعديل والإضافة الموحدة ----------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg">
                {modalMode === 'add' ? (activeTab === 'team' ? t.addEmp : t.addCust) : t.editUser}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmitUser} className="p-6 space-y-4">
              <div><label className="block text-sm font-bold mb-1">{t.name}</label><input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-3 border rounded-xl" /></div>
              <div><label className="block text-sm font-bold mb-1">{t.phone}</label><input required type="tel" dir="ltr" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl text-right" placeholder="05XXXXXXXX" /></div>
              <div><label className="block text-sm font-bold mb-1">{t.email}</label><input type="email" dir="ltr" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border rounded-xl text-right" /></div>
              
              {activeTab === 'team' && (
                <div>
                  <label className="block text-sm font-bold mb-1">{t.role}</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-xl" disabled={formData.role === 'owner'}>
                    <option value="employee">موظف (Employee)</option>
                    <option value="manager">مدير (Manager)</option>
                    {formData.role === 'owner' && <option value="owner">المالك (Owner)</option>}
                  </select>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">{t.cancel}</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[#C5A059] text-white font-bold rounded-xl hover:bg-[#b08d4b] flex justify-center items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {t.save}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- نافذة إسناد مهمة ----------------- */}
      {isTaskModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#2C2C2C] text-white">
              <h3 className="font-bold text-lg">{t.assignTask} - {selectedUser.full_name}</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              <div><label className="block text-sm font-bold mb-1">{t.taskTitle}</label><input required type="text" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} className="w-full p-3 border rounded-xl focus:border-[#C5A059] outline-none" /></div>
              <div><label className="block text-sm font-bold mb-1">{t.taskDesc}</label><textarea required rows={4} value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} className="w-full p-3 border rounded-xl focus:border-[#C5A059] outline-none" /></div>
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-black flex justify-center items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><ClipboardList size={20}/> إرسال المهمة</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};