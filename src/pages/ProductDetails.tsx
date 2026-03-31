import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ShoppingBag, Plus, Minus, ArrowRight, ArrowLeft, Shield, Truck, Star } from 'lucide-react';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, products, addToCart } = useStore();
  const isRTL = language === 'ar';

  const product = products.find(p => p.id === id);

  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string>('');

  useEffect(() => {
    if (product) {
      setMainImage(product.image_lifestyle || product.image_white_bg || '');
      window.scrollTo(0, 0);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50/50">
        <h2 className="text-3xl font-bold text-[#2C2C2C] mb-4">{isRTL ? 'المنتج غير موجود' : 'Product not found'}</h2>
        <Link to="/shop" className="text-[#C5A059] font-bold hover:underline flex items-center gap-2">
          {isRTL ? <ArrowRight size={20}/> : <ArrowLeft size={20}/>} {isRTL ? 'العودة للمتجر' : 'Back to Shop'}
        </Link>
      </div>
    );
  }

  // تجميع كل الصور (الرئيسية والمعرض)
  const allImages = [product.image_lifestyle, product.image_white_bg, ...(product.gallery || [])].filter(Boolean) as string[];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    // السلة ستفتح تلقائياً لأننا برمجناها في useStore
  };

  return (
    <div className="min-h-screen bg-white pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* مسار التنقل (Breadcrumb) */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
          <Link to="/" className="hover:text-[#C5A059]">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#C5A059]">{isRTL ? 'المتجر' : 'Shop'}</Link>
          <span>/</span>
          <span className="text-[#C5A059]">{isRTL ? product.category_ar : product.category_en}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* قسم الصور */}
          <div className="space-y-4">
            <div className="aspect-[4/5] md:aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative">
              {product.discount_price && (
                <div className={`absolute top-6 ${isRTL ? 'right-6' : 'left-6'} bg-red-500 text-white font-bold px-4 py-1.5 rounded-full z-10 shadow-md`}>
                  {isRTL ? 'تخفيض' : 'Sale'}
                </div>
              )}
              <img src={mainImage} alt={isRTL ? product.title_ar : product.title_en} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 cursor-zoom-in" />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} onClick={() => setMainImage(img)}
                    className={`w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-[#C5A059] opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Gallery thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* قسم التفاصيل */}
          <div className="flex flex-col justify-center">
            <p className="text-[#C5A059] font-bold tracking-wider mb-2 uppercase">{isRTL ? product.category_ar : product.category_en}</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-4 leading-tight">
              {isRTL ? product.title_ar : product.title_en}
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center text-yellow-500"><Star fill="currentColor" size={18}/><Star fill="currentColor" size={18}/><Star fill="currentColor" size={18}/><Star fill="currentColor" size={18}/><Star fill="currentColor" size={18}/></div>
              <span className="text-gray-400 text-sm font-medium">SKU: {product.sku}</span>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="text-3xl font-bold text-[#2C2C2C]">{product.discount_price || product.base_price} {isRTL ? 'ر.س' : 'SAR'}</span>
              {product.discount_price && <span className="text-lg text-gray-400 line-through mb-1">{product.base_price} {isRTL ? 'ر.س' : 'SAR'}</span>}
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-10">
              {isRTL ? product.short_desc_ar : product.short_desc_en}
            </p>

            {/* التحكم بالكمية وإضافة للسلة */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 sm:w-1/3 h-14">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-500 hover:text-[#C5A059] transition-colors"><Minus size={20}/></button>
                <span className="font-bold text-lg text-[#2C2C2C] w-12 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-500 hover:text-[#C5A059] transition-colors"><Plus size={20}/></button>
              </div>
              
              {/* 🌟 زر الإضافة للسلة 🌟 */}
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-[#2C2C2C] text-white font-bold text-lg rounded-2xl h-14 flex items-center justify-center gap-3 hover:bg-[#C5A059] transition-colors shadow-lg group"
              >
                <ShoppingBag size={22} className="group-hover:animate-bounce" />
                {isRTL ? 'أضف إلى السلة' : 'Add to Cart'}
              </button>
            </div>

            {/* مميزات سريعة */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8">
              <div className="flex items-center gap-3 text-gray-600"><Shield className="text-[#C5A059]" size={24}/> <span className="font-medium text-sm">{isRTL ? 'ضمان 5 سنوات' : '5 Years Warranty'}</span></div>
              <div className="flex items-center gap-3 text-gray-600"><Truck className="text-[#C5A059]" size={24}/> <span className="font-medium text-sm">{isRTL ? 'شحن وتركيب مجاني' : 'Free Shipping & Assembly'}</span></div>
            </div>

          </div>
        </div>

        {/* الوصف الطويل */}
        <div className="mt-24 border-t border-gray-100 pt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-8 text-center">{isRTL ? 'تفاصيل المنتج' : 'Product Details'}</h2>
          <div className="prose prose-lg text-gray-600 max-w-none text-justify leading-loose" dangerouslySetInnerHTML={{ __html: isRTL ? product.long_desc_ar : product.long_desc_en }} />
        </div>

      </div>
    </div>
  );
};