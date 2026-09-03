'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const certificateData = [
  { name: 'Cert. of Origin', applications: 482 },
  { name: 'GSP', applications: 320 },
  { name: 'ECOWAS', applications: 214 },
  { name: 'Movement', applications: 118 },
  { name: 'Solid Mineral', applications: 150 },
];

const certificateColors = ['#1d4ed8', '#2563eb', '#0ea5e9', '#7dd3fc', '#14b8a6'];

const statusData = [
  { name: 'Issued', value: 920 },
  { name: 'Under Review', value: 154 },
  { name: 'Paid / Awaiting Review', value: 90 },
  { name: 'Rejected', value: 80 },
  { name: 'Unapproved', value: 7 },
];

const statusColors: Record<string, string> = {
  Issued: '#1d4ed8',
  'Under Review': '#f59e0b',
  'Paid / Awaiting Review': '#10b981',
  Rejected: '#ef4444',
  Unapproved: '#8b5cf6',
};

const recentActivity = [
  {
    title: 'Certificate issued — NACC-2026-00398 (GSP)',
    company: 'Lagos Traders Ltd',
    time: '5 min ago',
    badge: 'success',
  },
  {
    title: 'Certificate unapproved — NACC-2026-00380 (ECOWAS)',
    company: 'Invalid ECOWAS Number',
    time: '1 hr ago',
    badge: 'error',
  },
  {
    title: 'Payment confirmed — NACC-2026-00422',
    company: '₦12,031.88 via Paystack',
    time: '2 hr ago',
    badge: 'neutral',
  },
  {
    title: 'Membership activated — Kano Agro Ltd',
    company: 'Member until 31 Dec 2026',
    time: '3 hr ago',
    badge: 'info',
  },
];

interface DashboardData {
  kpis: {
    totalApplications: number;
    revenueCollected: number;
    averageProcessingDays: number;
    rejectionRate: number;
  };
  applicationsByCertificateType: Array<{
    certificateTypeId: string;
    certificateType: string;
    count: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    applicationId: string;
    action: string;
    comment: string;
    actorId: string;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2027-01-01');

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const from = `${dateFrom}T00:00:00Z`;
        const to = `${dateTo}T00:00:00Z`;
        const response = await fetch(`/api/v1/admin/dashboard?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateFrom, dateTo]);

  const transformedCertificateData = useMemo(() => {
    if (!dashboardData) return certificateData;
    return dashboardData.applicationsByCertificateType.map((item) => ({
      name: item.certificateType.replace('NACCIMA ', '').replace(' Certificate', ''),
      applications: item.count,
    }));
  }, [dashboardData]);

  const transformedStatusData = useMemo(() => {
    if (!dashboardData) return statusData;
    const statusMapping: Record<string, string> = {
      SUBMITTED: 'Paid / Awaiting Review',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Issued',
      REJECTED: 'Rejected',
      CERTIFICATE_ISSUED: 'Issued',
    };
    const statusColorMapping: Record<string, string> = {
      SUBMITTED: '#10b981',
      UNDER_REVIEW: '#f59e0b',
      APPROVED: '#1d4ed8',
      REJECTED: '#ef4444',
      CERTIFICATE_ISSUED: '#1d4ed8',
    };
    return dashboardData.statusBreakdown.map((item) => ({
      name: statusMapping[item.status] || item.status,
      value: item.count,
    }));
  }, [dashboardData]);

  const transformedRecentActivity = useMemo(() => {
    if (!dashboardData) return recentActivity;
    return dashboardData.recentActivity.slice(0, 10).map((item) => {
      const timeAgo = new Date(item.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - timeAgo.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const timeString = diffMins < 60 ? `${diffMins} min ago` : `${diffHours} hr ago`;

      const badgeMapping: Record<string, 'success' | 'error' | 'info' | 'neutral'> = {
        APPROVED: 'success',
        REJECTED: 'error',
        ASSIGNED: 'info',
        SUBMITTED: 'neutral',
      };

      return {
        title: `${item.action} — Application`,
        company: item.comment,
        time: timeString,
        badge: badgeMapping[item.action] || 'neutral',
      };
    });
  }, [dashboardData]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[28px] py-[22px] overflow-x-hidden overflow-auto bg-[#fbfbfe]">
            <div className="text-[22px] font-bold text-[#1a2236] ">Admin Dashboard</div>
            <div className="text-[13px] text-[#6a7a9a] mb-[18px]">Overview as of {new Date().toLocaleDateString()}</div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-white border border-[#e5e7eb] rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-medium text-[#374151]">From:</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#d1d5db] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[13px] font-medium text-[#374151]">To:</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#d1d5db] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setLoading(true)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1d4ed8] rounded-md hover:bg-[#1e40af] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Apply Filter'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="rounded border border-[#e5e7eb] bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:ring-[#cbd5e1]">
                <div className="h-1.5 w-14 rounded-full bg-[#1d4ed8] mb-4" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[28px] font-semibold text-[#111827]">
                      {loading ? '...' : dashboardData?.kpis.totalApplications.toLocaleString() || '0'}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">Total Applications</div>
                  </div>
                  <div className="inline-flex items-center rounded bg-[#eff6ff] px-3 py-1 text-[12px] font-medium text-[#1d4ed8]">2026</div>
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:ring-[#cbd5e1]">
                <div className="h-1.5 w-14 rounded-full bg-[#059669] mb-4" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[28px] font-semibold text-[#065f46]">
                      {loading ? '...' : `₦${((dashboardData?.kpis.revenueCollected || 0) / 1000000).toFixed(1)}M`}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">Revenue Collected</div>
                  </div>
                  <div className="inline-flex items-center rounded bg-[#d1fae5] px-3 py-1 text-[12px] font-medium text-[#047857]">YTD</div>
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:ring-[#cbd5e1]">
                <div className="h-1.5 w-14 rounded-full bg-[#0f172a] mb-4" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[28px] font-semibold text-[#111827]">
                      {loading ? '...' : `${dashboardData?.kpis.averageProcessingDays.toFixed(2) || '0'} days`}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">Avg. Processing Time</div>
                  </div>
                  <div className="inline-flex items-center rounded bg-[#e2e8f0] px-3 py-1 text-[12px] font-medium text-[#334155]">Fast</div>
                </div>
              </div>
              <div className="rounded border border-[#e5e7eb] bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:ring-[#cbd5e1]">
                <div className="h-1.5 w-14 rounded-full bg-[#dc2626] mb-4" />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[28px] font-semibold text-[#b91c1c]">
                      {loading ? '...' : `${dashboardData?.kpis.rejectionRate.toFixed(2) || '0'}%`}
                    </div>
                    <div className="text-[13px] text-[#6b7280] mt-2">Rejection Rate</div>
                  </div>
                  <div className="inline-flex items-center rounded bg-[#fee2e2] px-3 py-1 text-[12px] font-medium text-[#991b1b]">Alert</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-white border border-[#edf2f7] shadow-sm rounded p-4">
                <div className="text-[16px] font-medium mb-3 pt-2">Applications by Certificate Type (2026)</div>
                <div className="h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transformedCertificateData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#4b5563', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#4b5563', fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} applications`} />
                      <Bar dataKey="applications" radius={[0, 0, 0, 0]} barSize={48}>
                        {transformedCertificateData.map((entry, index) => (
                          <Cell key={`bar-cell-${index}`} fill={certificateColors[index % certificateColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-[#edf2f7] shadow-sm rounded p-4">
                <div className="text-[16px] font-medium mb-3 pt-2">Status Breakdown</div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transformedStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={92}
                        paddingAngle={0}
                      >
                        {transformedStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name] || certificateColors[index % certificateColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} cases`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid gap-2">
                  {transformedStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[13px] text-[#374151]">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.name] || certificateColors[0] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold text-[#1f2937]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white border border-[#edf2f7] shadow-sm rounded-lg p-4">
              <div className="text-[18px] font-semibold text-[#1f2937] mb-4">Recent Activity</div>
              <div className="grid gap-3">
                {transformedRecentActivity.map((item, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${
                      item.badge === 'success'
                        ? 'border-emerald-200 bg-emerald-50'
                        : item.badge === 'error'
                        ? 'border-rose-200 bg-rose-50'
                        : item.badge === 'info'
                        ? 'border-sky-200 bg-sky-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-[14px] font-semibold text-[#111827]">{item.title}</div>
                      <div className="text-[13px] text-[#4b5563] mt-1">{item.company}</div>
                    </div>
                    <div className="text-[12px] text-[#6b7280] whitespace-nowrap">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
