'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { FaPlus } from "react-icons/fa";
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, getBaseUrl, clearAuthData } from '@/utils/api';
import { FaArrowUp } from "react-icons/fa6";
interface Application {
  applicationId: string;
  approvalNumber: string;
  certificateType: string;
  destination: string;
  submittedAt: string;
  status: string;
  action: string;
  certificateNumber?: string;
  certificatePdfUrl?: string;
}

interface DashboardData {
  activeApplications: number;
  pendingPayment: number;
  underReview: number;
  certificatesIssued: number;
  newApplicationsThisWeek: number;
  certificatesIssuedThisMonth: number;
  averageReviewDays: number;
  membership: {
    member: boolean;
    status: string;
  };
  recentApplications: Application[];
  generatedAt: string;
}

interface CompanyProfile {
  companyName: string;
  tin: string;
}

function ExporterDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const [showPaymentSuccessToast, setShowPaymentSuccessToast] = useState(false);
  const [paymentSuccessReference, setPaymentSuccessReference] = useState<string | null>(null);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const reference = searchParams.get('reference');

    if (status === 'success' || reference) {
      setPaymentSuccessReference(reference);
      setShowPaymentSuccessToast(true);

      const hideTimer = setTimeout(() => setShowPaymentSuccessToast(false), 5000);
      return () => clearTimeout(hideTimer);
    }
  }, [searchParams]);

  useEffect(() => {
    const shouldShowToast = localStorage.getItem('showWelcomeToast');
    if (shouldShowToast === 'true') {
      localStorage.removeItem('showWelcomeToast');
      let hideTimer: ReturnType<typeof setTimeout> | undefined;
      const showTimer = setTimeout(() => {
        setShowWelcomeToast(true);
        hideTimer = setTimeout(() => setShowWelcomeToast(false), 4000);
      }, 0);

      return () => {
        clearTimeout(showTimer);
        if (hideTimer) clearTimeout(hideTimer);
      };
    }
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        console.error('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/companies/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCompanyProfile(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
    }
  };

  const fetchDashboardData = async () => {
    setIsLoadingDashboard(true);
    setIsLoadingApps(true);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        console.error('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setDashboardData(result.data);
        setRecentApplications(result.data.recentApplications || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoadingDashboard(false);
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchDashboardData();
      fetchCompanyProfile();
    }, 0);

    return () => clearTimeout(fetchTimer);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    clearAuthData();
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      DRAFT: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' },
      SUBMITTED: { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]' },
      PAID: { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]' },
      PENDING_PAYMENT: { bg: 'bg-[#dbeafe]', text: 'text-[#1e40af]' },
      UNDER_REVIEW: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]' },
      APPROVED: { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]' },
      REJECTED: { bg: 'bg-[#fee2e2]', text: 'text-[#9b1c1c]' },
      ISSUED: { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]' },
      CERTIFICATE_ISSUED: { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]' },
      UNAPPROVED: { bg: 'bg-[#fdf2f8]', text: 'text-[#9d174d]' },
    };
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PAID: 'Paid',
      PENDING_PAYMENT: 'Pending Payment',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      ISSUED: 'Issued',
      CERTIFICATE_ISSUED: 'Issued',
      UNAPPROVED: 'Unapproved',
    };
    const badge = badges[status] || { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]' };
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap ${badge.bg} ${badge.text}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getActionButton = (status: string, id: string, pdfUrl?: string) => {
    if (status === 'ISSUED' || status === 'CERTIFICATE_ISSUED') {
      return (
        <button 
          className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]"
          onClick={() => {
            if (pdfUrl) {
              window.open(pdfUrl, '_blank');
            }
          }}
        >
          Download
        </button>
      );
    }
    if (status === 'PENDING_PAYMENT') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Pay Now</button>;
    }
    if (status === 'UNAPPROVED') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Edit & Resubmit</button>;
    }
    if (status === 'PAID') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push(`/my-applications/${id}`)}>Self Assign & Review</button>;
    }
    return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/my-applications/${id}`)}>View</button>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const MetricCardSkeleton = () => (
    <div className="flex-1 rounded-[8px] border border-[#e6edf9] bg-white px-[14px] py-[12px] shadow-[0_2px_6px_rgba(26,34,54,0.04)] animate-pulse">
      <div className="h-[10px] w-[34%] rounded-full bg-[#edf3fb] mb-[10px]" />
      <div className="h-[28px] w-[42%] rounded-full bg-[#edf3fb] mb-[10px]" />
      <div className="h-[14px] w-[62%] rounded-full bg-[#f3f7fc]" />
      <div className="mt-[10px] h-[10px] w-[28%] rounded-full bg-[#edf3fb]" />
    </div>
  );

  const metricCards = [
    {
      key: 'active',
      label: 'Active Applications',
      value: dashboardData?.activeApplications || 0,
      meta: `${dashboardData?.newApplicationsThisWeek || 0} new this week`,
      color: 'text-[#2c5282]',
      href: '/my-applications',
      highlight: 'text-[#059669]',
      accent: 'bg-[#eaf7f2]',
      icon: <FaArrowUp className="text-[#059669]" />
    },
    {
      key: 'pending',
      label: 'Pending Payment',
      value: dashboardData?.pendingPayment || 0,
      meta: 'Action required',
      color: 'text-[#92400e]',
      href: '/my-applications?status=PENDING_PAYMENT',
      highlight: 'text-[#92400e]',
      accent: 'bg-[#fff1e6]',
      icon: null
    },
    {
      key: 'review',
      label: 'Under Review',
      value: dashboardData?.underReview || 0,
      meta: `Avg. ${dashboardData?.averageReviewDays?.toFixed(1) || '0'} days`,
      color: 'text-[#1a2236]',
      href: '/my-applications?status=UNDER_REVIEW',
      highlight: 'text-[#1a2236]',
      accent: 'bg-[#f1f5ff]',
      icon: null
    },
    {
      key: 'issued',
      label: 'Certificates Issued',
      value: dashboardData?.certificatesIssued || 0,
      meta: `${dashboardData?.certificatesIssuedThisMonth || 0} this month`,
      color: 'text-[#065f46]',
      href: '/my-applications?status=ISSUED',
      highlight: 'text-[#059669]',
      accent: 'bg-[#eaf7f2]',
      icon: <FaArrowUp className="text-[#059669]" />
    }
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white  overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)] ">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="text-[22px] font-bold text-[#1a2236] mb-[3px]">Welcome, {companyProfile?.companyName || 'Loading...'}</div>
            <div className="text-[13px] text-[#6a7a9a] mb-[10px]">TIN: {companyProfile?.tin || 'Loading...'} &nbsp;|&nbsp; Last login: Today, &apos;---&apos;</div>
            {showPaymentSuccessToast && (
              <div className="mb-[14px] flex items-center justify-between gap-3 rounded-[8px] border border-[#86efac] bg-[#ecfdf5] px-[12px] py-[10px] text-[13px] font-semibold text-[#065f46] shadow-[0_2px_8px_rgba(5,150,105,0.12)]">
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">✓</span>
                  <span>Payment successful.</span>
                </div>
                {paymentSuccessReference && (
                  <span className="text-[11px] font-medium text-[#0f766e] break-all">
                    Ref: {paymentSuccessReference}
                  </span>
                )}
              </div>
            )}
            {dashboardData?.membership?.member && (
              <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-[14px] text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                ★NACCIMA Member rates apply
              </div>
            )}
            <div className="flex gap-3 mb-[18px]">
              {isLoadingDashboard
                ? metricCards.map((card) => <MetricCardSkeleton key={card.key} />)
                : metricCards.map((card) => (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => router.push(card.href)}
                      className="flex-1 cursor-pointer rounded-[8px] border border-[#dde3ee] bg-white px-[14px] py-[12px] text-left shadow-[0_2px_8px_rgba(26,34,54,0.08)] transition hover:border-[#1a4a8a] hover:shadow-[0_6px_18px_rgba(26,74,138,0.14)] focus:outline-none focus:ring-2 focus:ring-[#1a4a8a] focus:ring-offset-2"
                      aria-label={`View ${card.label}`}
                    >
                      <div className={`text-[26px] font-extrabold ${card.color} mb-[2px]`}>{card.value}</div>
                      <div className="text-[15px] text-[#6a7a9a] font-medium">{card.label}</div>
                      <div className={`text-[13px] ${card.highlight} mt-[3px] ${card.icon ? 'pt-2 flex items-center gap-1' : 'pt-2'}`}>
                        {card.icon}
                        <span>{card.meta}</span>
                      </div>
                    </button>
                  ))}
            </div>
            <div className="flex items-center justify-between my-[13px] pt-[18px]">
              <div className="text-[19px] font-medium text-[#1a2236]">Recent Applications</div>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push('/new-application')}><FaPlus color="white"/> New Application</button>
            </div>
            <div className="overflow-x-auto pt-4">
              <table className="w-full border-collapse text-[14px]">
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
                      <td colSpan={6} className="px-[11px] py-[10px] border-b border-[#edf0f5]">
                        <div className="flex items-center justify-center gap-3 rounded-[8px] border border-[#edf0f5] bg-[#f8fafc] px-4 py-5 text-[#4a5a7a]">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse" />
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse [animation-delay:120ms]" />
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse [animation-delay:240ms]" />
                          </div>
                          <span className="text-[13px] font-medium">Gathering your recent applications...</span>
                        </div>
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
                      <tr key={app.applicationId} className="hover:bg-[#f8faff] uppercase">
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.approvalNumber}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.certificateType}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.destination}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{formatDate(app.submittedAt)}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">
                          <div className="flex gap-1">{getActionButton(app.status, app.applicationId, app.certificatePdfUrl)}</div>
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
              <div className="text-[11px] opacity-90">You&apos;re now logged into your dashboard</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExporterDashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f8fafc] px-4">
          <div className="w-full max-w-[420px] rounded-[18px] border border-[#e2e8f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#dbeafe]" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#1a4a8a] animate-spin" />
                <div className="absolute inset-3 rounded-full border-2 border-[#e2e8f0]" />
              </div>

              <div className="mt-5 text-center">
                <div className="text-[12px] font-bold tracking-[0.22em] text-[#64748b] uppercase">Loading</div>
                <div className="mt-2 text-[18px] font-semibold text-[#1a2236]">Dashboard</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ExporterDashboardContent />
    </Suspense>
  );
}
