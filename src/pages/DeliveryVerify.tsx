import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const DeliveryVerify = () => {
  const { language } = useStore();
  const t = translations[language];
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow 1 digit
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length === 4) {
      // Mock verification
      setIsVerified(true);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Delivery Verified!</h2>
          <p className="text-gray-500 mb-8">The customer has successfully received their order.</p>
          <button 
            onClick={() => {
              setIsVerified(false);
              setOtp(['', '', '', '']);
            }}
            className="w-full bg-charcoal text-white py-3 rounded-xl font-medium"
          >
            Verify Another Order
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-bold text-gold mb-2">NASEEJ</h1>
          <h2 className="text-xl font-bold text-charcoal">{t.verifyDelivery}</h2>
          <p className="text-sm text-gray-500 mt-2">{t.enterOtp}</p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex justify-between gap-4 mb-8" dir="ltr">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-gold focus:ring-0 outline-none transition-colors"
                required
              />
            ))}
          </div>

          <button 
            type="submit"
            disabled={otp.join('').length !== 4}
            className="w-full bg-gold text-white py-4 rounded-xl font-medium text-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.verify}
          </button>
        </form>
      </div>
    </div>
  );
};
