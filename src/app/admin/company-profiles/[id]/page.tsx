'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';

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

export default function AdminCompanyProfileDetail() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getMembershipBadge = (status: Company['membershipStatus'], active: boolean) => {
    if (status === 'MEMBER' && active) {
      return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Active Member</span>;
    }
    if (status === 'MEMBER' && !active) {
      return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#fef3c7] text-[#92400e]">Inactive Member</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">Non-Member</span>;
  };

  const getStatusBadge = (active: boolean) => {
    if (active) {
      return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Active</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Inactive</span>;
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
                <div className="text-[#6a7a9a] mt-3">Loading company profile...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="text-center py-8 text-[#e53e3e]">{error || 'Company not found'}</div>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <button 
                  className="text-[12px] text-[#1a4a8a] hover:underline mb-2 cursor-pointer"
                  onClick={() => router.push('/admin/company-profiles')}
                >
                  ← Back to Company Profiles
                </button>
                <div className="text-[20px] font-medium text-[#1a2236]">Company Profile</div>
                <div className="text-[12px] text-[#6a7a9a]">{company.companyName}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70]"
                  onClick={() => router.push(`/admin/my-applications?search=${company.companyName}`)}
                >
                  View Applications
                </button>
              </div>
            </div>

            {/* Company Overview Card */}
            <div className="bg-white border border-[#dde3ee] rounded-[8px] p-6 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[16px] font-semibold text-[#1a2236] mb-1">{company.companyName}</div>
                  <div className="text-[13px] text-[#6a7a9a]">TIN: {company.tin}</div>
                </div>
                <div className="flex gap-2">
                  {getMembershipBadge(company.membershipStatus, company.membershipActive)}
                  {getStatusBadge(company.active)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#dde3ee]">
                <div>
                  <div className="text-[11px] text-[#6a7a9a] font-medium mb-1">Total Applications</div>
                  <div className="text-[18px] font-semibold text-[#1a4a8a]">{company.applicationCount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#6a7a9a] font-medium mb-1">Email</div>
                  <div className="text-[13px] text-[#1a2236] break-all">{company.email}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#6a7a9a] font-medium mb-1">Phone Number</div>
                  <div className="text-[13px] text-[#1a2236]">{company.phoneNumber}</div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white border border-[#dde3ee] rounded-[8px] p-6 mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-4">Contact Information</div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-[11px] text-[#6a7a9a] font-medium mb-1">Registered Address</div>
                  <div className="text-[13px] text-[#1a2236]">{company.registeredAddress}</div>
                </div>
              </div>
            </div>

            {/* Membership History */}
            <div className="bg-white border border-[#dde3ee] rounded-[8px] p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-4">Membership History</div>
              {company.membershipHistory && company.membershipHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#4a5a7a] font-semibold">
                        <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Start Date</th>
                        <th className="px-3 py-2 text-left border-b border-[#dde3ee]">End Date</th>
                        <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Comment</th>
                        <th className="px-3 py-2 text-left border-b border-[#dde3ee]">New Membership Active</th>
                        <th className="px-3 py-2 text-left border-b border-[#dde3ee]">action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {company.membershipHistory.map((history: any, index: number) => (
                        <tr key={index} className="hover:bg-[#f8fafc]">
                          <td className="px-3 py-2 border-b border-[#edf0f5]">{history.previousStartDate || '—'}</td>
                          <td className="px-3 py-2 border-b border-[#edf0f5]">{history.previousEndDate || '—'}</td>
                          <td className="px-3 py-2 border-b border-[#edf0f5]">{history.comment || '—'}</td>
                          <td className="px-3 py-2 border-b border-[#edf0f5]">{history.newMembershipActive ? "True" :"False"}</td>
                          <td className="px-3 py-2 border-b border-[#edf0f5]">{history.action || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-[13px] text-[#6a7a9a]">No membership history available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
