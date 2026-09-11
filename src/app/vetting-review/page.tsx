'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, CheckCircle, Clock, Truck, Plane, Ship, ArrowRight, AlertCircle, ChevronDown } from 'lucide-react';
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

export default function VettingReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewStatus = searchParams.get('status') || 'SUBMITTED';
  const reviewEndpoint = reviewStatus === 'ALL'
    ? '/api/v1/admin/certificates/vetting/applications'
    : `/api/v1/admin/certificates/vetting/applications?status=${encodeURIComponent(reviewStatus)}`;
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  const reviewStatusOptions = [
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'ALL', label: 'All' },
  ];
  const reviewStatusLabel = reviewStatusOptions.find((option) => option.value === reviewStatus)?.label || 'Submitted';

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

      const response = await apiFetch(`${baseUrl}${reviewEndpoint}`);
      const payload = await response.json();

      if (response.ok && payload?.success && payload?.data) {
        setApplications(payload.data.content || []);
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

        const response = await apiFetch(`${baseUrl}${reviewEndpoint}`);
        const payload = await response.json();

        if (!isMounted) return;

        if (response.ok && payload?.success && payload?.data) {
          setApplications(payload.data.content || []);
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
  }, [reviewEndpoint]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted', icon: <FileText className="w-3 h-3" /> },
      PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid', icon: <CheckCircle className="w-3 h-3" /> },
      UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review', icon: <Clock className="w-3 h-3" /> },
      INFO_REQUESTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Info Requested', icon: <AlertCircle className="w-3 h-3" /> },
      RESUBMITTED: { bg: 'bg-violet-100', text: 'text-violet-800', label: 'Resubmitted', icon: <Clock className="w-3 h-3" /> },
      UNAPPROVED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Unapproved', icon: <AlertCircle className="w-3 h-3" /> },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: <CheckCircle className="w-3 h-3" /> },
      REJECTED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rejected', icon: <FileText className="w-3 h-3" /> },
    };

    const safe = statusMap[status] || { bg: 'bg-slate-100', text: 'text-slate-700', label: status || 'Unknown', icon: <FileText className="w-3 h-3" /> };

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${safe.bg} ${safe.text}`}>
        {safe.icon}
        {safe.label}
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

  const handleReviewAction = async (app: ReviewApplication) => {
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
                    {reviewStatus === 'SUBMITTED'
                      ? 'Submitted applications awaiting vetting review'
                      : reviewStatus === 'ALL'
                        ? 'Showing applications across all statuses'
                        : `Showing ${reviewStatus.toLowerCase().replace(/_/g, ' ')} applications`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setStatusFilterOpen((isOpen) => !isOpen)}
                      className="inline-flex min-w-[132px] items-center justify-between gap-2 rounded-lg border border-[#dbe2ee] bg-white px-3 py-2 text-[12px] font-semibold text-[#1a2236] transition-colors hover:bg-[#f4f7fb] focus:outline-none focus:ring-2 focus:ring-[#1a4a8a]/20"
                      aria-haspopup="listbox"
                      aria-expanded={statusFilterOpen}
                    >
                      <span>{reviewStatusLabel}</span>
                      <ChevronDown className={`h-4 w-4 text-[#6a7a9a] transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {statusFilterOpen && (
                      <>
                        <button
                          type="button"
                          aria-label="Close status filter"
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setStatusFilterOpen(false)}
                        />
                        <div className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[#dbe2ee] bg-white py-1 shadow-[0_8px_20px_rgba(26,34,54,0.14)]" role="listbox">
                          {reviewStatusOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={reviewStatus === option.value}
                              onClick={() => {
                                setStatusFilterOpen(false);
                                router.push(option.value === 'SUBMITTED' ? '/vetting-review' : `/vetting-review?status=${option.value}`);
                              }}
                              className={`block w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-[#f4f7fb] ${reviewStatus === option.value ? 'bg-[#edf4ff] font-semibold text-[#1a4a8a]' : 'text-[#374151]'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-[#dbe2ee] bg-white px-3 py-2 text-[12px] font-semibold text-[#1a2236] hover:bg-[#f4f7fb]"
                    onClick={fetchReviews}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded border border-[#e6edf9] bg-white p-4 shadow-[0_2px_8px_rgba(26,34,54,0.04)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6381a8]">Total</span>
                  <FileText className="w-4 h-4 text-[#3a7bd5]" />
                </div>
                <div className="text-[28px] font-bold text-[#1a2236]">{applications.length}</div>
                <div className="text-[13px] text-[#6a7a9a]">Applications in review</div>
              </div>

              <div className="rounded border border-[#e6edf9] bg-white p-4 shadow-[0_2px_8px_rgba(26,34,54,0.04)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6381a8]">Ready</span>
                  <Clock className="w-4 h-4 text-[#d97706]" />
                </div>
                <div className="text-[28px] font-bold text-[#1a2236]">{applications.filter((app) => app.status === 'SUBMITTED').length}</div>
                <div className="text-[13px] text-[#6a7a9a]">Awaiting review</div>
              </div>

              <div className="rounded border border-[#e6edf9] bg-white p-4 shadow-[0_2px_8px_rgba(26,34,54,0.04)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6381a8]">Completed</span>
                  <CheckCircle className="w-4 h-4 text-[#059669]" />
                </div>
                <div className="text-[28px] font-bold text-[#1a2236]">{applications.filter((app) => ['APPROVED', 'REJECTED'].includes(app.status)).length}</div>
                <div className="text-[13px] text-[#6a7a9a]">Approved or rejected</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#991b1b]">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-[#e6edf9] bg-white shadow-[0_2px_8px_rgba(26,34,54,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#4a5a7a]">
                      <th className="px-4 py-3 text-left font-semibold">TIN</th>
                      <th className="px-4 py-3 text-left font-semibold">Approval</th>
                      <th className="px-4 py-3 text-left font-semibold">Certificate</th>
                      <th className="px-4 py-3 text-left font-semibold">Transport</th>
                      <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      <th className="px-4 py-3 text-left font-semibold">FOB Value</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
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
                    ) : applications.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-[#6a7a9a]">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-8 w-8 text-[#c5d3e8]" />
                            <span>No review applications found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.applicationId} className="border-t border-[#edf0f5] hover:bg-[#f8fafd] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#1a2236]">{app.tin}</td>
                          <td className="px-4 py-3 text-[#1a2236]">{app.approvalNumber}</td>
                          <td className="px-4 py-3 text-[#1a2236] max-w-55">
                            <div className="truncate">{app.certificateType}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-[#1a2236]">
                              {getTransportIcon(app.modeOfTransport)}
                              <span>{app.modeOfTransport}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#1a2236]">{format(new Date(app.submittedAt), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 font-medium text-[#1a2236]">
                            {app.fobCurrency === 'USD' ? '$' : '₦'}{Number(app.fobValue || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                          <td className="px-4 py-3">
                            <button
                              className="inline-flex items-center gap-1 rounded-md bg-[#1a4a8a] px-2.5 py-1.75 text-[11px] font-semibold text-white transition-colors hover:bg-[#153c70]"
                              onClick={() => handleReviewAction(app)}
                            >
                              {app.status === 'PAID' ? 'Assign & Review' : 'Review'}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
          </div>
        </div>
      </div>
    </div>
  );
}
