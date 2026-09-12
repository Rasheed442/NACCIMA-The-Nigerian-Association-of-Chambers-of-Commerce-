'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CheckCircle, Clock, Truck, Plane, Ship, ArrowRight, AlertCircle, ChevronDown, Search, Filter, ChevronsUpDown, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { format } from 'date-fns';

interface ReviewApplication {
  applicationId: string;
  approvalNumber: string;
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

function VettingReviewContent() {
  const router = useRouter();
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [filterCertType, setFilterCertType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('PAID');
  const [filterTransport, setFilterTransport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<'certType' | 'status' | 'transport' | null>(null);



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
    { value: 'UNAPPROVED', label: 'Unapproved / Resubmitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
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
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded text-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');

      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured');
      }

      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }
      const query = params.toString();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications${query ? `?${query}` : ''}`);
      const payload = await response.json();

      if (response.ok && payload?.success && payload?.data) {
        setApplications(payload.data.content || []);
        setTotalElements(payload.data.totalElements || 0);
      } else {
        setError(payload?.message || 'Unable to load review list.');
      }
    } catch (err) {
      console.error('Failed to fetch vetting reviews:', err);
      setError('Unable to load review list right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError('');

        const baseUrl = getBaseUrl();
        if (!baseUrl) {
          throw new Error('API base URL is not configured');
        }

        const params = new URLSearchParams();
        if (filterStatus !== 'all') {
          params.set('status', filterStatus);
        }
        const query = params.toString();
        const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications${query ? `?${query}` : ''}`);
        const payload = await response.json();

        if (!isMounted) return;

        if (response.ok && payload?.success && payload?.data) {
          setApplications(payload.data.content || []);
          setTotalElements(payload.data.totalElements || 0);
        } else {
          setError(payload?.message || 'Unable to load review list.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to fetch vetting reviews:', err);
        setError('Unable to load review list right now.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [filterStatus]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { styles: string; label: string }> = {
      SUBMITTED: { styles: 'bg-[#dbeafe] text-[#1e40af]', label: 'Submitted' },
      PAID: { styles: 'bg-[#e0e7ff] text-[#3730a3]', label: 'Paid' },
      UNDER_REVIEW: { styles: 'bg-[#fef3c7] text-[#92400e]', label: 'Under Review' },
      INFO_REQUESTED: { styles: 'bg-[#dbeafe] text-[#1e40af]', label: 'Info Requested' },
      RESUBMITTED: { styles: 'bg-[#e0e7ff] text-[#3730a3]', label: 'Resubmitted' },
      UNAPPROVED: { styles: 'bg-[#fdf2f8] text-[#9d174d]', label: 'Unapproved / Resubmitted' },
      APPROVED: { styles: 'bg-[#d1fae5] text-[#065f46]', label: 'Approved' },
      REJECTED: { styles: 'bg-[#fee2e2] text-[#9b1c1c]', label: 'Rejected' },
    };

    const safe = statusMap[status] || { styles: 'bg-[#f3f4f6] text-[#6b7280]', label: status || 'Unknown' };

    return (
      <span className={`inline-block whitespace-nowrap rounded px-2 py-[4px] text-[14px] font-medium ${safe.styles}`}>{safe.label}</span>
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

  const handleReviewAction = async (app: ReviewApplication) => {
    // If already approved, just view the application
    if (app.status === 'APPROVED') {
      router.push(`/vetting-review/${app.applicationId}`);
      return;
    }

    const requiresSelfAssign = app.status === 'PAID';

    if (requiresSelfAssign) {
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

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="vetting" />
        <div className="flex-1 flex overflow-hidden min-h-140">
          <Sidebar role="vetting" />
          <div className="flex-1 px-5.5 py-5 overflow-x-hidden overflow-auto bg-[#fbfbfe]">
            <div className="mb-4.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-[#1a2236]">My Reviews</div>
                  <div className="text-[11.5px] text-[#6a7a9a] mt-1">
                    {filterStatus === 'all'
                      ? 'Showing applications across all statuses'
                      : `Showing ${filterStatus.toLowerCase().replace(/_/g, ' ')} applications requiring review`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded border border-[#dbe2ee] bg-white px-3 py-2 text-[12px] font-semibold text-[#1a2236] hover:bg-[#f4f7fb]"
                    onClick={fetchReviews}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <div className="rounded border border-[#dbeafe] bg-[#f8fbff] p-4 shadow-[0_2px_10px_rgba(37,99,235,0.06)] transition-shadow hover:shadow-[0_6px_18px_rgba(37,99,235,0.10)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3b6298]">All reviews</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2563eb]">
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <div className="text-[28px] font-semibold text-[#1a2236]">{filteredApplications.length}</div>
                <div className="text-[13px] font-medium text-[#59708f]">Applications in review</div>
              </div>

              <div className="rounded border border-[#fde7b0] bg-[#fffcf5] p-4 shadow-[0_2px_10px_rgba(180,83,9,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(180,83,9,0.09)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#976527]">Pending</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1d6] text-[#b45309]">
                    <Clock className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <div className="text-[28px] font-semibold text-[#1a2236]">{filteredApplications.filter((app) => app.status === 'PAID').length}</div>
                <div className="text-[13px] font-medium text-[#7d6747]">Paid & awaiting review</div>
              </div>

              <div className="rounded border border-[#cdebdc] bg-[#f6fdf9] p-4 shadow-[0_2px_10px_rgba(4,120,87,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(4,120,87,0.09)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#327260]">Completed</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dff7eb] text-[#047857]">
                    <CheckCircle className="h-[18px] w-[18px]" />
                  </span>
                </div>
                <div className="text-[28px] font-semibold text-[#1a2236]">{filteredApplications.filter((app) => ['APPROVED', 'REJECTED'].includes(app.status)).length}</div>
                <div className="text-[13px] font-medium text-[#537568]">Approved or rejected</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#991b1b]">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="overflow-x-auto overflow-y-auto rounded-lg border border-[#dde3ee] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <table className="w-full min-w-[1040px] border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f1f4f9] text-[#4a5a7a]">
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">TIN</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Approval</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Certificate</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Transport</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Submitted</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">FOB Value</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Status</th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center">
                          <div className="flex items-center justify-center gap-3 text-[#6a7a9a]">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3a7bd5] border-t-transparent" />
                            Loading your review list...
                          </div>
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-[#f1f4f9] flex items-center justify-center">
                              <FileText className="w-8 h-8 text-[#9ca3af]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#374151]">No applications found</p>
                              <p className="text-xs text-[#6b7280] mt-1">Try adjusting your filters or search criteria</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => (
                        <tr key={app.applicationId} className="text-[12px] transition-colors hover:bg-[#f8faff]">
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px] font-mono text-[#1a4a8a]">{app.tin}</td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">{app.approvalNumber}</td>
                          <td className="max-w-55 whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <div className="truncate">{app.certificateType}</div>
                          </td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <div className="flex items-center gap-2">
                              {getTransportIcon(app.modeOfTransport)}
                              <span>{app.modeOfTransport}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">{format(new Date(app.submittedAt), 'MMM dd, yyyy')}</td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            {app.fobCurrency === 'USD' ? '$' : '₦'}{Number(app.fobValue || 0).toLocaleString()}
                          </td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">{getStatusBadge(app.status)}</td>
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <button
                              className={`inline-flex items-center gap-1 rounded px-[9px] py-[5px] text-[13px] font-medium transition-all ${
                                app.status === 'APPROVED' 
                                  ? 'inline-flex items-center gap-1 px-[9px] py-[5px] rounded border border-gray-300 text-[12px] font-medium cursor-pointer transition-all bg-white text-[#2a3a56]  hover:bg-[#f1f4f9]' 
                                  : 'bg-[#1a4a8a] text-white hover:bg-[#153c70]'
                              }`}
                              onClick={() => handleReviewAction(app)}
                            >
                              {app.status === 'APPROVED' ? 'View' : (app.status === 'PAID' ? 'Assign & Review' : 'Review')}
                              {app.status !== 'APPROVED' && <ArrowRight className="w-3.5 h-3.5" />}
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

export default function VettingReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" />}>
      <VettingReviewContent />
    </Suspense>
  );
}
