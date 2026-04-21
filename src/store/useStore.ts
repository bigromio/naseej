import { create } from 'zustand';
import { supabase } from '@/lib/supabase';


export interface HomeSection {
  id: string;
  is_active: boolean;
  sort_order: number;
  style_type: string;
  content_ar: any;
  content_en: any;
}

export interface Page {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  show_in_navbar: boolean;
  show_in_footer: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'employee' | 'customer';
  address?: string; // 👈 إضافة هذا السطر لحل مشكلة النوع (Type)
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  title_ar: string;
  title_en: string;
  category_ar: string;
  category_en: string;
  sub_category_ar: string;
  sub_category_en: string;
  short_desc_ar: string;
  short_desc_en: string;
  long_desc_ar: string;
  long_desc_en: string;
  base_price: number;
  discount_price?: number | null;
  supply_price?: number; // التكلفة التي ذكرتها
  image_lifestyle: string;
  image_blueprint?: string; // الذي نضع فيه البرومبت حالياً
  video_url?: string;
  gallery?: string[] | string; // مصفوفة أو نص مفصول بـ |
  is_dynamic_size: boolean;
  is_active: boolean;
  collection_id?: string;
  collection_name_ar?: string; // العمود الجديد للمجموعات
  collection_name_en?: string;
  
  // 🌟 إضافة هذه الخصائص لحل الخطأ 🌟
  width_cm: number;
  length_cm: number;
  height_cm: number;
  weight_kg?: number; // عمود الوزن الذي ستحتاجه
}

export interface CartItem extends Product {
  quantity: number;
}

// 🌟 دالة مساعدة لتوليد جلسة للعميل (حتى لو كان زائراً غير مسجل) 🌟
const getSessionId = () => {
  let sid = localStorage.getItem('naseej_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('naseej_session', sid);
  }
  return sid;
};

// 🌟 دالة مساعدة لرفع السلة لقاعدة البيانات (لصيد السلات المتروكة) 🌟
const syncCartToDB = async (cart: CartItem[], userId?: string) => {
  try {
    await supabase.from('carts').upsert({
      session_id: getSessionId(),
      user_id: userId || null,
      items: cart,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });
  } catch (err) {
    console.error('Error syncing cart:', err);
  }
};

interface StoreState {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  
  user: User | null;
  loginTimestamp: number | null;
  setUser: (user: User | null) => void;
  checkSession: () => void;
  
  
  products: Product[];
  isLoadingProducts: boolean;
  productsError: string | null;
  fetchProducts: () => Promise<void>;

  // نظام السلة العائمة
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  initCart: () => Promise<void>;
  // إعدادات الموقع (للبنرات والبوب-أب)
  siteSettings: any;
  fetchSiteSettings: () => Promise<void>;

  
  homeSections: HomeSection[];
  fetchHomeSections: () => Promise<void>;

  pages: Page[];
  fetchPages: () => Promise<void>;
}


export const useStore = create<StoreState>((set, get) => ({ // 👈 أضفنا get هنا
  language: 'ar',
  setLanguage: (lang) => set({ language: lang }),
  
  // سحب البيانات المحفوظة مسبقاً (إن وجدت)
  user: JSON.parse(localStorage.getItem('naseej_user') || 'null'),
  loginTimestamp: localStorage.getItem('naseej_user') ? Date.now() : null,
  
  // دالة الحفظ: تحفظ في الحالة وفي المتصفح معاً
  setUser: (user) => {
    if (user) {
      localStorage.setItem('naseej_user', JSON.stringify(user));
      // ربط سلة الزائر بحسابه فور تسجيل الدخول
      syncCartToDB(useStore.getState().cart, user.id);
    } else {
      localStorage.removeItem('naseej_user');
    }
    set({ user, loginTimestamp: user ? Date.now() : null });
  },
  
  checkSession: () => {
    const { user, setUser } = get();
    if (user) {
      const lastActivity = localStorage.getItem('naseej_last_activity');
      const now = new Date().getTime();
      
      // إذا مر 24 ساعة (86400000 مللي ثانية) على آخر نشاط، يتم طرد المستخدم
      if (lastActivity && now - parseInt(lastActivity) > 86400000) {
        alert('انتهت صلاحية الجلسة لأسباب أمنية، يرجى تسجيل الدخول من جديد.');
        setUser(null); 
        localStorage.removeItem('naseej-storage'); // مسح التخزين المحلي تماماً
        localStorage.removeItem('naseej_last_activity');
        window.location.href = '/auth'; // إجباره على العودة لصفحة الدخول
      } else {
        // تحديث وقت آخر نشاط
        localStorage.setItem('naseej_last_activity', now.toString());
      }
    }
  },
  
  products: [],
  isLoadingProducts: false,
  productsError: null,
  

  fetchProducts: async () => {
    set({ isLoadingProducts: true, productsError: null });
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      set({ products: data as Product[], isLoadingProducts: false });
    } catch (err: any) {
      console.error('Error fetching products:', err.message);
      set({ productsError: err.message, isLoadingProducts: false });
    }
  },

  // تنفيذ نظام السلة العائمة
  // 🌟 تنفيذ نظام السلة الذكي (المربوط بقاعدة البيانات) 🌟
  cart: [],
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  
  // جلب السلة من قاعدة البيانات عند فتح الموقع
  initCart: async () => {
    try {
      const { data } = await supabase.from('carts').select('items').eq('session_id', getSessionId()).single();
      if (data && data.items) {
        set({ cart: data.items });
      }
    } catch (e) { console.error(e); }
  },
  
  addToCart: (product, quantity = 1) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    const newCart = existing 
      ? state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
      : [...state.cart, { ...product, quantity }];
    
    syncCartToDB(newCart, state.user?.id); // رفع السلة للقاعدة
    return { cart: newCart, isCartOpen: true };
  }),
  
  removeFromCart: (productId) => set((state) => {
    const newCart = state.cart.filter(item => item.id !== productId);
    syncCartToDB(newCart, state.user?.id); // تحديث القاعدة
    return { cart: newCart };
  }),
  
  updateQuantity: (id, quantity) => set((state) => {
    const newCart = state.cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item);
    syncCartToDB(newCart, state.user?.id); // تحديث القاعدة
    return { cart: newCart };
  }),
  
  clearCart: () => set((state) => {
    syncCartToDB([], state.user?.id); // تفريغ السلة من القاعدة بعد الشراء
    return { cart: [] };
  }),

  siteSettings: {},
  fetchSiteSettings: async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.id]: curr }), {});
        set({ siteSettings: mapped });
      }
    } catch (err) { console.error('Error fetching site settings:', err); }
  },

  homeSections: [],
  fetchHomeSections: async () => {
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      set({ homeSections: data as HomeSection[] });
    } catch (err) { console.error('Error fetching home sections:', err); }
  },

  pages: [],
  fetchPages: async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      set({ pages: data as Page[] });
    } catch (err) { console.error('Error fetching pages:', err); }
  }
}));

