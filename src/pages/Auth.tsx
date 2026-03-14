import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [usePhone, setUsePhone] = useState(false);
  const { language, setUser } = useStore();
  const t = translations[language];
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    setUser({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer'
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-offwhite px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100"
      >
        <div className="flex mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500'}`}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-white shadow-sm text-charcoal' : 'text-gray-500'}`}
          >
            {t.register}
          </button>
        </div>

        <div className="flex justify-center mb-6 space-x-4 rtl:space-x-reverse">
          <button 
            type="button"
            onClick={() => setUsePhone(false)}
            className={`text-sm pb-1 border-b-2 transition-colors ${!usePhone ? 'border-gold text-charcoal font-medium' : 'border-transparent text-gray-400'}`}
          >
            {t.useEmail}
          </button>
          <button 
            type="button"
            onClick={() => setUsePhone(true)}
            className={`text-sm pb-1 border-b-2 transition-colors ${usePhone ? 'border-gold text-charcoal font-medium' : 'border-transparent text-gray-400'}`}
          >
            {t.usePhone}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                  <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent outline-none" required />
                </div>
              )}

              {usePhone ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                  <div className="flex">
                    <select className="px-3 py-2 border border-gray-200 rounded-l-lg bg-gray-50 border-r-0 focus:outline-none rtl:rounded-r-lg rtl:rounded-l-none rtl:border-l-0 rtl:border-r">
                      <option>+966</option>
                      <option>+971</option>
                    </select>
                    <input type="tel" className="w-full px-4 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-gold focus:border-transparent outline-none rtl:rounded-l-lg rtl:rounded-r-none" required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                  <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent outline-none" required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                <input type="password" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent outline-none" required />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPassword}</label>
                  <input type="password" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent outline-none" required />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button type="submit" className="w-full bg-charcoal text-white py-3 rounded-lg font-medium hover:bg-charcoal/90 transition-colors mt-6">
            {isLogin ? t.login : t.register}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
