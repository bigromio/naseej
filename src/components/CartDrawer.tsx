import React from 'react';
import { useStore } from '@/store/useStore';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CartDrawer = () => {
  const { language, cart, isCartOpen, closeCart, removeFromCart, updateQuantity } = useStore();
  const isRTL = language === 'ar';

  if (!isCartOpen) return null;

  // حساب الإجمالي
  const subtotal = cart.reduce((total, item) => {
    const price = item.discount_price ? item.discount_price : item.base_price;
    return total + (price * (item.quantity || 1));
  }, 0);

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* خلفية ضبابية داكنة (Overlay) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={closeCart}
      ></div>

      {/* درج السلة ينزلق من الجانب */}
      <div 
        className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in ${isRTL ? 'slide-in-from-right mr-auto' : 'slide-in-from-left ml-auto'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* رأس السلة */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#2C2C2C] flex items-center gap-2">
            <ShoppingBag className="text-[#C5A059]" />
            {isRTL ? 'سلة المشتريات' : 'Shopping Cart'}
            <span className="bg-[#2C2C2C] text-white text-xs px-2 py-0.5 rounded-full">{cart.length}</span>
          </h2>
          <button onClick={closeCart} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* قائمة المنتجات */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <ShoppingBag size={64} className="text-gray-300" />
              <p className="text-lg font-bold text-gray-500">{isRTL ? 'سلتك فارغة حالياً' : 'Your cart is currently empty'}</p>
              <button onClick={closeCart} className="text-[#C5A059] font-bold underline hover:text-[#2C2C2C]">
                {isRTL ? 'العودة للتسوق' : 'Return to Shop'}
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                {/* صورة المنتج */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  <img src={item.image_lifestyle || item.image_white_bg} alt={isRTL ? item.title_ar : item.title_en} className="w-full h-full object-cover" />
                </div>
                
                {/* تفاصيل المنتج */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[#2C2C2C] text-sm line-clamp-2">{isRTL ? item.title_ar : item.title_en}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bold text-[#C5A059]">
                        {item.discount_price || item.base_price} {isRTL ? 'ر.س' : 'SAR'}
                      </span>
                      {item.discount_price && (
                        <span className="text-xs text-gray-400 line-through">{item.base_price}</span>
                      )}
                    </div>
                  </div>

                  {/* التحكم بالكمية والحذف */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} className="p-1.5 text-gray-500 hover:text-[#C5A059] transition-colors"><Minus size={14}/></button>
                      <span className="w-8 text-center font-bold text-sm text-[#2C2C2C]">{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} className="p-1.5 text-gray-500 hover:text-[#C5A059] transition-colors"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title={isRTL ? 'حذف' : 'Remove'}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* تذييل السلة (الإجمالي وزر الدفع) */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-500 font-bold">{isRTL ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span className="text-2xl font-bold text-[#2C2C2C]">{subtotal.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}</span>
            </div>
            <p className="text-xs text-gray-400 text-center mb-4">
              {isRTL ? 'الضرائب وتكاليف الشحن تُحسب عند إتمام الطلب.' : 'Taxes and shipping calculated at checkout.'}
            </p>
            <Link 
              to="/checkout" 
              onClick={closeCart}
              className="w-full py-4 bg-[#2C2C2C] text-white font-bold rounded-xl hover:bg-[#C5A059] transition-colors shadow-lg flex justify-center items-center gap-2 group"
            >
              {isRTL ? 'إتمام الطلب' : 'Checkout Securely'}
              {isRTL ? <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};