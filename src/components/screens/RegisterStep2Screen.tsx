'use client';

import React, { useState, useEffect } from 'react';
import { getTinVerification } from '../../utils/tinVerification';
import CustomSelect from '../CustomSelect';

interface Designation {
  code: string;
  name: string;
}

interface RegisterStep2ScreenProps {
  onBack: () => void;
  onContinue: () => void;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function RegisterStep2Screen({ onBack, onContinue }: RegisterStep2ScreenProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    designationCode: '',
    email: '',
    phoneNumber: '',
  });
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoadingDesignations, setIsLoadingDesignations] = useState(false);
  const [error, setError] = useState('');
  const [companyInfo, setCompanyInfo] = useState<{ registeredName: string; tin: string } | null>(null);

  useEffect(() => {
    // Load TIN verification data
    const tinData = getTinVerification();
    if (tinData) {
      setCompanyInfo({
        registeredName: tinData.registeredName,
        tin: tinData.tin,
      });
    }

    // Load designations
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    const baseUrl = getBaseApiUrl();
    if (!baseUrl) {
      setError('API base URL is not configured.');
      return;
    }

    setIsLoadingDesignations(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/reference/designations`);
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        setDesignations(result.data);
      } else {
        setError('Failed to load designations.');
      }
    } catch (err) {
      setError('Failed to load designations. Please try again.');
    } finally {
      setIsLoadingDesignations(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('First name is required.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required.');
      return false;
    }
    if (!formData.designationCode) {
      setError('Designation is required.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required.');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required.');
      return false;
    }
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length <= 11) {
      setError('Phone number must be more than 11 digits.');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // Store contact person data for step 3
    localStorage.setItem('naccima_contact_person', JSON.stringify(formData));
    onContinue();
  };

  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[6px]">Contact Person</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Provide your contact details</div>
          {companyInfo && (
            <div className="bg-[rgba(255,255,255,.07)] border border-[rgba(255,255,255,.15)] rounded-[7px] p-[14px] mb-3">
              <div className="text-[10px] font-bold text-[#7ab8dc] uppercase tracking-[0.5px] mb-[6px]">✅ NRS-Verified Company</div>
              <div className="text-[12px] font-bold text-white">{companyInfo.registeredName}</div>
              <div className="text-[11px] text-[#7ab8dc] mt-[2px] font-mono">TIN: {companyInfo.tin}</div>
            </div>
          )}
          <div className="text-[11px] text-[#5a7a9a] mt-3 leading-relaxed">This person will receive verification emails and support notices.</div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Step 2 of 3 — Contact Person Details</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">Enter the contact details for the person responsible for this account.</div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#374151]">First Name <span className="text-[#e53e3e]">*</span></label>
              <input 
                className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
                placeholder="First name" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#374151]">Last Name <span className="text-[#e53e3e]">*</span></label>
              <input 
                className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
                placeholder="Last name" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Designation <span className="text-[#e53e3e]">*</span></label>
            <CustomSelect
              options={designations}
              value={formData.designationCode}
              onChange={(value) => handleInputChange('designationCode', value)}
              placeholder="Select designation..."
              isLoading={isLoadingDesignations}
              error={!formData.designationCode && error?.includes('Designation') ? 'Designation is required' : undefined}
            />
          </div>

          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Email Address <span className="text-[#e53e3e]">*</span></label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
              type="email" 
              placeholder="contact@example.com" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">This email is used for verification and notifications.</div>
          </div>

          <div className="flex flex-col gap-1 mb-[18px]">
            <label className="text-[11px] font-semibold text-[#374151]">Phone Number <span className="text-[#e53e3e]">*</span></label>
            <input 
              className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" 
              placeholder="e.g. +234 800 000 0000" 
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            />
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
            >← Back</button>
            <button 
              className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70]" 
              onClick={handleContinue}
            >
              Continue to Password
            </button>
          </div>
          <div className="text-[10.5px] text-[#9ca3af] mt-[10px] text-center">By continuing, you confirm this contact person is authorised to receive registration emails and support information.</div>
        </div>
      </div>
    </div>
  );
}
