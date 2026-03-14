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

// Pages
import { Home } from '@/pages/Home';
import { Auth } from '@/pages/Auth';
import { Shop } from '@/pages/Shop';
import { ProductDetails } from '@/pages/ProductDetails';
import { Checkout } from '@/pages/Checkout';
import { CustomerDashboard } from '@/pages/CustomerDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { DeliveryVerify } from '@/pages/DeliveryVerify';

// Protected Route Wrapper
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'admin' | 'customer' }) => {
  const { user } = useStore();
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role && user.role !== role) {
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
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Customer Routes */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<div className="p-8">Orders Management (Coming Soon)</div>} />
          <Route path="products" element={<div className="p-8">Products Management (Coming Soon)</div>} />
        </Route>

        {/* Workshop Delivery Route (No Layout) */}
        <Route path="/delivery-verify" element={<DeliveryVerify />} />
      </Routes>
    </Router>
  );
}
