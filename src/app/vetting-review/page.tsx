'use client';

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle,
  Clock,
  Truck,
  Plane,
  Ship,
  ArrowRight,
  AlertCircle,
  Search,
  Filter,
  ChevronsUpDown,
  X,
} from 'lucide-react';
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

type DropdownKey = 'certType' | 'status' | 'transport';

type DropdownOption = {
  value: string;
  label: string;
};

const certTypeOptions: DropdownOption[] = [
  { value: 'all', label: 'All Certificate Types' },
  { value: 'origin', label: 'Certificate of Origin' },
  { value: 'gsp', label: 'GSP' },
  { value: 'ecowas', label: 'ECOWAS' },
  { value: 'naccima', label: 'NACCIMA' },
];

const statusOptions: DropdownOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'PAID', label: 'Paid / Unassigned' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'INFO_REQUESTED', label: 'Info Requested' },
  { value: 'UNAPPROVED', label: 'Unapproved / Resubmitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const transportOptions: DropdownOption[] = [
  { value: 'all', label: 'All Transport' },
  { value: 'sea', label: 'Sea' },
  { value: 'air', label: 'Air' },
  { value: 'land', label: 'Land' },
];

const getSelectedLabel = (
  options: DropdownOption[],
  value: string
): string => {
  return (
    options.find((option) => option.value === value)?.label ||
    options[0]?.label ||
    'Select'
  );
};

function CustomDropdown({
  options,
  value,
  onChange,
  width,
  isOpen,
  onToggle,
  onClose,
}: {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  width: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative" style={{ width }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded text-xs bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span className="truncate">
          {getSelectedLabel(options, value)}
        </span>

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
            onClick={onClose}
          />

          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-100 transition-colors ${
                  value === option.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
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
}

function VettingReviewContent() {
  const router = useRouter();

  /*
   * ---------------------------------------------------------
   * State
   * ---------------------------------------------------------
   */

  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [filterCertType, setFilterCertType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('PAID');
  const [filterTransport, setFilterTransport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /*
   * Pagination
   *
   * currentPage is zero-based because this is what the backend
   * expects.
   */
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [openDropdown, setOpenDropdown] =
    useState<DropdownKey | null>(null);

  /*
   * Prevent stale API responses from overwriting newer requests.
   */
  const requestIdRef = useRef(0);

  /*
   * ---------------------------------------------------------
   * Logout modal
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleOpenLogoutModal = () => {
      setShowLogoutModal(true);
    };

    window.addEventListener(
      'open-logout-modal',
      handleOpenLogoutModal
    );

    return () => {
      window.removeEventListener(
        'open-logout-modal',
        handleOpenLogoutModal
      );
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * Fetch reviews
   * ---------------------------------------------------------
   */

  const fetchReviews = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError('');

      const baseUrl = getBaseUrl();

      if (!baseUrl) {
        throw new Error('API base URL is not configured');
      }

      const params = new URLSearchParams();

      /*
       * Server-side status filtering.
       */
      if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      /*
       * Server-side pagination.
       */
      params.set('page', currentPage.toString());
      params.set('size', pageSize.toString());

      const query = params.toString();

      const response = await apiFetch(
        `${baseUrl}/api/v1/admin/certificates/vetting/applications${
          query ? `?${query}` : ''
        }`
      );

      const payload = await response.json();

      /*
       * Ignore old requests.
       */
      if (requestId !== requestIdRef.current) {
        return;
      }

      if (
        response.ok &&
        payload?.success &&
        payload?.data
      ) {
        const data = payload.data;

        setApplications(data.content || []);

        setTotalElements(
          Number(data.totalElements || 0)
        );

        setTotalPages(
          Number(data.totalPages || 0)
        );
      } else {
        setApplications([]);
        setTotalElements(0);
        setTotalPages(0);

        setError(
          payload?.message ||
            'Unable to load review list.'
        );
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error(
        'Failed to fetch vetting reviews:',
        err
      );

      setApplications([]);
      setTotalElements(0);
      setTotalPages(0);

      setError(
        'Unable to load review list right now.'
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    filterStatus,
    currentPage,
    pageSize,
  ]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /*
   * ---------------------------------------------------------
   * Filters
   * ---------------------------------------------------------
   */

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);

    /*
     * Whenever a filter changes, go back to page 1.
     */
    setCurrentPage(0);
  };

  const handleCertificateTypeChange = (
    value: string
  ) => {
    setFilterCertType(value);

    /*
     * Reset pagination.
     */
    setCurrentPage(0);
  };

  const handleTransportChange = (
    value: string
  ) => {
    setFilterTransport(value);

    /*
     * Reset pagination.
     */
    setCurrentPage(0);
  };

  const handleSearchChange = (
    value: string
  ) => {
    setSearchQuery(value);

    /*
     * Reset pagination whenever search changes.
     */
    setCurrentPage(0);
  };

  /*
   * ---------------------------------------------------------
   * Client-side filters
   *
   * These operate on the current API page.
   *
   * Status is already handled by the backend.
   * ---------------------------------------------------------
   */

  const filteredApplications =
    applications.filter((app) => {
      if (
        filterCertType !== 'all' &&
        !app.certificateType
          ?.toLowerCase()
          .includes(
            filterCertType.toLowerCase()
          )
      ) {
        return false;
      }

      if (
        filterTransport !== 'all' &&
        app.modeOfTransport
          ?.toLowerCase() !==
          filterTransport.toLowerCase()
      ) {
        return false;
      }

      // if (
      //   searchQuery.trim() &&
      //   !app.tin
      //     ?.toLowerCase()
      //     .includes(
      //       searchQuery.trim().toLowerCase()
      //     )
      // ) {
      //   return false;
      // }

         if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.applicationId.toLowerCase().includes(query) ||
        app.certificateType.toLowerCase().includes(query) ||
        app.modeOfTransport.toLowerCase().includes(query) ||
        app.status.toLowerCase().includes(query) ||
        app.applicationId.toLowerCase().includes(query) ||
        app.companyId.toLowerCase().includes(query)
      );
    }

      return true;
    });

  /*
   * ---------------------------------------------------------
   * Pagination helpers
   * ---------------------------------------------------------
   */

  const handlePageChange = (page: number) => {
    if (loading) return;

    const maxPage = Math.max(
      totalPages - 1,
      0
    );

    const nextPage = Math.max(
      0,
      Math.min(page, maxPage)
    );

    if (nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  /*
   * ---------------------------------------------------------
   * Pagination display numbers
   * ---------------------------------------------------------
   */

  const firstRecord =
    totalElements === 0
      ? 0
      : currentPage * pageSize + 1;

  const lastRecord =
    totalElements === 0
      ? 0
      : Math.min(
          (currentPage + 1) * pageSize,
          totalElements
        );

  /*
   * ---------------------------------------------------------
   * Logout
   * ---------------------------------------------------------
   */

  const handleLogout = () => {
    setShowLogoutModal(false);

    localStorage.clear();

    router.push('/login');
  };

  /*
   * ---------------------------------------------------------
   * Dropdown
   * ---------------------------------------------------------
   */

  const toggleDropdown = (
    key: DropdownKey
  ) => {
    setOpenDropdown((previous) =>
      previous === key ? null : key
    );
  };

  const closeDropdown = () => {
    setOpenDropdown(null);
  };

  /*
   * ---------------------------------------------------------
   * Counts
   * ---------------------------------------------------------
   *
   * Since the API returns paginated data, applications.length
   * is NOT the total number of applications.
   *
   * totalElements is the actual total for the current
   * server-side status filter.
   */

  const pendingCount =
    applications.filter(
      (app) => app.status === 'PAID'
    ).length;

  const completedCount =
    applications.filter((app) =>
      ['APPROVED', 'REJECTED'].includes(
        app.status
      )
    ).length;

  /*
   * ---------------------------------------------------------
   * Status badge
   * ---------------------------------------------------------
   */

  const getStatusBadge = (
    status: string
  ) => {
    const statusMap: Record<
      string,
      {
        styles: string;
        label: string;
      }
    > = {
      SUBMITTED: {
        styles:
          'bg-[#dbeafe] text-[#1e40af]',
        label: 'Submitted',
      },

      PAID: {
        styles:
          'bg-[#e0e7ff] text-[#3730a3]',
        label: 'Paid',
      },

      UNDER_REVIEW: {
        styles:
          'bg-[#fef3c7] text-[#92400e]',
        label: 'Under Review',
      },

      INFO_REQUESTED: {
        styles:
          'bg-[#dbeafe] text-[#1e40af]',
        label: 'Info Requested',
      },

      RESUBMITTED: {
        styles:
          'bg-[#e0e7ff] text-[#3730a3]',
        label: 'Resubmitted',
      },

      UNAPPROVED: {
        styles:
          'bg-[#fdf2f8] text-[#9d174d]',
        label: 'Unapproved / Resubmitted',
      },

      APPROVED: {
        styles:
          'bg-[#d1fae5] text-[#065f46]',
        label: 'Approved',
      },

      REJECTED: {
        styles:
          'bg-[#fee2e2] text-[#9b1c1c]',
        label: 'Rejected',
      },
    };

    const safe =
      statusMap[status] || {
        styles:
          'bg-[#f3f4f6] text-[#6b7280]',
        label: status || 'Unknown',
      };

    return (
      <span
        className={`inline-block whitespace-nowrap rounded px-2 py-[4px] text-[14px] font-medium ${safe.styles}`}
      >
        {safe.label}
      </span>
    );
  };

  /*
   * ---------------------------------------------------------
   * Transport icon
   * ---------------------------------------------------------
   */

  const getTransportIcon = (
    transport: string
  ) => {
    const icons: Record<
      string,
      React.ReactNode
    > = {
      SEA: (
        <Ship className="w-4 h-4" />
      ),

      AIR: (
        <Plane className="w-4 h-4" />
      ),

      LAND: (
        <Truck className="w-4 h-4" />
      ),
    };

    return (
      icons[
        transport?.toUpperCase()
      ] || (
        <FileText className="w-4 h-4" />
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * Review action
   * ---------------------------------------------------------
   */

  const handleReviewAction = async (
    app: ReviewApplication
  ) => {
    /*
     * Approved applications can simply be viewed.
     */
    if (app.status === 'APPROVED') {
      router.push(
        `/vetting-review/${app.applicationId}`
      );

      return;
    }

    /*
     * Paid applications need to be self-assigned.
     */
    const requiresSelfAssign =
      app.status === 'PAID';

    if (requiresSelfAssign) {
      try {
        const baseUrl = getBaseUrl();

        if (!baseUrl) {
          throw new Error(
            'API base URL is not configured'
          );
        }

        const response = await apiFetch(
          `${baseUrl}/api/v1/admin/certificates/vetting/applications/${app.applicationId}/self-assign`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              comment:
                'Taking this application for review.',
            }),
          }
        );

        const payload =
          await response.json();

        if (
          !response.ok ||
          payload?.success === false
        ) {
          console.error(
            'Failed to self-assign application:',
            payload?.message ||
              'Unknown error'
          );

          setError(
            payload?.message ||
              'Failed to assign application. Please try again.'
          );

          return;
        }
      } catch (err) {
        console.error(
          'Self-assign failed:',
          err
        );

        setError(
          'Failed to assign application. Please try again.'
        );

        return;
      }
    }

    router.push(
      `/vetting-review/${app.applicationId}`
    );
  };

  /*
   * ---------------------------------------------------------
   * Render
   * ---------------------------------------------------------
   */

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="vetting" />

        <div className="flex-1 flex overflow-hidden min-h-140">
          <Sidebar role="vetting" />

          <div className="flex-1 px-5.5 py-5 overflow-x-hidden overflow-auto bg-[#fbfbfe]">
            {/* ------------------------------------------------ */}
            {/* Header */}
            {/* ------------------------------------------------ */}

            <div className="mb-4.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[16px] font-bold text-[#1a2236]">
                    My Reviews
                  </div>

                  <div className="text-[11.5px] text-[#6a7a9a] mt-1">
                    {filterStatus ===
                    'all'
                      ? 'Showing applications across all statuses'
                      : `Showing ${filterStatus
                          .toLowerCase()
                          .replace(
                            /\_/g,
                            ' '
                          )} applications requiring review`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded border border-[#dbe2ee] bg-white px-3 py-2 text-[12px] font-semibold text-[#1a2236] hover:bg-[#f4f7fb]"
                    onClick={() => {
                      fetchReviews();
                    }}
                    disabled={loading}
                  >
                    <FileText className="w-3.5 h-3.5" />

                    {loading
                      ? 'Refreshing...'
                      : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>

     
            {/* ------------------------------------------------ */}
            {/* Summary cards */}
            {/* ------------------------------------------------ */}

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              {/* All reviews */}
              <div className="rounded border border-[#dbeafe] bg-[#f8fbff] p-4 shadow-[0_2px_10px_rgba(37,99,235,0.06)] transition-shadow hover:shadow-[0_6px_18px_rgba(37,99,235,0.10)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3b6298]">
                    All reviews
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f1ff] text-[#2563eb]">
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                </div>

                <div className="text-[28px] font-semibold text-[#1a2236]">
                  {totalElements.toLocaleString()}
                </div>

                <div className="text-[13px] font-medium text-[#59708f]">
                  Applications in review
                </div>
              </div>

              {/* Pending */}
              <div className="rounded border border-[#fde7b0] bg-[#fffcf5] p-4 shadow-[0_2px_10px_rgba(180,83,9,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(180,83,9,0.09)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#976527]">
                    Pending
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1d6] text-[#b45309]">
                    <Clock className="h-[18px] w-[18px]" />
                  </span>
                </div>

                <div className="text-[28px] font-semibold text-[#1a2236]">
                  {pendingCount}
                </div>

                <div className="text-[13px] font-medium text-[#7d6747]">
                  Paid & awaiting review
                </div>
              </div>

              {/* Completed */}
              <div className="rounded border border-[#cdebdc] bg-[#f6fdf9] p-4 shadow-[0_2px_10px_rgba(4,120,87,0.05)] transition-shadow hover:shadow-[0_6px_18px_rgba(4,120,87,0.09)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#327260]">
                    Completed
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#dff7eb] text-[#047857]">
                    <CheckCircle className="h-[18px] w-[18px]" />
                  </span>
                </div>

                <div className="text-[28px] font-semibold text-[#1a2236]">
                  {completedCount}
                </div>

                <div className="text-[13px] font-medium text-[#537568]">
                  Approved or rejected
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ */}
            {/* Error */}
            {/* ------------------------------------------------ */}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#991b1b]">
                <AlertCircle className="w-4 h-4" />

                <span>{error}</span>
              </div>
            )}


                   {/* ------------------------------------------------ */}
            {/* Filters */}
            {/* ------------------------------------------------ */}

            <div className="flex items-center gap-3 mb-6 flex-wrap bg-gray-50 border border-gray-200 rounded-xl p-4">
              <CustomDropdown
                options={certTypeOptions}
                value={filterCertType}
                onChange={
                  handleCertificateTypeChange
                }
                width="160px"
                isOpen={
                  openDropdown ===
                  'certType'
                }
                onToggle={() =>
                  toggleDropdown(
                    'certType'
                  )
                }
                onClose={closeDropdown}
              />

              <CustomDropdown
                options={statusOptions}
                value={filterStatus}
                onChange={
                  handleStatusChange
                }
                width="140px"
                isOpen={
                  openDropdown ===
                  'status'
                }
                onToggle={() =>
                  toggleDropdown(
                    'status'
                  )
                }
                onClose={closeDropdown}
              />

              <CustomDropdown
                options={transportOptions}
                value={filterTransport}
                onChange={
                  handleTransportChange
                }
                width="130px"
                isOpen={
                  openDropdown ===
                  'transport'
                }
                onToggle={() =>
                  toggleDropdown(
                    'transport'
                  )
                }
                onClose={closeDropdown}
              />

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search Fields..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold border border-gray-300 rounded bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>


            {/* ------------------------------------------------ */}
            {/* Table */}
            {/* ------------------------------------------------ */}

            <div className="overflow-x-auto overflow-y-auto rounded-lg border border-[#dde3ee] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <table className="w-full min-w-[1040px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f1f4f9] text-[#4a5a7a]">
                    {[
                      'applicationId',
                      'Approval',
                      'Certificate',
                      'Transport',
                      'Submitted',
                      'FOB Value',
                      'Status',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[10px] font-semibold uppercase tracking-[0.06em]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Loading */}
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center"
                      >
                        <div className="flex items-center justify-center gap-3 text-[#6a7a9a]">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3a7bd5] border-t-transparent" />

                          Loading your review
                          list...
                        </div>
                      </td>
                    </tr>
                  ) : filteredApplications.length ===
                    0 ? (
                    /* Empty */
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-[#f1f4f9] flex items-center justify-center">
                            <FileText className="w-8 h-8 text-[#9ca3af]" />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-[#374151]">
                              No applications
                              found
                            </p>

                            <p className="text-xs text-[#6b7280] mt-1">
                              Try adjusting
                              your filters or
                              search criteria
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    /* Applications */
                    filteredApplications.map(
                      (app) => (
                        <tr
                          key={
                            app.applicationId
                          }
                          className="text-[12px] transition-colors hover:bg-[#f8faff]"
                        >
                          {/* TIN */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px] font-mono text-[#1a4a8a]">
                            {app.applicationId}
                          </td>

                          {/* Approval */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            {app.approvalNumber}
                          </td>

                          {/* Certificate */}
                          <td className="max-w-55 whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <div className="truncate">
                              {
                                app.certificateType
                              }
                            </div>
                          </td>

                          {/* Transport */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <div className="flex items-center gap-2">
                              {getTransportIcon(
                                app.modeOfTransport
                              )}

                              <span>
                                {
                                  app.modeOfTransport
                                }
                              </span>
                            </div>
                          </td>

                          {/* Submitted */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            {format(
                              new Date(
                                app.submittedAt
                              ),
                              'MMM dd, yyyy'
                            )}
                          </td>

                          {/* FOB */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            {app.fobCurrency ===
                            'USD'
                              ? '$'
                              : '₦'}

                            {Number(
                              app.fobValue || 0
                            ).toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            {getStatusBadge(
                              app.status
                            )}
                          </td>

                          {/* Action */}
                          <td className="whitespace-nowrap border-b border-[#edf0f5] px-[11px] py-[10px]">
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded px-[9px] py-[5px] text-[13px] font-medium transition-all ${
                                app.status ===
                                'APPROVED'
                                  ? 'border border-gray-300 bg-white text-[#2a3a56] hover:bg-[#f1f4f9]'
                                  : 'bg-[#1a4a8a] text-white hover:bg-[#153c70]'
                              }`}
                              onClick={() =>
                                handleReviewAction(
                                  app
                                )
                              }
                            >
                              {app.status ===
                              'APPROVED'
                                ? 'View'
                                : app.status ===
                                  'PAID'
                                ? 'Assign & Review'
                                : 'Review'}

                              {app.status !==
                                'APPROVED' && (
                                <ArrowRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ------------------------------------------------ */}
            {/* Pagination */}
            {/* ------------------------------------------------ */}

            {totalElements > 0 && (
              <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Result range */}
                <div className="text-xs text-gray-500">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">
                    {firstRecord}
                    {firstRecord !==
                    lastRecord
                      ? `-${lastRecord}`
                      : ''}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-700">
                    {totalElements.toLocaleString()}
                  </span>{' '}
                  applications
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <button
                    type="button"
                    onClick={
                      handlePreviousPage
                    }
                    disabled={
                      currentPage === 0 ||
                      loading
                    }
                    className="px-3 py-1.5 text-xs cursor-pointer font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>

                  {/* Current page */}
                  <div className="min-w-[110px] text-center text-xs font-medium text-gray-600">
                    Page{' '}
                    <span className="font-semibold text-gray-900">
                      {currentPage + 1}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-gray-900">
                      {Math.max(
                        totalPages,
                        1
                      )}
                    </span>
                  </div>

                  {/* Next */}
                  <button
                    type="button"
                    onClick={
                      handleNextPage
                    }
                    disabled={
                      loading ||
                      totalPages ===
                        0 ||
                      currentPage >=
                        totalPages - 1
                    }
                    className="px-3 py-1.5 cursor-pointer text-xs font-semibold border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* Logout */}
            {/* ------------------------------------------------ */}

            <LogoutModal
              isOpen={showLogoutModal}
              onClose={() =>
                setShowLogoutModal(false)
              }
              onConfirm={handleLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VettingReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fb]" />
      }
    >
      <VettingReviewContent />
    </Suspense>
  );
}