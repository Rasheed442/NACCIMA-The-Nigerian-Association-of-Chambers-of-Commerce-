'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Application {
  id: string;
  certificateType: string;
  destinationCountry: string;
  submittedAt: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_PAYMENT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'UNAPPROVED';
}

export default function ExporterDashboard() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    const shouldShowToast = localStorage.getItem('showWelcomeToast');
    if (shouldShowToast === 'true') {
      setShowWelcomeToast(true);
      localStorage.removeItem('showWelcomeToast');
      const timer = setTimeout(() => setShowWelcomeToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetchRecentApplications();
  }, []);

  const getBaseApiUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API;
    if (!rawBaseUrl) {
      return '';
    }
    return rawBaseUrl.replace(/\/$/, '');
  };

  const fetchRecentApplications = async () => {
    setIsLoadingApps(true);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        console.error('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const apps = Array.isArray(result.data) ? result.data : [result.data];
        const sortedApps = apps.sort((a: Application, b: Application) => 
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        ).slice(0, 10);
        setRecentApplications(sortedApps);
      }
    } catch (err) {
      console.error('Failed to fetch recent applications:', err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const getStatusBadge = (status: Application['status']) => {
    const badges: Record<Application['status'], { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' },
      SUBMITTED: { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]' },
      PENDING_PAYMENT: { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]' },
      UNDER_REVIEW: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
      APPROVED: { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]' },
      REJECTED: { bg: 'bg-[#fee2e2]', text: 'text-[#9b1c1c]' },
      ISSUED: { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]' },
      UNAPPROVED: { bg: 'bg-[#fdf2f8]', text: 'text-[#9d174d]' },
    };
    const labels: Record<Application['status'], string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PENDING_PAYMENT: 'Pending Payment',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      ISSUED: 'Issued',
      UNAPPROVED: 'Unapproved',
    };
    const badge = badges[status] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' };
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap ${badge.bg} ${badge.text}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getActionButton = (status: Application['status'], id: string) => {
    if (status === 'ISSUED') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]">Download</button>;
    }
    if (status === 'PENDING_PAYMENT') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Pay Now</button>;
    }
    if (status === 'UNAPPROVED') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Edit & Resubmit</button>;
    }
    return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/my-applications/${id}`)}>View</button>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white  overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)] ">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="text-[22px] font-bold text-[#1a2236] mb-[3px]">Welcome, Lagos Traders Ltd</div>
            <div className="text-[13px] text-[#6a7a9a] mb-[18px]">TIN: 12345678901 &nbsp;|&nbsp; Last login: Today, 10:24 AM</div>
            <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-[14px] text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
              ★ &nbsp;NACCIMA Member &nbsp;—&nbsp; Member rates apply &nbsp;|&nbsp; Valid until: 31 Dec 2026
            </div>
            <div className="flex gap-3 mb-[18px]">
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#2c5282] mb-[2px]">5</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Active Applications</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">↑ 2 new this week</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#92400e] mb-[2px]">1</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Pending Payment</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">Action required</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#1a2236] mb-[2px]">2</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Under Review</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">Avg. 2 days</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#065f46] mb-[2px]">23</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Certificates Issued</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">↑ 4 this month</div>
              </div>
            </div>
            <div className="flex items-center justify-between my-[13px]">
              <div className="text-[17px] font-medium text-[#1a2236]">Recent Applications</div>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push('/new-application')}><FaPlus color="white"/> New Application</button>
            </div>
            <div className="overflow-x-auto pt-4">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Approval #</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Certificate Type</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Destination</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Submitted</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingApps ? (
                    <tr>
                      <td colSpan={6} className="px-[11px] py-[8px] border-b border-[#edf0f5] text-center text-[#6a7a9a]">
                        Loading recent applications...
                      </td>
                    </tr>
                  ) : recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-[11px] py-[8px] border-b border-[#edf0f5] text-center text-[#6a7a9a]">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#f8faff] uppercase">
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.id}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.certificateType}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.destinationCountry}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{formatDate(app.submittedAt)}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">
                          <div className="flex gap-1">{getActionButton(app.status, app.id)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-[11px] text-[#6a7a9a]">
                {!isLoadingApps && `Showing ${Math.min(recentApplications.length, 10)} of ${recentApplications.length} recent applications`}
              </div>
              <button 
                className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[13px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" 
                onClick={() => router.push('/my-applications')}
              >
                View All →
              </button>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-[#059669] text-white px-4 py-3 rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-3">
            <span className="text-[18px]">👋</span>
            <div>
              <div className="text-[13px] font-bold">Welcome back!</div>
              <div className="text-[11px] opacity-90">You're now logged into your dashboard</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
