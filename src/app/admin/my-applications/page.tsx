'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ChevronDown } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Application {
  applicationId: string;
  companyId: string;
  companyName: string;
  tin: string;
  certificateTypeId: string;
  certificateType: string;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_PAYMENT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CERTIFICATE_ISSUED' | 'UNAPPROVED';
  submittedAt?: string;
  paidAt?: string;
  totalValueFob: number;
  valueCurrency: string;
  assignedTo?: string;
}

export default function AdminApplications() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCertType, setFilterCertType] = useState('');
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [tempFromDate, setTempFromDate] = useState('');
  const [tempToDate, setTempToDate] = useState('');
  const [certTypeDropdownOpen, setCertTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<any[]>([]);
  const [transportModes, setTransportModes] = useState<any[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchCertificateTypes();
    fetchTransportModes();
  }, [currentPage, filterStatus, filterCertType, filterCompanyId, searchQuery, filterFromDate, filterToDate]);

  const fetchCertificateTypes = async () => {
    setIsLoadingFilters(true);
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCertificateTypes(Array.isArray(result.data) ? result.data : [result.data]);
      }
    } catch (err) {
      console.error('Failed to fetch certificate types:', err);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchTransportModes = async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/reference/transport-modes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setTransportModes(Array.isArray(result.data) ? result.data : [result.data]);
      }
    } catch (err) {
      console.error('Failed to fetch transport modes:', err);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      
      if (filterStatus) params.append('status', filterStatus);
      if (filterCertType) params.append('certificateTypeId', filterCertType);
      if (filterCompanyId) params.append('companyId', filterCompanyId);
      if (searchQuery) params.append('search', searchQuery);
      if (filterFromDate) params.append('from', new Date(filterFromDate).toISOString());
      if (filterToDate) params.append('to', new Date(filterToDate).toISOString());

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/applications?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const apps = Array.isArray(result.data.content) ? result.data.content : [result.data.content];
        setApplications(apps);
        setTotalPages(result.data.totalPages || 0);
      } else {
        setError(result.message || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const getStatusBadge = (status: Application['status']) => {
    const badges: Record<Application['status'], string> = {
      DRAFT: 'bg-[#f3f4f6] text-[#6b7280]',
      SUBMITTED: 'bg-[#dbeafe] text-[#1e40af]',
      PENDING_PAYMENT: 'bg-[#dbeafe] text-[#1e40af]',
      UNDER_REVIEW: 'bg-[#fef3c7] text-[#92400e]',
      APPROVED: 'bg-[#d1fae5] text-[#065f46]',
      REJECTED: 'bg-[#fee2e2] text-[#9b1c1c]',
      CERTIFICATE_ISSUED: 'bg-[#e0e7ff] text-[#3730a3]',
      UNAPPROVED: 'bg-[#fdf2f8] text-[#9d174d]',
    };
    const labels: Record<Application['status'], string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PENDING_PAYMENT: 'Pending Payment',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CERTIFICATE_ISSUED: 'Certificate Issued',
      UNAPPROVED: 'Unapproved',
    };
    return (
      <span className={`inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${badges[status] || 'bg-[#f3f4f6] text-[#6b7280]'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStats = () => {
    const pendingReview = applications.filter(app => app.status === 'UNDER_REVIEW').length;
    const approvedThisMonth = applications.filter(app => {
      if (app.status !== 'APPROVED') return false;
      const appDate = new Date(app.submittedAt || '');
      const now = new Date();
      return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
    }).length;
    const rejectedThisMonth = applications.filter(app => {
      if (app.status !== 'REJECTED') return false;
      const appDate = new Date(app.submittedAt || '');
      const now = new Date();
      return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
    }).length;
    return {
      pendingReview,
      reviewedToday: 0,
      approvedThisMonth,
      rejectedThisMonth,
    };
  };

  const stats = getStats();

  const getTransportIcon = (mode: string) => {
    const icons: Record<string, string> = {
      'SEA': '🚢',
      'AIR': '✈️',
      'ROAD': '🚛',
      'RAIL': '🚂',
    };
    return icons[mode] || '📦';
  };

  const getFilteredApplications = () => {
    return applications;
  };

  const filteredApps = getFilteredApplications();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-4">
              <div className="text-[20px] font-medium text-[#1a2236]">Applications Queue</div>
              <div className="text-[12px] text-[#6a7a9a]">All applications awaiting review and approval</div>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#92400e] mb-[2px]">{stats.pendingReview}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Pending Review</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#1a4a8a] mb-[2px]">{stats.reviewedToday}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Reviewed Today</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#065f46] mb-[2px]">{stats.approvedThisMonth}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Approved This Month</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#9b1c1c] mb-[2px]">{stats.rejectedThisMonth}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Rejected This Month</div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Certificate Type Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[180px]"
                  onClick={() => setCertTypeDropdownOpen(!certTypeDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterCertType === '' ? 'All Certificate Types' : filterCertType}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {certTypeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[180px]">
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterCertType(''); setCertTypeDropdownOpen(false); }}
                    >
                      All Certificate Types
                    </div>
                    {certificateTypes.map((cert) => (
                      <div 
                        key={cert.id}
                        className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                        onClick={() => { setFilterCertType(cert.code); setCertTypeDropdownOpen(false); }}
                      >
                        {cert.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[140px]"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterStatus === '' ? 'All Statuses' : filterStatus}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[140px]">
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus(''); setStatusDropdownOpen(false); }}
                    >
                      All Statuses
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('SUBMITTED'); setStatusDropdownOpen(false); }}
                    >
                      Submitted
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('PAID'); setStatusDropdownOpen(false); }}
                    >
                      Paid
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('UNDER_REVIEW'); setStatusDropdownOpen(false); }}
                    >
                      Under Review
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('APPROVED'); setStatusDropdownOpen(false); }}
                    >
                      Approved
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('REJECTED'); setStatusDropdownOpen(false); }}
                    >
                      Rejected
                    </div>
                  </div>
                )}
              </div>

              {/* Date Range Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[140px]"
                  onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterFromDate || filterToDate ? 'Date Range' : 'All Dates'}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {dateDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[200px] p-3">
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-[#374151] mb-1 block">From Date</label>
                        <input 
                          type="datetime-local"
                          className="w-full px-2 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px]"
                          value={tempFromDate}
                          onChange={(e) => setTempFromDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-[#374151] mb-1 block">To Date</label>
                        <input 
                          type="datetime-local"
                          className="w-full px-2 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px]"
                          value={tempToDate}
                          onChange={(e) => setTempToDate(e.target.value)}
                        />
                      </div>
                      <button 
                        className="mt-2 px-3 py-1.5 bg-[#1a4a8a] text-white rounded-[4px] text-[11px] font-medium hover:bg-[#153c70]"
                        onClick={() => {
                          setFilterFromDate(tempFromDate);
                          setFilterToDate(tempToDate);
                          setDateDropdownOpen(false);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Company ID Input */}
              <input 
                type="text" 
                placeholder="Company ID..."
                className="px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] w-[150px]"
                value={filterCompanyId}
                onChange={(e) => setFilterCompanyId(e.target.value)}
              />

              <input 
                type="text" 
                placeholder="Search by company name..."
                className="px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70]">
                Filter
              </button>
            </div>

            <div className="overflow-x-auto pt-4 overflow-y-auto rounded-lg border border-[#dde3ee]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipLoader size={40} color="#1a4a8a" />
                  <div className="text-[#6a7a9a] mt-3">Loading applications...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-8 text-[#6a7a9a]">No applications found</div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-2">
                    <tr className="bg-[#f1f4f9] text-[12px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Approval #</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Company</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">TIN</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Cert Type</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Submitted</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">FOB</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Assigned To</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] font-mono text-[#1a4a8a] whitespace-nowrap">{app.applicationId}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.companyName || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono">{app.tin || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.certificateType || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(app.submittedAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.totalValueFob ? `${app.valueCurrency || 'USD'} ${app.totalValueFob.toLocaleString()}` : '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.assignedTo || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/admin/my-applications/${app.applicationId}`)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {filteredApps.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-[11px] text-[#6a7a9a]">
                  Page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Prev
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
