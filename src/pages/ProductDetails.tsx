import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { ShoppingBag, Heart, ArrowRight, ArrowLeft, Shield, Truck, Star, Ruler, Weight, Loader2 } from 'lucide-react';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // 🌟 أضفنا fetchProducts هنا
  const { language, products, addToCart, user, fetchProducts } = useStore();
  const isRTL = language === 'ar';

  // 🌟 جلب البيانات فوراً إذا كانت الذاكرة فارغة (عند التحديث)
  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  const product = products.find(p => p.id === id);

  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const galleryImages = React.useMemo(() => {
    if (!product) return [];
    let images: string[] = [];
    if (product.image_lifestyle) images.push(product.image_lifestyle.trim());
    
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      images = [...images, ...product.gallery.map((url: string) => url.trim()).filter(Boolean)];
    } else if (typeof product.gallery === 'string' && product.gallery.trim() !== '') {
      const parsedGallery = product.gallery.split('|').map(url => url.trim()).filter(Boolean);
      images = [...images, ...parsedGallery];
    }
    return Array.from(new Set(images));
  }, [product]);

  useEffect(() => {
    if (product && galleryImages.length > 0) {
      setMainImage(galleryImages[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product, galleryImages]);

  // ==========================================
  // 🌟 منطق جلب المنتجات (النسخة المدرعة بالـ SKU) 🌟
  // ==========================================
  
  // 1. منتجات من نفس المجموعة (صمم بنفسك)
  const collectionProducts = React.useMemo(() => {
    if (!product || !product.sku) return [];
    
    // استخراج رمز المجموعة من الـ SKU (مثلاً ANB من NSJ-ANB-SFA3)
    const currentCollectionCode = product.sku.split('-')[1]; 
    
    return products
      .filter(p => {
        if (!p.sku) return false;
        const pCollectionCode = p.sku.split('-')[1];
        return (pCollectionCode === currentCollectionCode) && (p.id !== product.id);
      })
      .slice(0, 4); // عرض 4 منتجات
  }, [products, product]);

  // 2. منتجات من نفس النوع من مجموعات مختلفة (قد يعجبك أيضاً)
  const similarProducts = React.useMemo(() => {
    if (!product || !product.sku) return [];
    
    const currentCollectionCode = product.sku.split('-')[1];
    const currentTypeCode = product.sku.split('-').pop(); // استخراج النوع (مثلاً SFA3)
    
    return products
      .filter(p => {
        if (!p.sku) return false;
        const pCollectionCode = p.sku.split('-')[1];
        const pTypeCode = p.sku.split('-').pop();
        
        // هل هو نفس النوع؟ (بالمطابقة مع الكود أو اسم القسم الفرعي)
        const isSameType = (pTypeCode === currentTypeCode) || (p.sub_category_ar === product.sub_category_ar);
        // هل هو من مجموعة مختلفة؟
        const isDifferentCollection = pCollectionCode !== currentCollectionCode;
        
        return isSameType && isDifferentCollection && (p.id !== product.id);
      })
      .slice(0, 4);
  }, [products, product]);

  // 🌟 شاشة التحميل أثناء جلب البيانات
  if (products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#C5A059]" size={40} />
      </div>
    );
  }

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

  const handleAddToCart = () => addToCart(product, quantity);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(isRTL ? 'يرجى تسجيل الدخول أولاً لتتمكن من حفظ تقييمك الثمين.' : 'Please login first to save your valuable review.');
      navigate('/auth');
      return;
    }
    if (rating === 0) {
      alert(isRTL ? 'يرجى اختيار عدد النجوم أولاً.' : 'Please select a star rating first.');
      return;
    }
    alert(isRTL ? 'شكراً لتقييمك! سيتم مراجعته ونشره قريباً.' : 'Thank you for your review! It will be published soon.');
    setRating(0);
    setReviewText('');
  };

  const getEstimatedWeight = (sku: string) => {
    if (sku.includes('SFA3')) return '65 - 80';
    if (sku.includes('SFA2')) return '45 - 60';
    if (sku.includes('DNT') || sku.includes('BED')) return '80 - 120';
    if (sku.includes('TVU') || sku.includes('DNB')) return '50 - 75';
    if (sku.includes('CHR') || sku.includes('DMC') || sku.includes('DNC')) return '12 - 18';
    return '15 - 30';
  };

  const renderProductCard = (p: any) => (
    <Link to={`/product/${p.id}`} key={p.id} className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full relative block">
      {p.discount_price && (
        <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg z-20 uppercase">
          {isRTL ? 'عرض خاص' : 'Sale'}
        </div>
      )}
      <div className="aspect-[4/5] relative overflow-hidden bg-gray-50">
        <img 
          src={p.image_lifestyle || 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'} 
          alt={isRTL ? p.title_ar : p.title_en} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'; }}
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[#C5A059] text-[10px] font-black tracking-wider uppercase mb-1">
          {isRTL ? p.sub_category_ar : p.sub_category_en}
        </p>
        <h3 className="font-bold text-[#2C2C2C] text-base mb-3 line-clamp-1 group-hover:text-[#C5A059] transition-colors">
          {isRTL ? p.title_ar : p.title_en}
        </h3>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-black text-[#2C2C2C]">
            {p.discount_price || p.base_price} <span className="text-xs font-normal text-gray-500">{isRTL ? 'ر.س' : 'SAR'}</span>
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12">
        
        {/* مسار التنقل (Breadcrumbs) */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-8 font-medium">
          <Link to="/" className="hover:text-[#C5A059] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-[#C5A059] transition-colors">{isRTL ? 'المتجر' : 'Shop'}</Link>
          <span>/</span>
          <Link to={`/shop?category=${isRTL ? product.category_ar : product.category_en}`} className="hover:text-[#C5A059] transition-colors">
            {isRTL ? product.category_ar : product.category_en}
          </Link>
          <span>/</span>
          <span className="text-[#C5A059]">{isRTL ? product.title_ar : product.title_en}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* قسم الصور */}
          <div className="space-y-6">
            <div className="aspect-[4/3] sm:aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              <img 
                src={mainImage || 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'} 
                alt={isRTL ? product.title_ar : product.title_en} 
                className="w-full h-full object-cover object-center"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/2c2c2c/C5A059?text=Naseej'; }}
              />
            </div>
            
            {/* معرض الصور المصغرة */}
            {galleryImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {galleryImages.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-[#C5A059] opacity-100 ring-2 ring-[#C5A059]/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Gallery thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل المنتج */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[#C5A059] text-sm font-bold tracking-wider uppercase px-3 py-1 bg-[#C5A059]/10 rounded-full">
                {isRTL ? product.sub_category_ar : product.sub_category_en}
              </span>
              <span className="text-gray-400 font-mono text-sm tracking-wider">SKU: {product.sku}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#2C2C2C] mb-4 leading-tight">
              {isRTL ? product.title_ar : product.title_en}
            </h1>

            {/* التقييم السريع */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-yellow-400">
                {[1,2,3,4,5].map(star => <Star key={star} size={18} fill="currentColor" />)}
              </div>
              <span className="text-sm text-gray-500 font-medium">
                (4.8) {isRTL ? 'بناءً على 24 تقييم' : 'Based on 24 reviews'}
              </span>
            </div>
            
            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-bold text-[#2C2C2C]">
                {product.discount_price || product.base_price} <span className="text-xl text-gray-500">{isRTL ? 'ر.س' : 'SAR'}</span>
              </span>
              {product.discount_price && (
                <span className="text-xl text-gray-400 line-through mb-1">
                  {product.base_price} {isRTL ? 'ر.س' : 'SAR'}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              {isRTL ? product.short_desc_ar : product.short_desc_en}
            </p>

            {/* أزرار الكمية والإضافة */}
            <div className="flex flex-wrap sm:flex-nowrap gap-4 mb-10">
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl h-14 px-2 w-full sm:w-auto">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-10 flex items-center justify-center text-gray-500 hover:text-[#C5A059] hover:bg-white rounded-xl transition-all">-</button>
                <span className="w-12 text-center font-bold text-lg text-[#2C2C2C]">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-10 flex items-center justify-center text-gray-500 hover:text-[#C5A059] hover:bg-white rounded-xl transition-all">+</button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="flex-[2] bg-[#2C2C2C] text-white font-bold text-lg rounded-2xl h-14 flex items-center justify-center gap-3 hover:bg-[#C5A059] transition-all shadow-lg hover:-translate-y-0.5 group"
              >
                <ShoppingBag size={22} className="group-hover:animate-bounce" />
                {isRTL ? 'أضف إلى السلة' : 'Add to Cart'}
              </button>

              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className={`w-14 h-14 flex shrink-0 items-center justify-center rounded-2xl border-2 transition-all ${isFavorite ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500'}`}
              >
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'animate-pulse' : ''} />
              </button>
            </div>

            {/* مميزات سريعة */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8 mt-auto">
              <div className="flex items-center gap-3 text-gray-700 bg-[#C5A059]/5 p-4 rounded-xl border border-[#C5A059]/20">
                <Shield className="text-[#C5A059]" size={24}/> 
                <span className="font-bold text-sm">{isRTL ? 'ضمان 5 سنوات' : '5 Years Warranty'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700 bg-[#C5A059]/5 p-4 rounded-xl border border-[#C5A059]/20">
                <Truck className="text-[#C5A059]" size={24}/> 
                <span className="font-bold text-sm">{isRTL ? 'شحن وتركيب مجاني' : 'Free Setup'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* المواصفات الفنية والأبعاد */}
        <div className="mt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-[#C5A059] text-white flex items-center justify-center">1</span>
                {isRTL ? 'تفاصيل المنتج' : 'Product Details'}
              </h2>
              <div className="prose prose-lg text-gray-600 leading-loose">
                {isRTL 
                  ? product.long_desc_ar?.split('المقاسات:')[0] 
                  : product.long_desc_en?.split('Dimensions:')[0]}
              </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 h-fit">
              <h3 className="text-xl font-bold text-[#2C2C2C] mb-6 flex items-center gap-3">
                <Ruler className="text-[#C5A059]" size={24} />
                {isRTL ? 'الأبعاد والمواصفات' : 'Dimensions'}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">{isRTL ? 'العرض (Width)' : 'Width'}</span>
                  <span className="font-bold text-[#2C2C2C] font-mono text-lg">{product.width_cm} <span className="text-sm text-gray-400 font-sans">{isRTL ? 'سم' : 'cm'}</span></span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">{isRTL ? 'العمق (Depth)' : 'Depth'}</span>
                  <span className="font-bold text-[#2C2C2C] font-mono text-lg">{product.length_cm} <span className="text-sm text-gray-400 font-sans">{isRTL ? 'سم' : 'cm'}</span></span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">{isRTL ? 'الارتفاع (Height)' : 'Height'}</span>
                  <span className="font-bold text-[#2C2C2C] font-mono text-lg">{product.height_cm} <span className="text-sm text-gray-400 font-sans">{isRTL ? 'سم' : 'cm'}</span></span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 font-medium flex items-center gap-2"><Weight size={18}/> {isRTL ? 'الوزن التقريبي' : 'Weight'}</span>
                  <span className="font-bold text-[#2C2C2C] font-mono text-lg">{getEstimatedWeight(product.sku)} <span className="text-sm text-gray-400 font-sans">{isRTL ? 'كجم' : 'kg'}</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* قسم تسوق المجموعة (صمم بنفسك) */}
        {collectionProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-2">
                  {isRTL ? 'صمم بنفسك' : 'Design it Yourself'}
                </h2>
                <p className="text-gray-500">{isRTL ? `تسوق باقي قطع مجموعة "${product.collection_name_ar}"` : `Shop the rest of the "${product.collection_name_en}" collection`}</p>
              </div>
              <Link to={`/shop?category=${product.category_ar || ''}`} className="hidden sm:flex text-[#C5A059] font-bold hover:underline items-center gap-2">
                {isRTL ? 'عرض الكل' : 'View All'} {isRTL ? <ArrowLeft size={16}/> : <ArrowRight size={16}/>}
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {collectionProducts.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* قسم قد يعجبك أيضاً */}
        {similarProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-gray-100">
            <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-8 text-center">
              {isRTL ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map(renderProductCard)}
            </div>
          </div>
        )}

        {/* قسم التقييمات */}
        <div className="mt-24 border-t border-gray-100 pt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#2C2C2C] mb-8 text-center">
            {isRTL ? 'آراء وتجارب العملاء' : 'Customer Reviews'}
          </h2>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            {!user && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl mb-6 text-sm font-medium flex items-center justify-between border border-blue-100">
                <span>{isRTL ? 'تصفح كزائر. يرجى تسجيل الدخول لحفظ تقييمك.' : 'Browsing as guest. Login to save your review.'}</span>
                <Link to="/auth" className="underline font-bold hover:text-blue-900">{isRTL ? 'تسجيل الدخول' : 'Login'}</Link>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">{isRTL ? 'ما تقييمك لهذا المنتج؟' : 'How do you rate this product?'}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star size={36} fill={(hoverRating || rating) >= star ? '#FBBF24' : 'transparent'} className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">{isRTL ? 'أخبرنا عن تجربتك (اختياري)' : 'Tell us about your experience'}</label>
                <textarea 
                  rows={4} 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={isRTL ? "شاركنا رأيك في جودة الخشب، القماش، والمقاسات..." : "Share your thoughts..."}
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-[#C5A059] bg-gray-50 resize-none transition-colors"
                ></textarea>
              </div>

              <button type="submit" className="bg-[#2C2C2C] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#C5A059] transition-colors w-full sm:w-auto">
                {isRTL ? 'إرسال التقييم' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};