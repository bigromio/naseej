import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Loader2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Shop = () => {
  const { language, products, isLoadingProducts, productsError, fetchProducts } = useStore();
  const isRTL = language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = ['All', ...new Set(products.map(p => isRTL ? p.category_ar : p.category_en).filter(Boolean))];
  const filteredProducts = selectedCategory === 'All' ? products : products.filter(p => (isRTL ? p.category_ar : p.category_en) === selectedCategory);

// 1. نسمي القاموس text
  const text = {
    ar: { title: 'المجموعات الحصرية', desc: 'تصفح أحدث إصدارات نسيج من الأثاث الفاخر.', all: 'الكل', filter: 'تصفية المنتجات', noProducts: 'لا توجد منتجات مطابقة.' },
    en: { title: 'Exclusive Collections', desc: 'Browse Naseej\'s latest luxury furniture editions.', all: 'All', filter: 'Filter Products', noProducts: 'No matching products.' }
  };
  
  // 2. نخبر النظام باختيار اللغة الحالية
  const t = text[language as keyof typeof text];

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#2C2C2C] mb-4">{t.title}</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">{t.desc}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="lg:hidden flex items-center gap-2 font-bold text-[#2C2C2C] bg-gray-100 p-3 rounded-lg w-fit">
          <Filter size={20} /> {t.filter}
        </button>

        <aside className={`${isMobileFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className="sticky top-32 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-lg mb-6 border-b pb-4">{isRTL ? 'الأقسام الرئيسية' : 'Categories'}</h3>
            <ul className="space-y-3">
              {categories.map((cat, idx) => (
                <li key={idx}>
                  <button onClick={() => setSelectedCategory(cat as string)} className={`text-sm w-full text-${isRTL ? 'right' : 'left'} transition-colors ${selectedCategory === cat ? 'text-[#C5A059] font-bold' : 'text-gray-500 hover:text-black'}`}>
                    {cat === 'All' ? t.all : (cat as string)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          {isLoadingProducts ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#C5A059]" size={48} /></div>
          ) : productsError ? (
            <div className="text-center text-red-500 py-10">{productsError}</div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col cursor-pointer bg-white rounded-2xl p-3 border border-transparent hover:border-gray-100 hover:shadow-lg transition-all duration-300 relative">
                  
                  {/* شارة الخصم (Sale Badge) */}
                  {product.discount_price && (
                    <div className={`absolute top-5 ${isRTL ? 'right-5' : 'left-5'} z-10 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md`}>
                      {isRTL ? 'خصم ' : 'Save '} {Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}%
                    </div>
                  )}

                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4">
                    <img src={product.image_lifestyle || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800'} alt={isRTL ? product.title_ar : product.title_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  
                  <div className="flex flex-col flex-grow px-2">
                    <span className="text-xs font-bold text-[#C5A059] mb-1">{isRTL ? product.sub_category_ar : product.sub_category_en}</span>
                    <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{isRTL ? product.title_ar : product.title_en}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{isRTL ? product.short_desc_ar : product.short_desc_en}</p>
                    
                    {/* تحديث منطقة السعر */}
                    <div className="text-lg font-bold mt-auto flex items-center gap-2 flex-wrap">
                      {product.discount_price ? (
                        <>
                          <span className="text-red-600">{product.discount_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
                          <span className="text-sm text-gray-400 line-through font-normal">{product.base_price.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-[#2C2C2C]">{product.base_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
                      )}
                      {product.is_dynamic_size && <span className="text-xs text-gray-400 font-normal mx-1">{isRTL ? '/ للمتر المربع' : '/ SQM'}</span>}
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-20">{t.noProducts}</div>
          )}
        </main>
      </div>
    </div>
  );
};