'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterStep1Screen from '../../components/screens/RegisterStep1Screen';
import RegisterStep2Screen from '../../components/screens/RegisterStep2Screen';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const [authScreen, setAuthScreen] = useState('register-1');

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleRegisterContinue = () => {
    setAuthScreen('register-2');
  };

  const handleRegisterComplete = () => {
    // Registration complete - redirect to login
    window.location.href = '/login';
  };

  const handleRegisterBackToStep1 = () => {
    setAuthScreen('register-1');
  };

  return (
    <>
      {authScreen === 'register-1' && (
        <RegisterStep1Screen
          onBackToLogin={handleBackToLogin}
          onContinue={handleRegisterContinue}
        />
      )}
      {authScreen === 'register-2' && (
        <RegisterStep2Screen
          onBack={handleRegisterBackToStep1}
          onComplete={handleRegisterComplete}
        />
      )}
    </>
  );
}
