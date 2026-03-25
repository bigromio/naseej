import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface User {
  id: string;
  full_name: string;
  email?: string;
  phone: string;
  role: 'customer' | 'owner' | 'manager' | 'employee';
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
  gallery?: string[]; // معرض الصور
  video_url?: string; // رابط الفيديو
  is_dynamic_size: boolean;
  collection_id?: string;
}

interface StoreState {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  
  user: User | null;
  setUser: (user: User | null) => void;
  
  products: Product[];
  isLoadingProducts: boolean;
  productsError: string | null;
  fetchProducts: () => Promise<void>;

  // إعدادات الموقع (للبنرات والبوب-أب)
  siteSettings: any;
  fetchSiteSettings: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  language: 'ar',
  setLanguage: (lang) => set({ language: lang }),
  
  user: null,
  setUser: (user) => set({ user }),
  
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
  }
}));