'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import RegisterScreen from '../../components/screens/RegisterScreen';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleComplete = () => {
    // Registration complete - redirect to login
    window.location.href = '/login';
  };

  return (
    <RegisterScreen
      onBackToLogin={handleBackToLogin}
      onComplete={handleComplete}
    />
  );
}
