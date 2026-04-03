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
  discount_price?: number | null; // السعر بعد الخصم
  image_lifestyle: string;
  image_white_bg?: string;
  gallery?: string[]; // معرض الصور
  video_url?: string; // رابط الفيديو
  is_dynamic_size: boolean;
  collection_id?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

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
  // إعدادات الموقع (للبنرات والبوب-أب)
  siteSettings: any;
  fetchSiteSettings: () => Promise<void>;

  
  homeSections: HomeSection[];
  fetchHomeSections: () => Promise<void>;

  pages: Page[];
  fetchPages: () => Promise<void>;
}


export const useStore = create<StoreState>((set) => ({
  language: 'ar',
  setLanguage: (lang) => set({ language: lang }),
  
  // سحب البيانات المحفوظة مسبقاً (إن وجدت)
  user: JSON.parse(localStorage.getItem('naseej_user') || 'null'),
  loginTimestamp: localStorage.getItem('naseej_user') ? Date.now() : null,
  
  // دالة الحفظ: تحفظ في الحالة وفي المتصفح معاً
  setUser: (user) => {
    if (user) {
      localStorage.setItem('naseej_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('naseej_user');
    }
    set({ user, loginTimestamp: user ? Date.now() : null });
  },
  
  checkSession: () => set((state) => {
    if (state.user && state.loginTimestamp) {
      // 20 دقيقة = 20 * 60 * 1000 مللي ثانية
      const isExpired = (Date.now() - state.loginTimestamp) > 20 * 60 * 1000;
      if (isExpired) {
        alert(state.language === 'ar' ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.' : 'Session expired. Please login again.');
        return { user: null, loginTimestamp: null };
      }
    }
    return state; // إذا لم تنتهِ الجلسة، أعد الحالة كما هي
  }),
  
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
  cart: [],
  isCartOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  
  addToCart: (product, quantity = 1) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      // إذا كان المنتج موجوداً، نزيد الكمية ونفتح السلة تلقائياً
      return { 
        cart: state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item),
        isCartOpen: true 
      };
    }
    // إذا كان منتجاً جديداً
    return { cart: [...state.cart, { ...product, quantity }], isCartOpen: true };
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  updateQuantity: (id, quantity) => set((state) => ({
    cart: state.cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)
  })),
  clearCart: () => set({ cart: [] }),
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

