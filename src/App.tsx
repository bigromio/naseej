/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Pages - Public & Customer
import { Home } from '@/pages/Home';
import { Auth } from '@/pages/Auth';
import { Shop } from '@/pages/Shop';
import { ProductDetails } from '@/pages/ProductDetails';
import { Checkout } from '@/pages/Checkout';
import { CustomerDashboard } from '@/pages/CustomerDashboard';
import { DeliveryVerify } from '@/pages/DeliveryVerify';
import { DynamicPage } from '@/pages/DynamicPage';
import { Contact } from '@/pages/Contact';
import { CartDrawer } from '@/components/CartDrawer';

// Pages - Admin
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminProducts } from '@/pages/AdminProducts';
import { AdminOffers } from '@/pages/AdminOffers';
import { AdminAppearance } from '@/pages/AdminAppearance';
import { AdminPages } from '@/pages/AdminPages';
import { AdminOrders } from '@/pages/AdminOrders';

// نظام الحماية المطور (يدعم الصلاحيات المتعددة: مالك، مدير، موظف، عميل)
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user } = useStore();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // إذا كان هناك صلاحيات محددة، والمستخدم ليس من ضمنها، يتم طرده للصفحة الرئيسية
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  const { language } = useStore();

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <Router>
      <Routes>
        {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/page/:slug" element={<DynamicPage />} />  
          <Route path="/contact" element={<Contact />} />       
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Customer Routes (أي مستخدم مسجل دخول يمكنه الدخول للتشيك أوت) */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes (فقط فريق العمل مسموح لهم بالدخول هنا) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['owner', 'manager', 'employee']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* المرحلة 1: الفريق والعملاء */}
          <Route index element={<AdminDashboard />} />
          
          {/* المرحلة 2: المنتجات والعروض */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="appearance" element={<AdminAppearance />} />
          <Route path="pages" element={<AdminPages />} />
          
          {/* المرحلة 3 و 4 و 5: مسارات مستقبلية مجهزة مسبقاً */}
          <Route path="orders" element={<AdminOrders />} />
          <Route path="campaigns" element={
            <div className="flex items-center justify-center h-[50vh] text-gray-400 text-xl font-bold">
              Marketing Campaigns (Coming Soon)
            </div>
          } />
          <Route path="analytics" element={
            <div className="flex items-center justify-center h-[50vh] text-gray-400 text-xl font-bold">
              Analytics & Performance (Coming Soon)
            </div>
          } />
        </Route>


        {/* Workshop Delivery Route (No Layout) */}
        <Route path="/delivery-verify" element={<DeliveryVerify />} />
      </Routes>
    </Router>
  );
}