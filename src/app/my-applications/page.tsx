'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { FiPlus } from 'react-icons/fi';
import { ChevronDown } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Application {
  id: string;
  certificateType: string;
  tin: string;
  shipperName: string;
  companyName?: string;
  shipperAddress: string;
  consignee: string;
  consigneeAddress: string;
  carrier: string;
  modeOfTransport: string;
  destinationCountry: string;
  destinationPort: string;
  countryOfMfg: string;
  totalItems: number;
  totalValueFob: number;
  valueCurrency: string;
  bulkQtyMt: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_PAYMENT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'UNAPPROVED';
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string;
  assignedTo?: string;
}

export default function MyApplications() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCertType, setFilterCertType] = useState('');
  const [filterTransport, setFilterTransport] = useState('');
  const [certTypeDropdownOpen, setCertTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [transportDropdownOpen, setTransportDropdownOpen] = useState(false);
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
  }, []);

  const getBaseApiUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API;
    if (!rawBaseUrl) {
      return '';
    }
    return rawBaseUrl.replace(/\/+$/, '');
  };

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

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Handle both single object and array response
        const apps = Array.isArray(result.data) ? result.data : [result.data];
        setApplications(apps);
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
      ISSUED: 'bg-[#e0e7ff] text-[#3730a3]',
      UNAPPROVED: 'bg-[#fdf2f8] text-[#9d174d]',
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
    return (
      <span className={`inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${badges[status] || 'bg-[#f3f4f6] text-[#6b7280]'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleResubmit = async (id: string) => {
    setResubmittingId(id);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${id}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/new-application?resubmit=${id}`);
      } else {
        setError(result.message || 'Failed to resubmit application');
      }
    } catch (err) {
      console.error('Failed to resubmit application:', err);
      setError('Failed to resubmit application');
    } finally {
      setResubmittingId(null);
    }
  };

  const getActionButton = (status: Application['status'], id: string) => {
    if (status === 'ISSUED') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]">Download</button>;
    }
    if (status === 'PENDING_PAYMENT') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Pay Now</button>;
    }
    if (status === 'UNAPPROVED') {
      return (
        <button 
          className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleResubmit(id)}
          disabled={resubmittingId === id}
        >
          {resubmittingId === id ? 'Resubmitting...' : 'Edit & Resubmit'}
        </button>
      );
    }
    return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/my-applications/${id}`)}>View</button>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStats = () => {
    const pendingReview = applications.filter(app => app.status === 'UNDER_REVIEW').length;
    const approvedThisMonth = applications.filter(app => {
      if (app.status !== 'APPROVED') return false;
      const appDate = new Date(app.updatedAt || app.createdAt || '');
      const now = new Date();
      return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
    }).length;
    const rejectedThisMonth = applications.filter(app => {
      if (app.status !== 'REJECTED') return false;
      const appDate = new Date(app.updatedAt || app.createdAt || '');
      const now = new Date();
      return appDate.getMonth() === now.getMonth() && appDate.getFullYear() === now.getFullYear();
    }).length;
    return {
      pendingReview,
      reviewedToday: 0, // Would need actual review date tracking
      approvedThisMonth,
      rejectedThisMonth,
    };
  };

  const stats = getStats();

  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = applications.slice(indexOfFirstItem, indexOfLastItem);

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
    return applications.filter(app => {
      const matchesSearch = searchQuery === '' || 
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.shipperName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tin?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === '' || app.status === filterStatus;
      const matchesCertType = filterCertType === '' || app.certificateType === filterCertType;
      const matchesTransport = filterTransport === '' || app.modeOfTransport === filterTransport;
      return matchesSearch && matchesStatus && matchesCertType && matchesTransport;
    });
  };

  const filteredApps = getFilteredApplications();
  const filteredTotalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const filteredIndexOfLastItem = currentPage * itemsPerPage;
  const filteredIndexOfFirstItem = filteredIndexOfLastItem - itemsPerPage;
  const filteredCurrentItems = filteredApps.slice(filteredIndexOfFirstItem, filteredIndexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-4">
              <div className="text-[20px] font-medium text-[#1a2236]">Applications Queue</div>
              <div className="text-[12px] text-[#6a7a9a]">Paid applications awaiting vetting — oldest first (FIFO)</div>
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
            <div className="flex items-center gap-2 mb-4">
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

              {/* Transport Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[120px]"
                  onClick={() => setTransportDropdownOpen(!transportDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterTransport === '' ? 'All Transport' : filterTransport}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {transportDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[120px]">
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterTransport(''); setTransportDropdownOpen(false); }}
                    >
                      All Transport
                    </div>
                    {transportModes.map((mode) => (
                      <div 
                        key={mode.code}
                        className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                        onClick={() => { setFilterTransport(mode.code); setTransportDropdownOpen(false); }}
                      >
                        {mode.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input 
                type="text" 
                placeholder="Search by ID....."
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
                <div className="text-center py-8 text-[#6a7a9a]">Loading applications...</div>
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
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Transport</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Submitted</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">FOB</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Assigned To</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCurrentItems.map((app) => (
                      <tr key={app.id} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] font-mono text-[#1a4a8a] whitespace-nowrap">{app.id}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.companyName || app.shipperName || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono">{app.tin || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.certificateType || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getTransportIcon(app.modeOfTransport)} {app.modeOfTransport || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(app.submittedAt || app.createdAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.totalValueFob ? `${app.valueCurrency || 'USD'} ${app.totalValueFob.toLocaleString()}` : '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{app.assignedTo || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[5px]">
                            {getActionButton(app.status, app.id)}
                          </div>
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
                  Showing {Math.min(filteredIndexOfFirstItem + 1, filteredApps.length)}-{Math.min(filteredIndexOfLastItem, filteredApps.length)} of {filteredApps.length} applications
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === filteredTotalPages}
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
