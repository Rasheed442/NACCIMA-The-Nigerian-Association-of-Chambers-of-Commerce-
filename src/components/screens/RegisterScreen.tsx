'use client';

import React, { useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import { verifyTin } from '../../utils/tinVerification';

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onComplete: () => void;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function RegisterScreen({ onBackToLogin, onComplete }: RegisterScreenProps) {
  const [tin, setTin] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const isValidTin = tin.trim().length === 13;

  const validateForm = (): boolean => {
    if (!tin.trim()) {
      setError('TIN is required.');
      return false;
    }
    if (tin.trim().length !== 13) {
      setError('TIN must be 13 digits.');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one special character.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (!isValidTin) {
      setError('TIN must be 13 digits.');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      // Step 1: Verify TIN to get registrationToken
      const normalizedTin = tin.trim();
      const verificationData = await verifyTin({ tin: normalizedTin });
      
      // Step 2: Register with the registrationToken
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const response = await fetch(`${baseUrl}/api/v1/onboarding/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationToken: verificationData.registrationToken,
          contactPerson: {
            firstName: 'Not Applicable',
            lastName: 'Not Applicable',
            designationCode: 'Not Applicable',
            email: email,
            phoneNumber: phoneNumber,
            password,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Registration failed.');
      }

      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[6px]">Company Registration</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Create your account to get started</div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-[10px] items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-[#1a4a8a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div className="text-[11.5px] text-[#c8dce8]"><strong className="text-white">Enter your TIN</strong> — your Tax Identification Number</div>
            </div>
            <div className="flex gap-[10px] items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-[#1a4a8a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div className="text-[11.5px] text-[#c8dce8]"><strong className="text-white">Set your credentials</strong> — email and password</div>
            </div>
          </div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Company Registration</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">Enter your TIN and set your account credentials</div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Tax Identification Number (TIN) <span className="text-[#e53e3e]">*</span></label>
            <input
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white font-mono text-[14px] tracking-[1.5px] focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
              type="text"
              value={tin}
              onChange={(event) => {
                setTin(event.target.value.replace(/\D/g, ''));
                if (error) setError('');
              }}
              placeholder="e.g. 1234567890123"
            />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">13-digit number issued by the Nigeria Revenue Service (NRS)</div>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Email Address <span className="text-[#e53e3e]">*</span></label>
            <input
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]"
              type="email"
              placeholder="contact@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">This email is used for verification and notifications.</div>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Phone Number <span className="text-[#e53e3e]">*</span></label>
            <input
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]"
              placeholder="e.g. +234 800 000 0000"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Password <span className="text-[#e53e3e]">*</span></label>
            <div className="relative">
              <input
                className="w-full px-[10px] py-[7px] pr-[38px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              <button
                type="button"
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#3a7bd5] cursor-pointer bg-transparent border-none"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="text-[10px] text-[#6b7280] mt-[2px]">Minimum 8 characters, 1 uppercase, 1 number, 1 special character</div>
          </div>

          <div className="flex flex-col gap-1 mb-[18px]">
            <label className="text-[11px] font-semibold text-[#374151]">Confirm Password <span className="text-[#e53e3e]">*</span></label>
            <div className="relative">
              <input
                className="w-full px-[10px] py-[7px] pr-[38px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              <button
                type="button"
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#3a7bd5] cursor-pointer bg-transparent border-none"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <div className="text-[10px] text-[#e53e3e] mt-[2px]">Passwords do not match</div>
            )}
          </div>

          {error && (
            <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-3 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-3.5 py-1.75 rounded text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={onBackToLogin}>
              <FaArrowLeft color="#1a4a8a" /> Back to Login
            </button>
            <button
              className="inline-flex items-center justify-center gap-1 px-3.5 py-1.75 rounded text-[14px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleRegister}
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
          <div className="text-[10.5px] text-[#9ca3af] mt-[10px] text-center">By completing registration, you agree to our terms and conditions.</div>
        </div>
      </div>
    </div>
  );
}
