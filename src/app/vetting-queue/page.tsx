/* eslint-disable react-hooks/static-components */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { Search, Ship, Plane, Truck, ChevronDown, Filter, FileText, CheckCircle, XCircle, BarChart3, Clock, AlertCircle, ChevronsUpDown, X } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { format } from 'date-fns';

interface DashboardStats {
  pendingReview: number;
  myReviews: number;
  reviewedToday: number;
  approvedToday: number;
  rejectedToday: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  generatedAt: string;
}

interface Application {
  applicationId: string;
  companyId: string;
  tin: string;
  certificateTypeId: string;
  certificateType: string;
  modeOfTransport: string;
  submittedAt: string;
  fobValue: number;
  fobCurrency: string;
  status: string;
}

export default function VettingQueuePage() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCertType, setFilterCertType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('SUBMITTED');
  const [filterTransport, setFilterTransport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<'certType' | 'status' | 'transport' | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/dashboard`);
      const data = await response.json();
      if (data.success) {
        setDashboardStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const baseUrl = getBaseUrl();
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }
      const query = params.toString();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications${query ? `?${query}` : ''}`);
      const data = await response.json();
      if (data.success && data.data) {
        setApplications(data.data.content || []);
        setTotalElements(data.data.totalElements || 0);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    router.push('/login');
  };

  const handleReviewAction = async (app: Application) => {
    if (app.status === 'PAID') {
      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          throw new Error('API base URL is not configured');
        }

        const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${app.applicationId}/self-assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: 'Taking this application for review.',
          }),
        });

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          console.error('Failed to self-assign application:', payload?.message || 'Unknown error');
          return;
        }
      } catch (err) {
        console.error('Self-assign failed:', err);
        return;
      }
    }

    router.push(`/vetting-review/${app.applicationId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted', icon: <FileText className="w-3 h-3" /> },
      UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review', icon: <Clock className="w-3 h-3" /> },
      PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid', icon: <CheckCircle className="w-3 h-3" /> },
      INFO_REQUESTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info Requested', icon: <AlertCircle className="w-3 h-3" /> },
      UNAPPROVED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Unapproved', icon: <XCircle className="w-3 h-3" /> },
    };

    const s = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: <FileText className="w-3 h-3" /> };
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getTransportIcon = (transport: string) => {
    const icons: Record<string, React.ReactNode> = {
      SEA: <Ship className="w-4 h-4" />,
      AIR: <Plane className="w-4 h-4" />,
      LAND: <Truck className="w-4 h-4" />,
    };
    return icons[transport] || <FileText className="w-4 h-4" />;
  };

  const filteredApplications = applications.filter((app) => {
    if (filterCertType !== 'all' && !app.certificateType.toLowerCase().includes(filterCertType.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && app.status !== filterStatus) {
      return false;
    }
    if (filterTransport !== 'all' && app.modeOfTransport.toLowerCase() !== filterTransport.toLowerCase()) {
      return false;
    }
    if (searchQuery && !app.tin.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  const pendingCount = dashboardStats?.pendingReview || 0;
  const reviewedToday = dashboardStats?.reviewedToday || 0;
  const approvedThisMonth = dashboardStats?.approvedThisMonth || 0;
  const rejectedThisMonth = dashboardStats?.rejectedThisMonth || 0;

  const certTypeOptions = [
    { value: 'all', label: 'All Certificate Types' },
    { value: 'origin', label: 'Certificate of Origin' },
    { value: 'gsp', label: 'GSP' },
    { value: 'ecowas', label: 'ECOWAS' },
    { value: 'movement', label: 'Movement' },
    { value: 'mineral', label: 'Solid Mineral' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'PAID', label: 'Paid / Unassigned' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'INFO_REQUESTED', label: 'Info Requested' },
  ];

  const transportOptions = [
    { value: 'all', label: 'All Transport' },
    { value: 'sea', label: 'Sea' },
    { value: 'air', label: 'Air' },
    { value: 'land', label: 'Land' },
  ];

  type DropdownOption = {
    value: string;
    label: string;
  };

  const getSelectedLabel = (options: DropdownOption[], value: string) => {
    return options.find(opt => opt.value === value)?.label || options[0]?.label || 'Select';
  };

  const CustomDropdown = ({ 
    options, 
    value, 
    onChange, 
    width,
    dropdownKey,
  }: { 
    options: DropdownOption[]; 
    value: string; 
    onChange: (val: string) => void; 
    width: string;
    dropdownKey: 'certType' | 'status' | 'transport';
  }) => {
    const isOpen = openDropdown === dropdownKey;
    
    return (
      <div className="relative" style={{ width }}>
        <button
          onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <span className="truncate">{getSelectedLabel(options, value)}</span>
          {isOpen ? (
            <X className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          ) : (
            <ChevronsUpDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          )}
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 transition-colors ${
                    value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="vetting" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="vetting" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto bg-[#fbfbfe]">
            <div className="mb-[18px]">
              <div className="text-[16px] font-bold text-[#1a2236]">Applications Queue</div>
              <div className="text-[11.5px] text-[#6a7a9a] mt-1">Paid applications awaiting vetting — oldest first (FIFO)</div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <button
                type="button"
                onClick={() => router.push('/vetting-queue')}
                className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#1a4a8a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a4a8a] focus:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Awaiting Review</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/vetting-review')}
                className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#1a4a8a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a4a8a] focus:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Today</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{reviewedToday}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Reviewed Today</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/vetting-review?status=APPROVED')}
                className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#1a4a8a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a4a8a] focus:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Month</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{approvedThisMonth}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Approved This Month</div>
              </button>
              <button
                type="button"
                onClick={() => router.push('/vetting-review?status=REJECTED')}
                className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-[#1a4a8a] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1a4a8a] focus:ring-offset-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Month</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{rejectedThisMonth}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Rejected This Month</div>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 flex-wrap bg-gray-50 border border-gray-200 rounded-xl p-4">
              <CustomDropdown 
                options={certTypeOptions} 
                value={filterCertType} 
                onChange={setFilterCertType} 
                width="160px"
                dropdownKey="certType"
              />
              <CustomDropdown 
                options={statusOptions} 
                value={filterStatus} 
                onChange={setFilterStatus} 
                width="140px"
                dropdownKey="status"
              />
              <CustomDropdown 
                options={transportOptions} 
                value={filterTransport} 
                onChange={setFilterTransport} 
                width="130px"
                dropdownKey="transport"
              />
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by TIN…"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            <div className="overflow-x-auto pt-4">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">TIN</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Certificate Type</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Transport</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Submitted</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">FOB Value</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-[11px] py-[10px] border-b border-[#edf0f5]">
                        <div className="flex items-center justify-center gap-3 rounded-[8px] border border-[#edf0f5] bg-[#f8fafc] px-4 py-5 text-[#4a5a7a]">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse" />
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse [animation-delay:120ms]" />
                            <span className="h-2 w-2 rounded-full bg-[#9eb7d6] animate-pulse [animation-delay:240ms]" />
                          </div>
                          <span className="text-[13px] font-medium">Gathering applications for review...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-[11px] py-[8px] border-b border-[#edf0f5] text-center text-[#6a7a9a]">
                        No applications found
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr
                        key={app.applicationId}
                        className="hover:bg-[#f8faff]"
                      >
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">
                          <span className="font-mono text-[12px]">{app.tin}</span>
                        </td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.certificateType}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">
                          <div className="flex items-center gap-2">
                            {getTransportIcon(app.modeOfTransport)}
                            <span className="text-[12px]">{app.modeOfTransport}</span>
                          </div>
                        </td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle text-[12px]">
                          {format(new Date(app.submittedAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle font-medium">
                          {app.fobCurrency === 'USD' ? '$' : '₦'}{app.fobValue.toLocaleString()}
                        </td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">
                          <button
                            className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]"
                            onClick={() => handleReviewAction(app)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>Showing {filteredApplications.length} of {totalElements} applications</span>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  ← Prev
                </button>
                <button className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                  Next →
                </button>
              </div>
            </div>

            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
