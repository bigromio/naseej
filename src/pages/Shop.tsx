import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Filter, ChevronDown, ShoppingBag, Heart, Star, Check } from 'lucide-react';

export const Shop = () => {
  const { language, products, fetchProducts, addToCart, user } = useStore();
  const isRTL = language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  // حالات الفلترة
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('all');
  const [activeColors, setActiveColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isFavorite, setIsFavorite] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    window.scrollTo(0, 0);
  }, [products.length, fetchProducts]);

  // 🌟 استقبال القسم المختار من الصفحة الرئيسية عبر الرابط
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
      setActiveSubCategory('all'); // إعادة ضبط القسم الفرعي
    }
  }, [searchParams]);

  useEffect(() => {
    // الصعود للأعلى بنعومة عند تغير القسم أو الفلتر
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, activeSubCategory]);
  
  // استخراج الأقسام الرئيسية
  const categories = ['all', ...Array.from(new Set(products.map(p => isRTL ? p.category_ar : p.category_en).filter(Boolean)))];

  // استخراج الأقسام الفرعية (تعتمد على القسم الرئيسي المختار)
  const availableSubCategories = useMemo(() => {
    const filteredForSub = products.filter(p => activeCategory === 'all' || (isRTL ? p.category_ar : p.category_en) === activeCategory);
    return ['all', ...Array.from(new Set(filteredForSub.map(p => isRTL ? p.sub_category_ar : p.sub_category_en).filter(Boolean)))];
  }, [products, activeCategory, isRTL]);

  // خيارات الألوان الذكية (مع كلمات البحث المطابقة في الوصف)
  const colorOptions = [
    { id: 'white', bg: '#FFFFFF', ar: 'أبيض', en: 'White', terms: ['أبيض', 'white', 'كريمي', 'cream'] },
    { id: 'black', bg: '#111111', ar: 'أسود', en: 'Black', terms: ['أسود', 'black', 'فحمي', 'charcoal'] },
    { id: 'gray', bg: '#888888', ar: 'رمادي', en: 'Gray', terms: ['رمادي', 'gray', 'grey'] },
    { id: 'beige', bg: '#F5F5DC', ar: 'بيج', en: 'Beige', terms: ['بيج', 'beige', 'كتان', 'linen'] },
    { id: 'brown', bg: '#8B4513', ar: 'بني/خشبي', en: 'Brown/Wood', terms: ['بني', 'brown', 'خشب', 'wood', 'جوز', 'بلوط', 'تيك'] },
    { id: 'gold', bg: '#D4AF37', ar: 'ذهبي/نحاسي', en: 'Gold/Brass', terms: ['ذهب', 'gold', 'نحاس', 'brass'] },
    { id: 'green', bg: '#4A5D23', ar: 'أخضر', en: 'Green', terms: ['أخضر', 'green', 'زيتي', 'olive', 'زمردي'] },
    { id: 'blue', bg: '#1C2841', ar: 'أزرق/كحلي', en: 'Blue/Navy', terms: ['أزرق', 'blue', 'كحلي', 'navy'] },
    { id: 'pink', bg: '#FFD1DC', ar: 'وردي', en: 'Pink', terms: ['وردي', 'pink', 'blush'] },
  ];

  // تصفية وترتيب المنتجات
  const filteredProducts = products
    .filter(product => {
      // 1. فلتر القسم الرئيسي
      const matchesCategory = activeCategory === 'all' || (isRTL ? product.category_ar : product.category_en) === activeCategory;
      
      // 2. فلتر القسم الفرعي
      const matchesSubCategory = activeSubCategory === 'all' || (isRTL ? product.sub_category_ar : product.sub_category_en) === activeSubCategory;
      
      // 3. فلتر الألوان الذكي (يبحث في العنوان والوصف القصير والطويل)
      const matchesColor = activeColors.length === 0 || activeColors.some(colorId => {
        const colorData = colorOptions.find(c => c.id === colorId);
        if (!colorData) return false;
        const searchableText = `${product.title_ar} ${product.title_en} ${product.short_desc_ar} ${product.long_desc_ar}`.toLowerCase();
        return colorData.terms.some(term => searchableText.includes(term));
      });

      return matchesCategory && matchesSubCategory && matchesColor;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return (a.discount_price || a.base_price) - (b.discount_price || b.base_price);
      if (sortBy === 'price-high') return (b.discount_price || b.base_price) - (a.discount_price || a.base_price);
      return 0; // الأحدث افتراضياً
    });

  const toggleFavorite = (productId: string) => {
    setIsFavorite(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const toggleColor = (colorId: string) => {
    setActiveColors(prev => prev.includes(colorId) ? prev.filter(id => id !== colorId) : [...prev, colorId]);
  };

  // دالة لتحديث الرابط عند تغيير القسم يدوياً
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSubCategory('all');
    setSearchParams(cat === 'all' ? {} : { category: cat });
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* مسار التنقل (Breadcrumbs) */}
        <nav className="flex py-8 text-sm text-gray-500 font-medium">
          <Link to="/" className="hover:text-[#C5A059] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span className="mx-2">/</span>
          <span className="text-[#C5A059]">{isRTL ? 'المتجر' : 'Shop'}</span>
        </nav>

        {/* أدوات التحكم (الفلتر والترتيب) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2">
              {activeCategory === 'all' ? (isRTL ? 'جميع المنتجات' : 'All Products') : activeCategory}
            </h1>
            <p className="text-gray-400 text-sm">
              {isRTL ? `عرض ${filteredProducts.length} منتج فريد` : `Showing ${filteredProducts.length} unique products`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 py-2.5 pl-4 pr-10 rounded-xl text-sm font-bold text-[#2C2C2C] outline-none focus:border-[#C5A059] cursor-pointer transition-all"
              >
                <option value="newest">{isRTL ? 'الأحدث أولاً' : 'Newest'}</option>
                <option value="price-low">{isRTL ? 'السعر: من الأقل' : 'Price: Low to High'}</option>
                <option value="price-high">{isRTL ? 'السعر: من الأعلى' : 'Price: High to Low'}</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* الجانب الأيمن: الفلاتر (Sidebar) */}
          <aside className="w-full lg:w-64 shrink-0 space-y-10 lg:sticky lg:top-28 h-fit max-h-[85vh] overflow-y-auto custom-scrollbar pb-10">
            
            {/* 1. الأقسام الرئيسية */}
            <div>
              <h3 className="text-lg font-bold text-[#2C2C2C] mb-4 flex items-center gap-2">
                <Filter size={18} className="text-[#C5A059]" /> {isRTL ? 'الأقسام' : 'Categories'}
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat, idx) => (
                  <button 
                    key={`main-${idx}`} 
                    onClick={() => handleCategoryChange(cat as string)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeCategory === cat ? 'bg-[#C5A059] text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>{cat === 'all' ? (isRTL ? 'الكل' : 'All') : cat as string}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. الأقسام الفرعية (تظهر فقط إذا كان هناك قسم رئيسي مختار أو للكل) */}
            {availableSubCategories.length > 1 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                  {isRTL ? 'النوع' : 'Sub-Category'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableSubCategories.map((sub, idx) => (
                    <button 
                      key={`sub-${idx}`} 
                      onClick={() => setActiveSubCategory(sub as string)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${activeSubCategory === sub ? 'bg-[#2C2C2C] text-white border-[#2C2C2C]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#C5A059] hover:text-[#C5A059]'}`}
                    >
                      {sub === 'all' ? (isRTL ? 'الكل' : 'All') : sub as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. فلتر الألوان (Color Swatches) */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">
                {isRTL ? 'اللون / الخامة' : 'Color / Material'}
              </h3>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((color) => {
                  const isActive = activeColors.includes(color.id);
                  return (
                    <button
                      key={color.id}
                      onClick={() => toggleColor(color.id)}
                      title={isRTL ? color.ar : color.en}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'border-[#C5A059] scale-110 shadow-md' : 'border-gray-200 hover:scale-110'}`}
                      style={{ backgroundColor: color.bg }}
                    >
                      {isActive && <Check size={16} color={color.id === 'white' || color.id === 'beige' ? '#000' : '#FFF'} />}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* الجانب الأيسر: شبكة المنتجات */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <h2 className="text-2xl font-bold text-gray-400">{isRTL ? 'لا توجد منتجات تطابق خياراتك.' : 'No products match your filters.'}</h2>
                <button onClick={() => {setActiveCategory('all'); setActiveSubCategory('all'); setActiveColors([]); setSearchParams({});}} className="mt-4 text-[#C5A059] font-bold hover:underline">
                  {isRTL ? 'مسح الفلاتر' : 'Clear Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
                    
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                      {product.discount_price ? (
                        <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-tighter">
                          {isRTL ? 'عرض خاص' : 'Sale'}
                        </div>
                      ) : <div />}
                      
                      <button 
                        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id); }}
                        className={`p-2.5 rounded-full shadow-lg transition-all transform active:scale-90 ${isFavorite[product.id] ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
                      >
                        <Heart size={18} fill={isFavorite[product.id] ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <Link to={`/product/${product.id}`} className="aspect-[4/5] relative overflow-hidden bg-gray-50 block">
                      <img 
                        src={product.image_lifestyle || 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'} 
                        alt={isRTL ? product.title_ar : product.title_en} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <button 
                        onClick={(e) => { e.preventDefault(); addToCart(product, 1); }}
                        className="absolute bottom-4 left-4 right-4 bg-[#2C2C2C] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-[#C5A059] shadow-xl"
                      >
                        <ShoppingBag size={18} />
                        {isRTL ? 'إضافة للسلة' : 'Add to Cart'}
                      </button>
                    </Link>
                    
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#C5A059] text-[10px] font-black tracking-[0.2em] uppercase">
                          {isRTL ? product.sub_category_ar : product.sub_category_en}
                        </span>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star size={12} fill="currentColor" />
                          <span className="text-gray-400 text-[10px] font-bold">4.8 (24)</span>
                        </div>
                      </div>

                      <Link to={`/product/${product.id}`} className="font-bold text-[#2C2C2C] text-lg mb-4 line-clamp-1 hover:text-[#C5A059] transition-colors">
                        {isRTL ? product.title_ar : product.title_en}
                      </Link>

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xl font-black text-[#2C2C2C]">
                            {product.discount_price || product.base_price} <span className="text-xs font-normal text-gray-500">{isRTL ? 'ر.س' : 'SAR'}</span>
                          </span>
                          {product.discount_price && (
                            <span className="text-xs text-gray-400 line-through">
                              {product.base_price} {isRTL ? 'ر.س' : 'SAR'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-300 font-mono tracking-tighter">
                          {product.sku}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};