'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import LoginScreen from '../../components/screens/LoginScreen';

export const dynamic = 'force-dynamic';

function LoginPageContent() {
  const router = useRouter();

  const handleLoginAsRole = (role: 'admin' | 'exporter' | 'vetting') => {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'vetting') {
      router.push('/vetting-queue');
    } else {
      router.push('/exporter-dashboard');
    }
  };

  const handleNavigateToRegister = () => {
    router.push('/register');
  };

  const handleNavigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <LoginScreen 
      onLoginAsRole={handleLoginAsRole} 
      onNavigateToRegister={handleNavigateToRegister} 
      onNavigateToForgotPassword={handleNavigateToForgotPassword}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
