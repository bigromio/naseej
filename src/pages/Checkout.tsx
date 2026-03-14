import React from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { Link, useNavigate } from 'react-router-dom';

export const Checkout = () => {
  const { language, cart, clearCart } = useStore();
  const t = translations[language];
  const navigate = useNavigate();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    clearCart();
    navigate('/dashboard');
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-12 flex flex-col items-center justify-center bg-offwhite">
        <h2 className="text-2xl font-serif mb-4">{t.emptyCart}</h2>
        <Link to="/shop" className="bg-gold text-white px-6 py-3 rounded-lg hover:bg-gold/90 transition-colors">
          {t.shopNow}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold mb-8">{t.checkout}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">{t.shippingDetails}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">{t.fullName}</label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">{t.address}</label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t.city}</label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t.zipCode}</label>
                    <input type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">{t.paymentMethod}</h2>
                <div className="space-y-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="payment" value="card" defaultChecked className="text-gold focus:ring-gold" />
                    <span className="ml-3 rtl:mr-3 rtl:ml-0 font-medium">{t.creditCard}</span>
                  </label>
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="payment" value="cod" className="text-gold focus:ring-gold" />
                    <span className="ml-3 rtl:mr-3 rtl:ml-0 font-medium">{t.cashOnDelivery}</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-28">
              <h2 className="text-xl font-bold mb-6">{t.orderSummary}</h2>
              
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.width}x{item.length} cm</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-500">x{item.quantity}</span>
                        <span className="font-bold text-sm">{item.price * item.quantity} {t.currency}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.subtotal}</span>
                  <span>{subtotal} {t.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.tax} (15%)</span>
                  <span>{tax} {t.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.shipping}</span>
                  <span className="text-green-600">{t.free}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
                  <span>{t.total}</span>
                  <span className="text-gold">{total} {t.currency}</span>
                </div>
              </div>

              <button 
                form="checkout-form"
                type="submit"
                className="w-full bg-charcoal text-white py-3 rounded-xl font-medium hover:bg-charcoal/90 transition-colors"
              >
                {t.placeOrder}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
