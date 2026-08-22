'use client';

import React, { useState, useEffect } from 'react';
import { getTinVerificationToken, clearTinVerification, getTinVerification } from '../../utils/tinVerification';

interface RegisterStep3ScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

interface ContactPersonData {
  firstName: string;
  lastName: string;
  designationCode: string;
  email: string;
  phoneNumber: string;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function RegisterStep3Screen({ onBack, onComplete }: RegisterStep3ScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [contactPerson, setContactPerson] = useState<ContactPersonData | null>(null);

  // Load contact person data from localStorage (stored in step 2)
  useEffect(() => {
    const stored = localStorage.getItem('naccima_contact_person');
    if (stored) {
      try {
        setContactPerson(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const validateForm = (): boolean => {
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

    const registrationToken = getTinVerificationToken();
    if (!registrationToken) {
      setError('Registration token not found. Please verify your TIN again.');
      return;
    }

    if (!contactPerson) {
      setError('Contact person information not found. Please start over.');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
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
          registrationToken,
          contactPerson: {
            firstName: contactPerson.firstName,
            lastName: contactPerson.lastName,
            designationCode: contactPerson.designationCode,
            email: contactPerson.email,
            phoneNumber: contactPerson.phoneNumber,
            password,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Registration failed.');
      }

      // Clear stored data after successful registration
      clearTinVerification();
      localStorage.removeItem('naccima_contact_person');
      // Redirect to login page
      window.location.href = 'http://localhost:3000/login';
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
          <div className="text-[34px] font-extrabold text-white mb-[6px]">Set Your Password</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Create a secure password for your account</div>
          <div className="bg-[rgba(255,255,255,.07)] border border-[rgba(255,255,255,.15)] rounded-[7px] p-[14px] mb-3">
            <div className="text-[10px] font-bold text-[#7ab8dc] uppercase tracking-[0.5px] mb-[6px]">Contact Person</div>
            {contactPerson && (
              <>
                <div className="text-[12px] font-bold text-white">{contactPerson.firstName} {contactPerson.lastName}</div>
                <div className="text-[11px] text-[#7ab8dc] mt-[2px]">{contactPerson.email}</div>
              </>
            )}
          </div>
          <div className="text-[11px] text-[#5a7a9a] mt-3 leading-relaxed">Your password should be strong and unique to protect your account.</div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Step 3 of 3 — Create Password</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">Set a secure password to complete your registration</div>
          
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Password <span className="text-[#e53e3e]">*</span></label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
              type="password" 
              placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
            />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">Minimum 8 characters, 1 uppercase, 1 number, 1 special character</div>
          </div>

          <div className="flex flex-col gap-1 mb-[18px]">
            <label className="text-[11px] font-semibold text-[#374151]">Confirm Password <span className="text-[#e53e3e]">*</span></label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
              type="password" 
              placeholder="Re-enter password" 
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
            />
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
            <button 
              className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" 
              onClick={onBack}
              disabled={isRegistering}
            >← Back</button>
            <button 
              className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60" 
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
