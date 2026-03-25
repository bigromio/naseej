import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore, Product } from '@/store/useStore';
import { Loader2, Star, ShieldCheck, Truck, ArrowRight, ArrowLeft, Ruler, Hammer, Sparkles } from 'lucide-react';

export const ProductDetails = () => {
  const { id } = useParams();
  const { language, products, fetchProducts } = useStore();
  const isRTL = language === 'ar';
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  useEffect(() => {
    if (products.length === 0) fetchProducts();
    const current = products.find(p => p.id === id);
    if (current) {
      setProduct(current);
      const complementary = products.filter(p => p.id !== id && current.collection_id && p.collection_id === current.collection_id).slice(0, 6);
      setRelatedProducts(complementary);
    }
  }, [id, products, fetchProducts]);

  if (!product) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-[#C5A059]" size={48} /></div>;

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div className="rounded-3xl overflow-hidden bg-gray-50 aspect-square relative border border-gray-100 shadow-inner">
          <img src={product.image_lifestyle || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800'} alt={isRTL ? product.title_ar : product.title_en} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold bg-[#C5A059]/10 text-[#C5A059] px-4 py-1.5 rounded-full uppercase tracking-wider">
              {isRTL ? product.sub_category_ar : product.sub_category_en}
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-[#2C2C2C] mb-4 leading-tight">{isRTL ? product.title_ar : product.title_en}</h1>
          <p className="text-gray-500 mb-8 leading-relaxed text-lg">{isRTL ? product.short_desc_ar : product.short_desc_en}</p>
          
          {/* تحديث منطقة السعر الاحترافية */}
          <div className="mb-8 pb-8 border-b border-gray-100 flex items-end gap-4 flex-wrap">
            {product.discount_price ? (
              <>
                <div className="flex flex-col">
                  <span className="text-xl text-gray-400 line-through mb-1">{product.base_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
                  <span className="text-4xl font-bold text-red-600">{product.discount_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
                </div>
                <span className="text-sm bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg font-bold mb-2 flex items-center gap-1">
                  {isRTL ? 'وفر ' : 'Save '} 
                  {(product.base_price - product.discount_price).toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                  <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] ml-1">
                    -{Math.round(((product.base_price - product.discount_price) / product.base_price) * 100)}%
                  </span>
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold text-[#2C2C2C]">{product.base_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
            )}
            
            {product.is_dynamic_size && <span className="text-sm text-gray-400 font-normal mb-1">{isRTL ? '/ للمتر المربع' : '/ per SQM'}</span>}
          </div>

          <button className="w-full py-4 bg-[#2C2C2C] text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl mb-6">{isRTL ? 'إضافة إلى السلة' : 'Add to Cart'}</button>
          <div className="grid grid-cols-2 gap-4 text-sm text-[#2C2C2C] bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3 font-bold"><ShieldCheck className="text-[#C5A059]" size={24} /> {isRTL ? 'ضمان 5 سنوات' : '5 Years Warranty'}</div>
            <div className="flex items-center gap-3 font-bold"><Truck className="text-[#C5A059]" size={24} /> {isRTL ? 'توصيل وتركيب مجاني*' : 'Free Delivery & Setup*'}</div>
          </div>
        </div>
      </div>

      {/* التابات والمنتجات المرتبطة (نفس الكود السابق تماماً لم يتم تغييره) */}
      <div className="mb-24 bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        <div className="flex border-b border-gray-100 mb-8 gap-10">
          <button onClick={() => setActiveTab('desc')} className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'desc' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-600'}`}>
            {isRTL ? 'قصة التصميم' : 'Design Story'} {activeTab === 'desc' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A059]"></span>}
          </button>
          <button onClick={() => setActiveTab('specs')} className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'specs' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-600'}`}>
            {isRTL ? 'المواصفات الفنية' : 'Technical Specs'} {activeTab === 'specs' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A059]"></span>}
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`pb-4 text-lg font-bold transition-all relative ${activeTab === 'reviews' ? 'text-[#C5A059]' : 'text-gray-400 hover:text-gray-600'}`}>
            {isRTL ? 'آراء العملاء (0)' : 'Customer Reviews (0)'} {activeTab === 'reviews' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C5A059]"></span>}
          </button>
        </div>

        <div className="min-h-[200px]">
          {activeTab === 'desc' && <div className="text-gray-600 leading-loose text-lg max-w-4xl"><p>{isRTL ? product.long_desc_ar : product.long_desc_en}</p></div>}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl"><Hammer className="text-[#C5A059] flex-shrink-0" size={32} /><div><h4 className="font-bold text-[#2C2C2C] mb-2">{isRTL ? 'المواد والهيكل' : 'Materials & Frame'}</h4><p className="text-sm text-gray-500 leading-relaxed">{isRTL ? 'خشب هندسي عالي الكثافة (MDF) مقاوم للخدش.' : 'High-density MDF scratch-resistant.'}</p></div></div>
              <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl"><Ruler className="text-[#C5A059] flex-shrink-0" size={32} /><div><h4 className="font-bold text-[#2C2C2C] mb-2">{isRTL ? 'الأبعاد' : 'Dimensions'}</h4><p className="text-sm text-gray-500 leading-relaxed">{isRTL ? 'تختلف حسب المقاس المختار.' : 'Varies based on size.'}</p></div></div>
              <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl"><Sparkles className="text-[#C5A059] flex-shrink-0" size={32} /><div><h4 className="font-bold text-[#2C2C2C] mb-2">{isRTL ? 'العناية والتنظيف' : 'Care & Cleaning'}</h4><p className="text-sm text-gray-500 leading-relaxed">{isRTL ? 'يُنظف بقطعة قماش ناعمة ومبللة قليلاً.' : 'Clean with a soft damp cloth.'}</p></div></div>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 text-gray-300"><Star size={32} /></div>
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-2">{isRTL ? 'كن أول من يقيم هذا المنتج' : 'Be the first to review'}</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">{isRTL ? 'يُسمح بالتقييم للعملاء الموثقين فقط.' : 'Only verified buyers can review.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* المنتجات المرتبطة */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-16">
          <div className="flex items-end justify-between mb-10">
            <div><h2 className="text-3xl font-bold text-[#2C2C2C] mb-2">{isRTL ? 'أكمل أناقة غرفتك' : 'Complete Your Room'}</h2></div>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x hide-scrollbar">
            {relatedProducts.map(relProduct => (
              <Link to={`/product/${relProduct.id}`} key={relProduct.id} className="min-w-[280px] sm:min-w-[320px] snap-start group cursor-pointer bg-white rounded-3xl p-4 border border-gray-100 hover:shadow-2xl hover:shadow-[#C5A059]/10 transition-all duration-300">
                <div className="relative aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden mb-4">
                  <img src={relProduct.image_lifestyle || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800'} alt={isRTL ? relProduct.title_ar : relProduct.title_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <h3 className="font-bold text-lg text-[#2C2C2C] group-hover:text-[#C5A059] transition-colors line-clamp-1">{isRTL ? relProduct.title_ar : relProduct.title_en}</h3>
                
                {/* السعر في المنتجات المرتبطة */}
                <div className="font-bold mt-2 text-lg flex items-center gap-2">
                  {relProduct.discount_price ? (
                    <><span className="text-red-600">{relProduct.discount_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span> <span className="text-sm text-gray-400 line-through font-normal">{relProduct.base_price.toLocaleString()}</span></>
                  ) : (
                    <span className="text-[#2C2C2C]">{relProduct.base_price.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};