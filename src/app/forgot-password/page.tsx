'use client';

import React, { useState } from 'react';
import Link from 'next/link';

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await fetch(`${baseUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send password reset email.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[5px]">Forgot Password</div>
          <div className="text-[14px] text-[#7ab8dc] mb-6 font-medium">Reset your password</div>
          <div className="text-[14px] text-[#aac8e0] leading-relaxed mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Secure password reset</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Email verification required</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Quick and easy process</div>
          </div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Reset Your Password</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-[22px]">Enter your email to receive a password reset link</div>
          
          {success ? (
            <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#f0fdf4] border border-[#86efac] text-[#065f46]">
              <span>✅</span>
              <div>
                <div className="font-semibold mb-1">Password reset email sent!</div>
                <div className="text-[11px]">Please check your email for the reset link. The link will expire in 24 hours.</div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 mb-3">
                <label className="text-[13px] font-semibold text-[#374151]">Email Address <span className="text-[#e53e3e]">*</span></label>
                <input 
                  className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="text-[10px] text-[#6b7280] mt-[2px]">We'll send a reset link to this email address</div>
              </div>

              {error && (
                <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button 
                className="inline-flex items-center justify-center gap-1 px-[14px] py-[10px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white w-full mb-[14px] hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60" 
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}

          <div className="text-center text-[14px] text-[#6a7a9a] mb-4">
            Remember your password? <Link href="/login" className="text-[#3a7bd5] font-medium cursor-pointer hover:underline">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
