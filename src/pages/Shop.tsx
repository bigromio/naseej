import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { translations } from '@/i18n/translations';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Royal Velvet Sofa', price: 4500, category: 'livingRoom', image: 'https://picsum.photos/seed/sofa1/600/600' },
  { id: '2', name: 'Oak Dining Table', price: 3200, category: 'diningRoom', image: 'https://picsum.photos/seed/table1/600/600' },
  { id: '3', name: 'Minimalist Bed Frame', price: 2800, category: 'bedroom', image: 'https://picsum.photos/seed/bed1/600/600' },
  { id: '4', name: 'Executive Office Chair', price: 1500, category: 'office', image: 'https://picsum.photos/seed/chair1/600/600' },
  { id: '5', name: 'Lounge Armchair', price: 1800, category: 'livingRoom', image: 'https://picsum.photos/seed/armchair1/600/600' },
  { id: '6', name: 'Marble Coffee Table', price: 1200, category: 'livingRoom', image: 'https://picsum.photos/seed/coffeetable1/600/600' },
];

export const Shop = () => {
  const { language } = useStore();
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory 
    ? MOCK_PRODUCTS.filter(p => p.category === selectedCategory)
    : MOCK_PRODUCTS;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-28">
              <h3 className="font-serif text-xl font-bold mb-4">{t.categories}</h3>
              <ul className="space-y-3">
                {['livingRoom', 'bedroom', 'diningRoom', 'office'].map((cat) => (
                  <li key={cat}>
                    <button 
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={`text-sm transition-colors ${selectedCategory === cat ? 'text-gold font-bold' : 'text-gray-600 hover:text-charcoal'}`}
                    >
                      {t[cat as keyof typeof t]}
                    </button>
                  </li>
                ))}
              </ul>

              <h3 className="font-serif text-xl font-bold mt-8 mb-4">{t.priceRange}</h3>
              <input type="range" className="w-full accent-gold" />
              
              <button 
                onClick={() => setSelectedCategory(null)}
                className="mt-8 w-full py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.clearFilters}
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group"
                >
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden aspect-square">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className="p-5">
                    <h3 className="font-medium text-lg mb-2">{product.name}</h3>
                    <p className="text-gold font-bold">{product.price} {t.currency}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
