'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { useRouter } from 'next/navigation';

interface CompanyProfile {
  companyId: string;
  tin: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  naccimaRegistrationNumber: string;
  rcNumber: string;
  address: string;
  state: string;
  lga: string;
  businessType: string;
  natureOfBusiness: string;
  website: string;
  yearOfIncorporation: number;
}

function getBaseApiUrl(): string {
  const rawBaseUrl = process.env.NEXT_PUBLIC_API || '';
  if (!rawBaseUrl) {
    return '';
  }
  return rawBaseUrl.replace(/\/+$/, '');
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state for editable fields
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    businessType: '',
    natureOfBusiness: '',
    website: '',
    yearOfIncorporation: '',
    rcNumber: '',
  });

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found. Please log in again.');
      }

      const response = await fetch(`${baseUrl}/api/v1/companies/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to fetch company profile.');
      }

      setProfile(result.data);
      setFormData({
        email: result.data.email || '',
        phoneNumber: result.data.phoneNumber || '',
        businessType: result.data.businessType || '',
        natureOfBusiness: result.data.natureOfBusiness || '',
        website: result.data.website || '',
        yearOfIncorporation: result.data.yearOfIncorporation?.toString() || '',
        rcNumber: result.data.rcNumber || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured.');
      }

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Access token not found. Please log in again.');
      }

      const payload = {
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        businessType: formData.businessType,
        natureOfBusiness: formData.natureOfBusiness,
        website: formData.website,
        yearOfIncorporation: parseInt(formData.yearOfIncorporation) || 0,
        rcNumber: formData.rcNumber,
      };

      const response = await fetch(`${baseUrl}/api/v1/companies/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update company profile.');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh profile data
      await fetchCompanyProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="exporter" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex items-center justify-center">
              <div className="text-[14px] text-[#6a7a9a]">Loading company profile...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="text-[22px] font-bold text-[#1a2236] mb-[3px]">Company Profile</div>
            <div className="text-[13px] text-[#6a7a9a] mb-[18px]">Manage your company information and settings</div>
            
            {error && (
              <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#fef2f2] border border-[#fca5a5] text-[#991b1b]">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-4 flex gap-2 items-start bg-[#f0fdf4] border border-[#86efac] text-[#065f46]">
                <span>✅</span>
                <span>Company profile updated successfully!</span>
              </div>
            )}

            <div className="bg-white border border-[#dde3ee] rounded p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)] mb-6">
              <div className="text-[17px] font-medium text-[#1a2236] mb-4">Company Information</div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Company Name</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb]">
                    {profile?.companyName || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">TIN</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb] font-mono tracking-widest">
                    {profile?.tin || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">NACCIMA Registration Number</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb]">
                    {profile?.naccimaRegistrationNumber || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Address</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb]">
                    {profile?.address || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">State</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb]">
                    {profile?.state || '-'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">LGA</label>
                  <div className="px-[10px] py-[7px] border border-[#e5e7eb] rounded-[5px] text-[12px] text-[#6b7280] bg-[#f9fafb]">
                    {profile?.lga || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#dde3ee] rounded p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[17px] font-medium text-[#1a2236] mb-4">Editable Information</div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Email Address <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Phone Number <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="text"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">RC Number <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="text"
                    value={formData.rcNumber}
                    onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Business Type <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-[13px] font-semibold text-[#374151]">Nature of Business <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="text"
                    value={formData.natureOfBusiness}
                    onChange={(e) => setFormData({ ...formData, natureOfBusiness: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Website</label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#374151]">Year of Incorporation <span className="text-[#e53e3e]">*</span></label>
                  <input 
                    className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]"
                    type="number"
                    value={formData.yearOfIncorporation}
                    onChange={(e) => setFormData({ ...formData, yearOfIncorporation: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="inline-flex items-center gap-1 px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer border border-[#ccd3e0] transition-all bg-white text-[#2a3a56] hover:bg-[#f1f4f9]"
                  onClick={fetchCompanyProfile}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-1 px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}