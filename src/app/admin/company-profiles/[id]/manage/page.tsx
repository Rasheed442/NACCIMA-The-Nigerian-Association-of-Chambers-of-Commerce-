'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';
import DatePicker from '@/components/DatePicker';
import Toggle from '@/components/Toggle';

interface Company {
  id: string;
  tin: string;
  companyName: string;
  registeredAddress: string;
  email: string;
  phoneNumber: string;
  active: boolean; 
  membershipStatus: 'NON_MEMBER' | 'MEMBER';
  membershipActive: boolean;
  applicationCount: number;
  membershipHistory: any[];
}

export default function AdminCompanyManage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    registeredAddress: '',
    email: '',
    phoneNumber: '',
    membershipStatus: 'NON_MEMBER' as 'NON_MEMBER' | 'MEMBER',
    membershipActive: false,
    active: false,
    membershipStartDate: '',
    membershipEndDate: '',
    membershipComment: '',
  });

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCompany(result.data);
        setFormData({
          companyName: result.data.companyName,
          registeredAddress: result.data.registeredAddress,
          email: result.data.email,
          phoneNumber: result.data.phoneNumber,
          membershipStatus: result.data.membershipStatus,
          membershipActive: result.data.membershipActive,
          active: result.data.active,
          membershipStartDate: '',
          membershipEndDate: '',
          membershipComment: '',
        });
      } else {
        setError(result.message || 'Failed to fetch company');
      }
    } catch (err) {
      console.error('Failed to fetch company:', err);
      setError('Failed to fetch company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh company data
        fetchCompany();
      } else {
        setError(result.message || 'Failed to update company');
      }
    } catch (err) {
      console.error('Failed to update company:', err);
      setError('Failed to update company');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMembership = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const membershipPayload = {
        membershipActive: formData.membershipActive,
        membershipStartDate: formData.membershipStartDate,
        membershipEndDate: formData.membershipEndDate,
        comment: formData.membershipComment || 'Membership updated by administrator.',
      };

      const response = await apiFetch(`${baseUrl}/api/v1/admin/companies/${companyId}/membership`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(membershipPayload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh company data
        fetchCompany();
      } else {
        setError(result.message || 'Failed to update membership');
      }
    } catch (err) {
      console.error('Failed to update membership:', err);
      setError('Failed to update membership');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/company-profiles/${companyId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="flex flex-col items-center justify-center py-12">
                <ClipLoader size={40} color="#1a4a8a" />
                <div className="text-[#6a7a9a] mt-3">Loading company...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="text-center py-8 text-[#e53e3e]">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <button 
                  className="text-[12px] text-[#1a4a8a] hover:underline mb-2 cursor-pointer"
                  onClick={() => router.push('/admin/company-profiles')}
                >
                  ← Back to Company Profiles
                </button>
                <div className="text-[20px] font-medium text-[#1a2236]">{company?.companyName}</div>
                <div className="text-[12px] text-[#6a7a9a]">TIN: {company?.tin}</div>
              </div>
              <div className="flex gap-2">
                <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${company?.membershipStatus === 'MEMBER' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                  ★{company?.membershipStatus === 'MEMBER' ? 'MEMBER' : 'NON_MEMBER'}
                </span>
                <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${company?.active ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                  {company?.active ? 'Active Account' : 'Inactive Account'}
                </span>
              </div>
            </div>

            {success && (
              <div className="mb-4 px-4 py-3 bg-[#d1fae5] text-[#065f46] rounded-[4px] text-[13px]">
                Company updated successfully
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 bg-[#fee2e2] text-[#9b1c1c] rounded-[4px] text-[13px]">
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
              {/* Left Column */}
              <div>
                {/* Section 1: NRS-Verified Details */}
                <div className="bg-white border border-[#dde3ee] rounded p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#1a4a8a] text-white text-[12px] font-bold flex items-center justify-center">1</div>
                    <div className="text-[14px] font-semibold text-[#1a2236]">NRS-Verified Details</div>
                    <span className="text-[10px] text-[#6a7a9a] bg-[#f3f4f6] px-2 py-1 rounded">Locked · NRS API</span>
                  </div>
                  
                  <div className="bg-[#d1fae5] border border-green-400 rounded-[6px] p-4 mb-4">
                    <div className="text-[13px] text-green-900 mb-3">🔒 These fields are locked — retrieved from NRS at registration</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] text-[#6a7a9a] font-medium mb-1">TIN</label>
                        <input
                          type="text"
                          value={company?.tin}
                          readOnly
                          className="w-full px-3 py-2 border  border-green-400 rounded-[4px] text-[13px] bg-[#d1fae5] text-green-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] text-[#6a7a9a] font-medium mb-1">Shipper's Name</label>
                        <input
                          type="text"
                          value={formData.companyName}
                          readOnly
                          className="w-full px-3 py-2 border  border-green-400 rounded-[4px] text-[13px] bg-[#d1fae5] text-green-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[13px] text-[#6a7a9a] font-medium mb-1">Registered Address</label>
                        <input
                          type="text"
                          value={formData.registeredAddress}
                          readOnly
                          className="w-full px-3 py-2 border  border-green-400 rounded-[4px] text-[13px] bg-[#d1fae5] text-green-900"
                        />
                      </div>
                    </div>
                    <div className="text-[10.5px] text-[#065f46] mt-3">To correct these fields, make the change here and record the reason — the action will be logged in the audit trail.</div>
                    <button className="mt-2 px-3 py-1.5 border font-semibold  border-green-400 rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]">
                      ✏️ Override NRS Fields (Admin only)
                    </button>
                  </div>
                </div>

                {/* Section 2: Contact Details */}
                <div className="bg-white border border-[#dde3ee] rounded p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#1a4a8a] text-white text-[12px] font-bold flex items-center justify-center">2</div>
                    <div className="text-[14px] font-semibold text-[#1a2236]">Contact Details</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Contact Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Account Status */}
                <div className="bg-white border border-[#dde3ee] rounded p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#1a4a8a] text-white text-[12px] font-bold flex items-center justify-center">3</div>
                    <div className="text-[14px] font-semibold text-[#1a2236]">Account Status</div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-[10px_12px] bg-[#f8fafd] border border-[#dde3ee] rounded-[6px]">
                    <Toggle
                      checked={formData.active}
                      onChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <div>
                      <div className="text-[12px] font-semibold text-[#1a2236]">Account Active</div>
                      <div className="text-[10.5px] text-[#6b7280]">Toggle to disable — exporter cannot log in while inactive</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full px-4 py-2.5 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save Contact & Status Changes'}
                </button>
              </div>

              {/* Right Column: Membership Management */}
              <div className="bg-white border border-[#dde3ee] rounded-[8px] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[14px] font-semibold text-[#1a2236]">★ Membership Management</div>
                  <span className="text-[10px] text-[#6a7a9a] bg-[#f3f4f6] px-2 py-1 rounded">v2.2</span>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 p-2 bg-[#d1fae5] border border-[#86efac] rounded-[6px] mb-3">
                    <Toggle
                      checked={formData.membershipActive}
                      onChange={(checked) => setFormData(prev => ({ ...prev, membershipActive: checked }))}
                      className="bg-[#065f46]"
                    />
                    <div>
                      <div className="text-[12px] font-bold text-[#065f46]">NACCIMA Member</div>
                      <div className="text-[10px] text-[#065f46]">Member rates apply when active</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Membership Start Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      value={formData.membershipStartDate}
                      onChange={(value) => setFormData(prev => ({ ...prev, membershipStartDate: value }))}
                      placeholder="Select start date"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Membership End Date <span className="text-red-500">*</span></label>
                    <DatePicker
                      value={formData.membershipEndDate}
                      onChange={(value) => setFormData(prev => ({ ...prev, membershipEndDate: value }))}
                      placeholder="Select end date"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Comment</label>
                    <textarea
                      name="membershipComment"
                      value={formData.membershipComment}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Add a comment for this membership change..."
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                    />
                  </div>
                  
                  {formData.membershipActive && formData.membershipStartDate && formData.membershipEndDate && (
                    <div className="bg-[#f0fdf4] border border-[#86efac] rounded-[5px] p-2 text-[11px] text-[#065f46] mb-3">
                      ✅ Active Member: {formData.membershipStartDate} – {formData.membershipEndDate}
                      <div className="text-[10.5px] text-[#374151] mt-1">Fee calculation will use member rates for applications submitted within this period.</div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleSaveMembership}
                    disabled={isSaving}
                    className="w-full px-4 py-2 bg-[#059669] text-white cursor-pointer rounded-[4px] text-[12px] font-medium hover:bg-[#047857] mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Membership Status'}
                  </button>
                  <div className="text-[10.5px] text-[#9ca3af] text-center">Changes are recorded in the audit log</div>
                </div>
                
                <hr className="border-t border-[#e5e7eb] my-3" />
                
                <div className="text-[11.5px] font-semibold text-[#1a2236] mb-3">Membership Change Log</div>
                <div className="text-[11px] flex flex-col gap-2">
                  {company?.membershipHistory && company.membershipHistory.length > 0 ? (
                    company.membershipHistory.map((history: any, index: number) => (
                      <div key={index} className="bg-[#f8fafd] p-2 rounded-[4px] text-[#6a7a9a]">
                        {history.comment || 'No comment'}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#9ca3af]">No membership history</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
