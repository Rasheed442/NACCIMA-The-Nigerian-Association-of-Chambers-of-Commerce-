'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import LogoutModal from '../components/LogoutModal';
import DashboardScreen from '../components/screens/DashboardScreen';

function AppContent() {
  const { isAuthenticated, role, login, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    const handleConfirmLogout = () => {
      logout();
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
    setShowLogoutModal(false);
    router.push('/login');
  };

  // Redirect based on authentication status and role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (role) {
      switch (role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'vetting':
          router.push('/vetting');
          break;
        case 'exporter':
        default:
          router.push('/exporter-dashboard');
          break;
      }
    }
  }, [isAuthenticated, role, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-[#6a7a9a]">Redirecting...</div>
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
