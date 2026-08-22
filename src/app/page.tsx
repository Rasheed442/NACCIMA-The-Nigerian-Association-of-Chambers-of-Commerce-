'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LogoutModal from '../components/LogoutModal';
import DashboardScreen from '../components/screens/DashboardScreen';

function AppContent() {
  const { isAuthenticated, login, logout } = useAuth();
  const [activeScreen, setActiveScreen] = useState('s-login');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    const handleConfirmLogout = () => {
      logout();
      setActiveScreen('s-login');
      setShowLogoutModal(false);
    };

    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    window.addEventListener('confirm-logout', handleConfirmLogout);

    return () => {
      window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
      window.removeEventListener('confirm-logout', handleConfirmLogout);
    };
  }, [logout]);

  const router = useRouter();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Call logout API if we have a refresh token
    if (refreshToken) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API?.replace(/\/+$/, '');
        if (baseUrl) {
          await fetch(`${baseUrl}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch (err) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', err);
      }
    }

    // Clear all localStorage items
    localStorage.clear();
    
    // Clear auth data and redirect
    logout();
    setActiveScreen('s-login');
    setShowLogoutModal(false);
    router.push('/login');
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // If authenticated, show navbar and dashboard screens
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Navbar activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      <div id="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'auto' }}>
        <DashboardScreen activeScreen={activeScreen} onScreenChange={setActiveScreen} />
        <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
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
