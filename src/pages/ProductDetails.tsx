import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';
import { ShoppingCart } from 'lucide-react';

const MOCK_PRODUCT = {
  id: '1',
  name: 'Royal Velvet Sofa',
  basePrice: 4500,
  description: 'Experience unparalleled comfort and elegance with our Royal Velvet Sofa. Handcrafted with premium materials.',
  images: [
    'https://picsum.photos/seed/sofa1/800/800',
    'https://picsum.photos/seed/sofa2/800/800',
    'https://picsum.photos/seed/sofa3/800/800'
  ],
  category: 'livingRoom'
};

export const ProductDetails = () => {
  const { id } = useParams();
  const { language, addToCart } = useStore();
  const t = translations[language];
  
  const [width, setWidth] = useState(200);
  const [length, setLength] = useState(100);
  const [activeImage, setActiveImage] = useState(0);
  const [calculatedPrice, setCalculatedPrice] = useState(MOCK_PRODUCT.basePrice);

  useEffect(() => {
    // Dynamic price calculation based on dimensions
    const area = (width * length) / 10000; // in sq meters
    const newPrice = Math.round(MOCK_PRODUCT.basePrice * (area / 2)); // Base area is 2 sq meters
    setCalculatedPrice(Math.max(MOCK_PRODUCT.basePrice, newPrice));
  }, [width, length]);

  const handleAddToCart = () => {
    addToCart({
      id: `${MOCK_PRODUCT.id}-${width}-${length}`,
      productId: MOCK_PRODUCT.id,
      name: MOCK_PRODUCT.name,
      price: calculatedPrice,
      quantity: 1,
      width,
      length,
      image: MOCK_PRODUCT.images[0]
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Image Gallery */}
            <div className="p-8 bg-gray-50 flex flex-col items-center">
              <motion.div 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full aspect-square rounded-2xl overflow-hidden mb-6"
              >
                <img 
                  src={MOCK_PRODUCT.images[activeImage]} 
                  alt={MOCK_PRODUCT.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="flex gap-4">
                {MOCK_PRODUCT.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${activeImage === idx ? 'border-gold' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h1 className="font-serif text-4xl font-bold mb-4">{MOCK_PRODUCT.name}</h1>
              <p className="text-gray-600 mb-8 leading-relaxed">{MOCK_PRODUCT.description}</p>
              
              <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  {t.size}
                  <span className="text-sm font-normal text-gray-500">(Customizable)</span>
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t.width}</label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">{t.length}</label>
                    <input 
                      type="number" 
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t.price}</p>
                  <p className="text-4xl font-bold text-gold">{calculatedPrice} {t.currency}</p>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className="w-full bg-charcoal text-white py-4 rounded-xl font-medium text-lg hover:bg-charcoal/90 transition-colors flex items-center justify-center gap-3"
              >
                <ShoppingCart size={24} />
                {t.addToCart}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-24">
          <h2 className="font-serif text-3xl font-bold mb-8">{t.relatedProducts}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((item) => (
              <Link key={item} to={`/product/${item}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group block">
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/related${item}/400/400`} 
                    alt="Related" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1">Luxury Item {item}</h3>
                  <p className="text-gold font-bold">2500 {t.currency}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
