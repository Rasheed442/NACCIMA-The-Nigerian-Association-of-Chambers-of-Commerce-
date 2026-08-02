'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LoginScreen from '../components/screens/LoginScreen';
import RegisterStep1Screen from '../components/screens/RegisterStep1Screen';
import RegisterStep2Screen from '../components/screens/RegisterStep2Screen';
import DashboardScreen from '../components/screens/DashboardScreen';

function AppContent() {
  const { isAuthenticated, login, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState('s-login');
  const [authScreen, setAuthScreen] = useState('login'); // 'login', 'register-1', 'register-2'

  const handleLogin = () => {
    login();
    setActiveScreen('s-exporter-home');
  };

  const handleNavigateToRegister = () => {
    setAuthScreen('register-1');
  };

  const handleRegisterContinue = () => {
    setAuthScreen('register-2');
  };

  const handleRegisterComplete = () => {
    login();
    setActiveScreen('s-exporter-home');
  };

  const handleRegisterBack = () => {
    setAuthScreen('register-1');
  };

  const handleRegisterBackToLogin = () => {
    setAuthScreen('login');
  };

  const handleLogout = () => {
    logout();
    setActiveScreen('s-login');
    setAuthScreen('login');
  };

  // If not authenticated, show auth screens full-screen without navbar
  if (!isAuthenticated) {
    return (
      <>
        {authScreen === 'login' && (
          <LoginScreen 
            onLogin={handleLogin} 
            onNavigateToRegister={handleNavigateToRegister} 
          />
        )}
        {authScreen === 'register-1' && (
          <RegisterStep1Screen 
            onBackToLogin={handleRegisterBackToLogin} 
            onContinue={handleRegisterContinue} 
          />
        )}
        {authScreen === 'register-2' && (
          <RegisterStep2Screen 
            onBack={handleRegisterBack} 
            onComplete={handleRegisterComplete} 
          />
        )}
      </>
    );
  }

  // If authenticated, show navbar and dashboard screens
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* <Navbar activeScreen={activeScreen} onScreenChange={setActiveScreen} /> */}
      <div id="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'auto' }}>
        <DashboardScreen activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
