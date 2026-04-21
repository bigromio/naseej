import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // هذه الدالة تجبر المتصفح على الصعود لأعلى الصفحة فوراً عند تغير الرابط
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // هذا المكون لا يطبع أي شيء على الشاشة
}