'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

type AuthRole = 'exporter' | 'admin' | 'vetting';

interface LoginScreenProps {
  onLoginAsRole: (role: AuthRole) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword?: () => void;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function LoginScreen({ onLoginAsRole, onNavigateToRegister, onNavigateToForgotPassword }: LoginScreenProps) {
  const searchParams = useSearchParams();
  const isVerified = searchParams.get('verified') === 'true';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login failed.');
      }

      // Store tokens and user data
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      localStorage.setItem('accessTokenExpiresAt', result.data.accessTokenExpiresAt);
      localStorage.setItem('refreshTokenExpiresAt', result.data.refreshTokenExpiresAt);
      localStorage.setItem('userId', result.data.userId);
      localStorage.setItem('companyId', result.data.companyId);
      localStorage.setItem('userData', JSON.stringify(result.data));
      
      // Store user role from API response - normalize role names
      let userRole = 'exporter';
      if (result.data.roles && result.data.roles.length > 0) {
        const apiRole = result.data.roles[0];
        if (apiRole === 'Platform Super Administrator') {
          userRole = 'admin';
        } else if (apiRole === 'Certificate Officer') {
          userRole = 'vetting';
        } else if (apiRole === 'Company Administrator') {
          userRole = 'exporter';
        } else {
          userRole = 'exporter';
        }
      }
      localStorage.setItem('userRole', userRole);

      localStorage.setItem('showWelcomeToast', 'true');
      onLoginAsRole(userRole as AuthRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[5px]">NACCIMA</div>
          <div className="text-[14px] text-[#7ab8dc] mb-6 font-medium">E-Certificate Platform</div>
          <div className="text-[14px] text-[#aac8e0] leading-relaxed mb-6">Apply for, track and receive your<br/>official NACCIMA export certificates.<br/><br/>All five certificate types — in one place.</div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Certificate of Origin (COO) &amp; GSP</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ ECOWAS &amp; Movement Certificates</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Solid Mineral Certificate</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Secure payments</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Member &amp; Non-Member fee rates</div>
          </div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Sign in to your account</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-[22px]">
            Enter your credentials to access the dashboard
          </div>
          
          {isVerified && (
            <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#f0fdf4] border border-[#86efac] text-[#065f46]">
              <span>✅</span>
              <span>Your email has been successfully verified. You can now log in to your account.</span>
            </div>
          )}
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[13px] font-semibold text-[#374151]">
              Username <span className="text-[#e53e3e]">*</span>
            </label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
              type="text" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 mb-[6px]">
            <label className="text-[13px] font-semibold text-[#374151]">Password <span className="text-[#e53e3e]">*</span></label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="text-right text-[14px] font-medium text-[#3a7bd5] mb-4 cursor-pointer" onClick={onNavigateToForgotPassword}>Forgot password?</div>
          
          {error && (
            <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <button 
            className="inline-flex items-center justify-center gap-1 px-[14px] py-[10px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white w-full mb-[14px] hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
          <div className="text-center text-[14px] text-[#6a7a9a] mb-4">
            Need an account? {" "}
            <span className="text-[#3a7bd5] font-medium cursor-pointer" onClick={onNavigateToRegister}>Register your company →</span>
          </div>
        </div>
      </div>
    </div>
  );
}
