'use client'

import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  
  // Utilise un état dérivé au lieu de setIsClient dans un useEffect
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Utilise requestAnimationFrame pour éviter l'avertissement
    const timer = requestAnimationFrame(() => {
      setHasMounted(true);
    });
    
    return () => cancelAnimationFrame(timer);
  }, []);

  useEffect(() => {
    if (hasMounted && !loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router, hasMounted]);

  // Pendant le SSR ou avant le montage
  if (!hasMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Après vérification
  return user ? children : null;
}