import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Filter, ChevronDown, Search, ShoppingBag } from 'lucide-react';

export const Shop = () => {
  const { language, products, fetchProducts, addToCart } = useStore();
  const isRTL = language === 'ar';

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    window.scrollTo(0,0);
  }, [products.length, fetchProducts]);

  // استخراج الأقسام ديناميكياً
  const categories = ['all', ...Array.from(new Set(products.map(p => isRTL ? p.category_ar : p.category_en).filter(Boolean)))];

  // تصفية المنتجات
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || (isRTL ? product.category_ar : product.category_en) === activeCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (product.title_ar?.toLowerCase().includes(searchLower)) || (product.title_en?.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      
      {/* رأس صفحة المتجر */}
      <div className="bg-[#2C2C2C] py-20 text-center border-b-4 border-[#C5A059]">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md">{isRTL ? 'تسوق مجموعاتنا' : 'Shop Our Collections'}</h1>
        
        {/* شريط البحث */}
        <div className="max-w-xl mx-auto px-4 relative">
          <input 
            type="text" 
            placeholder={isRTL ? 'ابحث عن أثاث، غرف نوم، كنب...' : 'Search for furniture, sofas...'} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 pr-12 bg-white rounded-full outline-none focus:ring-2 ring-[#C5A059] text-[#2C2C2C] font-medium shadow-xl"
          />
          <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-8' : 'left-8'}`} size={20} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* فلتر الأقسام */}
        <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-10 custom-scrollbar">
          <div className="flex items-center gap-2 text-gray-500 font-bold shrink-0">
            <Filter size={20}/> {isRTL ? 'تصنيف:' : 'Filter:'}
          </div>
          {categories.map((cat, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveCategory(cat as string)}
              className={`shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${activeCategory === cat ? 'bg-[#C5A059] border-[#C5A059] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-[#C5A059] hover:text-[#C5A059]'}`}
            >
              {cat === 'all' ? (isRTL ? 'الكل' : 'All') : cat as string}
            </button>
          ))}
        </div>

        {/* شبكة المنتجات */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-400">{isRTL ? 'لا توجد منتجات تطابق بحثك.' : 'No products found matching your search.'}</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
                
                {product.discount_price && (
                  <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-md`}>
                    {isRTL ? 'عرض خاص' : 'Sale'}
                  </div>
                )}

                {/* 🌟 زر الإضافة السريعة للسلة 🌟 */}
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // لمنع الانتقال لصفحة المنتج عند الضغط على الزر
                    addToCart(product, 1);
                  }}
                  className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-white text-[#2C2C2C] p-3 rounded-full z-20 shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-[#C5A059] hover:text-white`}
                  title={isRTL ? 'إضافة سريعة للسلة' : 'Quick Add'}
                >
                  <ShoppingBag size={20} />
                </button>

                <Link to={`/product/${product.id}`} className="aspect-[4/5] relative overflow-hidden bg-gray-50 block">
                  <img src={product.image_lifestyle || product.image_white_bg} alt={isRTL ? product.title_ar : product.title_en} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-[#C5A059] text-xs font-bold tracking-wider uppercase mb-2">{isRTL ? product.category_ar : product.category_en}</p>
                  <Link to={`/product/${product.id}`} className="font-bold text-[#2C2C2C] text-lg mb-3 line-clamp-2 hover:text-[#C5A059] transition-colors">
                    {isRTL ? product.title_ar : product.title_en}
                  </Link>
                  <div className="mt-auto flex items-center gap-3">
                    <span className="text-xl font-bold text-[#2C2C2C]">{product.discount_price || product.base_price} {isRTL ? 'ر.س' : 'SAR'}</span>
                    {product.discount_price && <span className="text-sm text-gray-400 line-through">{product.base_price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};