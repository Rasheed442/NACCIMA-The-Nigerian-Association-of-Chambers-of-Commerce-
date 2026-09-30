'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Ship,
  Plane,
  Truck,
  Scale,
  ClipboardList,
  History
} from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { format } from 'date-fns';

interface Goods {
  id: string;
  hsCode: string;
  hsDescription: string;
  marksNo: string;
  description: string;
  quantity: number;
  grossWeight: number;
  nomenclature: string;
  value: number;
  valueCurrency: string;
  sortOrder: number;
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  required: boolean;
  uploaded: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface HistoryItem {
  id?: string;
  action: string;
  comment?: string;
  newStatus?: string;
  createdAt?: string;
  performedBy?: string;
}

interface ApplicationData {
  application: {
    id: string;
    companyId: string;
    certificateTypeId: string;
    certificateType: string;
    status: string;
    tin: string;
    shipperName: string;
    shipperAddress: string;
    importerEmail: string;
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
    goods: Goods[];
  };
  companyId: string;
  exchangeRate: number;
  feePaid: number;
  goods: Goods[];
  documents: Document[];
  history: HistoryItem[];
}

interface ApplicationReviewPageProps {
  role?: 'admin' | 'vetting';
  backHref?: string;
  backLabel?: string;
  logoutHref?: string;
}

/* ------------------------------------------------------------------ */
/*  Shared style tokens: one place to tune the look of the whole page  */
/* ------------------------------------------------------------------ */
const CARD = 'bg-white rounded-md border border-slate-200 shadow-sm';
const CARD_PADDED = `${CARD} p-6`;
const CARD_HEADING = 'text-sm font-semibold text-slate-900 pb-4 mb-5 border-b border-slate-100';
const CARD_HEADING_ROW = 'flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100';
const CARD_HEADING_TEXT = 'text-sm font-semibold text-slate-900';
const FIELD_LABEL = 'block text-xs font-medium text-slate-500';
const FIELD_VALUE = 'mt-1 text-sm font-medium text-slate-900';
const TAB_BASE =
  'cursor-pointer -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset';
const DOC_ACTION =
  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:border-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
const DECISION_BTN =
  'w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-md shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
const NOTICE_BASE =
  'flex items-start gap-2.5 rounded-md border px-3.5 py-3 text-xs leading-relaxed';

const formatStatus = (value?: string) =>
  (value ?? '').toLowerCase().replace(/_/g, ' ');

export default function VettingReviewPage({
  role = 'vetting',
  backHref = '/vetting-review',
  backLabel = 'Back to Queue',
  logoutHref = '/login',
}: ApplicationReviewPageProps) {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'documents'>('details');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selfAssigning, setSelfAssigning] = useState(false);
  const [isSelfAssigned, setIsSelfAssigned] = useState(false);
  const [error, setError] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const [processingDecision, setProcessingDecision] = useState<'APPROVE' | 'UNAPPROVED' | 'REJECT' | null>(null);

  // The route is opened with the list item's applicationId. Once details are
  // loaded, use the canonical application.id returned by the API for every
  // state-changing request.
  const resolvedApplicationId = applicationData?.application?.id || applicationId;

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  // `silent` refreshes the data in the background (used after a decision) so
  // the whole page doesn't flip back to the full-screen loader.
  const loadApplication = async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${applicationId}`);
      const data = await response.json();

      if (data.success) {
        setApplicationData(data.data);
      } else if (!silent) {
        setError('Failed to load application details');
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      if (!silent) setError('Failed to load application details');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    if (applicationId && isMounted) {
      loadApplication();
    }

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    router.push(logoutHref);
  };

  const handleSelfAssign = async () => {
    if (isSelfAssigned) return true;

    setSelfAssigning(true);
    setDecisionError('');

    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${encodeURIComponent(resolvedApplicationId)}/self-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: 'Taking this application for review.',
        }),
      });

      const data = await response.json();
      if (response.ok && (data.success !== false)) {
        setIsSelfAssigned(true);
        return true;
      }

      setDecisionError(data.message || 'Failed to self-assign this application.');
      return false;
    } catch (err) {
      console.error('Failed to self-assign application:', err);
      setDecisionError('Failed to self-assign this application.');
      return false;
    } finally {
      setSelfAssigning(false);
    }
  };

  const handleDecision = async (decision: 'APPROVE' | 'UNAPPROVED' | 'REJECT') => {
    if (!comment.trim()) {
      setDecisionError('Comment is required for all review decisions.');
      return;
    }

    setProcessingDecision(decision);
    setSubmitting(true);
    setDecisionError('');
    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${encodeURIComponent(resolvedApplicationId)}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success !== false) {
        setSuccessMessage('Application decision submitted successfully.');
        setComment('');
        setDecisionSubmitted(true);
        // Refresh application data in the background to get the updated status
        await loadApplication(true);
      } else {
        setDecisionError(data.message || 'Failed to submit decision');
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
      setDecisionError('Failed to submit decision');
    } finally {
      setSubmitting(false);
      setProcessingDecision(null);
    }
  };

  const getTransportIcon = (transport: string) => {
    const icons: Record<string, React.ReactNode> = {
      SEA: <Ship className="w-4 h-4" />,
      AIR: <Plane className="w-4 h-4" />,
      LAND: <Truck className="w-4 h-4" />,
    };
    return icons[transport] || <FileText className="w-4 h-4" />;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; ring: string; label: string; icon: React.ReactNode }> = {
      SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', label: 'Submitted', icon: <FileText className="w-3 h-3" /> },
      PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Paid', icon: <CheckCircle className="w-3 h-3" /> },
      UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'Under Review', icon: <Clock className="w-3 h-3" /> },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200', label: 'Approved', icon: <CheckCircle className="w-3 h-3" /> },
      CERTIFICATE_ISSUED: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200', label: 'Certificate Issued', icon: <CheckCircle className="w-3 h-3" /> },
      REJECTED: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', label: 'Rejected', icon: <XCircle className="w-3 h-3" /> },
    };

    const s = statusMap[status] || {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      ring: 'ring-slate-200',
      label: formatStatus(status),
      icon: <FileText className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold capitalize px-2.5 py-1 rounded-full ring-1 ring-inset ${s.bg} ${s.text} ${s.ring}`}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      BILL_OF_LADING: 'Bill of Lading',
      COMMERCIAL_INVOICE: 'Commercial Invoice',
      PACKING_LIST: 'Packing List',
      CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
      FORM_M: 'Form M',
      NEPA_CERTIFICATE: 'NEPA Certificate',
      SON_CERTIFICATE: 'SON Certificate',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader role={role} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar role={role} />
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-slate-500">Loading application details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader role={role} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar role={role} />
          <div className="flex-1 flex items-center justify-center bg-slate-50 px-6">
            <div className={`${CARD_PADDED} max-w-sm w-full text-center`}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-50/60">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-slate-600 mb-5">{error || 'Application not found'}</p>
              <button
                onClick={() => router.push(backHref)}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {backLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { application, exchangeRate, feePaid, documents, history } = applicationData;

  const tabs: { id: 'details' | 'items' | 'documents'; label: string; count: string | null }[] = [
    { id: 'details', label: 'Application Details', count: null },
    { id: 'items', label: 'Line Items', count: String(application.goods.length) },
    {
      id: 'documents',
      label: 'Documents',
      count: `${documents.filter((d) => d.uploaded).length}/${documents.length}`,
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      <AppHeader role={role} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={role} />
        <div className="flex-1 px-6 lg:px-8 py-6 overflow-auto bg-slate-50">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push(backHref)}
              className="cursor-pointer -ml-1 mb-4 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">Application Review</h1>
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="font-mono tabular-nums text-slate-600">{application.tin}</span>
                  <span aria-hidden className="h-3 w-px bg-slate-300" />
                  <span>{application.certificateType}</span>
                  <span aria-hidden className="h-3 w-px bg-slate-300" />
                  <div className="flex items-center gap-1.5">
                    {getTransportIcon(application.modeOfTransport)}
                    <span>{application.modeOfTransport}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Main Content */}
            <div className="lg:col-span-2 min-w-0">
              {/* Tabs */}
              <div role="tablist" className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${TAB_BASE} whitespace-nowrap ${isActive
                          ? 'text-blue-700 border-blue-600'
                          : 'text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300'
                        }`}
                    >
                      {tab.label}
                      {tab.count !== null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Application Details Tab */}
              {activeTab === 'details' && (
                <div className={CARD_PADDED}>
                  <h2 className={CARD_HEADING}>Shipment Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                    <div>
                      <span className={FIELD_LABEL}>Shipper</span>
                      <p className={FIELD_VALUE}>{application.shipperName}</p>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>TIN</span>
                      <p className="mt-1 text-sm text-slate-900 font-mono tabular-nums">{application.tin}</p>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>Consignee</span>
                      <p className={FIELD_VALUE}>{application.consignee}</p>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>Destination</span>
                      <p className={FIELD_VALUE}>{application.destinationCountry}</p>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>Mode of Transport</span>
                      <div className={`${FIELD_VALUE} flex items-center gap-2`}>
                        <span className="text-slate-500">{getTransportIcon(application.modeOfTransport)}</span>
                        <span>{application.modeOfTransport}</span>
                      </div>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>Carrier</span>
                      <p className={FIELD_VALUE}>{application.carrier}</p>
                    </div>
                    {exchangeRate === 1 ? (
                      <div>
                        <span className={FIELD_LABEL}>FOB (USD)</span>
                        <p className={`${FIELD_VALUE} tabular-nums`}>
                          {application.valueCurrency === 'USD' ? `$${application?.totalValueFob?.toLocaleString()}` : `$${(application.totalValueFob / exchangeRate)?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className={FIELD_LABEL}>FOB ({application.valueCurrency})</span>
                          <p className={`${FIELD_VALUE} tabular-nums`}>
                            {application.valueCurrency === 'USD' ? '$' : '₦'}{application?.totalValueFob?.toLocaleString()}
                          </p>
                        </div>
                        {application.valueCurrency === 'USD' && (
                          <div>
                            <span className={FIELD_LABEL}>FOB (NGN)</span>
                            <p className={`${FIELD_VALUE} tabular-nums`}>
                              ₦{(application.totalValueFob * exchangeRate)?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              <span className="ml-2 text-xs font-normal text-slate-500">
                                @ ₦{exchangeRate?.toLocaleString()}/$
                              </span>
                            </p>
                          </div>
                        )}
                        {application.valueCurrency === 'NGN' && (
                          <div>
                            <span className={FIELD_LABEL}>FOB (USD)</span>
                            <p className={`${FIELD_VALUE} tabular-nums`}>
                              ${(application.totalValueFob / exchangeRate)?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <span className={FIELD_LABEL}>Fee Paid</span>
                      <p className={`${FIELD_VALUE} tabular-nums`}>₦{feePaid?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className={FIELD_LABEL}>Country of Manufacture</span>
                      <p className={FIELD_VALUE}>{application.countryOfMfg}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Tab */}
              {activeTab === 'items' && (
                <div className={`${CARD} overflow-x-auto`}>
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">HS Code</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Description</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Qty</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Weight</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-slate-500">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {application.goods.map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                          <td className="px-5 py-3.5 align-top whitespace-nowrap">
                            <span className="inline-block rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-medium text-blue-700">
                              {item.hsCode}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-top">
                            <div className="font-medium text-slate-900">{item.description}</div>
                            <div className="mt-0.5 text-xs text-slate-500">{item.hsDescription}</div>
                          </td>
                          <td className="px-5 py-3.5 align-top text-right tabular-nums text-slate-700">{item.quantity}</td>
                          <td className="px-5 py-3.5 align-top text-right tabular-nums whitespace-nowrap text-slate-700">{item.grossWeight} kg</td>
                          <td className="px-5 py-3.5 align-top text-right tabular-nums whitespace-nowrap text-slate-900 font-medium">
                            {item.valueCurrency === 'USD' ? '$' : '₦'}{item?.value?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className={CARD_PADDED}>
                  <h2 className={CARD_HEADING}>Documents</h2>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-md border transition-colors ${doc.uploaded
                            ? 'bg-white border-slate-200 hover:bg-slate-50/70'
                            : 'bg-red-50/60 border-red-200'
                          }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${doc.uploaded ? 'bg-emerald-50' : 'bg-red-100/70'
                              }`}
                          >
                            {doc.uploaded ? (
                              <CheckCircle className="w-[18px] h-[18px] text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-[18px] h-[18px] text-red-600" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {getDocumentTypeLabel(doc.documentType)}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{doc.fileName}</p>
                          </div>
                        </div>
                        {doc.uploaded ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={DOC_ACTION}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download
                              className={DOC_ACTION}
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-red-700 bg-red-100 ring-1 ring-inset ring-red-200 px-2.5 py-1 rounded-full">
                            Required - Missing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Review Decision Panel */}
              {decisionSubmitted ? (
                <div className={CARD_PADDED}>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-emerald-50 ring-4 ring-emerald-50/60">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Application Processed</h2>
                      <p className="mt-0.5 text-sm text-slate-500">Your decision has been recorded successfully.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mt-4">
                    <h3 className="text-xs font-semibold text-slate-700 mb-2">Next Steps</h3>
                    <ul className="text-sm text-slate-600 space-y-2 leading-relaxed">
                      <li className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        The application status will be updated based on your decision
                      </li>
                      <li className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        The exporter will be notified of the outcome
                      </li>
                      <li className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        You can return to the queue to review other applications
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => router.push(backHref)}
                    className="cursor-pointer mt-5 w-full px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Return to Queue
                  </button>
                </div>
              ) : application.status === 'CERTIFICATE_ISSUED' ? (
                <div className={CARD_PADDED}>
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-emerald-50 ring-4 ring-emerald-50/60">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Certificate Issued</h2>
                      <p className="mt-0.5 text-sm text-slate-500">The certificate has been successfully issued for this application.</p>
                    </div>
                  </div>
                  <div className={`${NOTICE_BASE} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">This application has been approved and the certificate has been issued</p>
                      <p className="text-emerald-700 mt-1">No further action is required. You can view the application details and review history.</p>
                    </div>
                  </div>
                </div>
              ) : application.status === 'APPROVED' ? (
                <div className={CARD_PADDED}>
                  <div className={CARD_HEADING_ROW}>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h2 className={CARD_HEADING_TEXT}>Application Status</h2>
                  </div>
                  <div className={`${NOTICE_BASE} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold">This application has been approved</p>
                      <p className="text-emerald-700 mt-1">No further action is required. You can view the application details and review history.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={CARD_PADDED}>
                  <div className={CARD_HEADING_ROW}>
                    <Scale className="w-5 h-5 text-slate-500" />
                    <h2 className={CARD_HEADING_TEXT}>Review Decision</h2>
                  </div>

                  {/* <button
                    type="button"
                    onClick={handleSelfAssign}
                    disabled={selfAssigning || isSelfAssigned}
                    className="mb-4 w-full flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ClipboardList className="w-4 h-4" />
                    {selfAssigning ? 'Assigning...' : isSelfAssigned ? 'Self-assigned for review' : 'Self assign application'}
                  </button> */}

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter a review comment before selecting an action..."
                    className="w-full px-3.5 py-3 border border-slate-300 bg-white rounded-md text-sm text-slate-800 placeholder:text-slate-400 transition-shadow focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none"
                    rows={4}
                  />
                  {successMessage && (
                    <div role="status" className={`mt-3 ${NOTICE_BASE} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                  {decisionError && (
                    <div role="alert" className={`mt-3 ${NOTICE_BASE} border-red-200 bg-red-50 text-red-800`}>
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      <span>{decisionError}</span>
                    </div>
                  )}
                  <div className="space-y-2.5 mt-5">
                    <button
                      onClick={() => handleDecision('APPROVE')}
                      disabled={!comment.trim() || submitting || selfAssigning}
                      className={`${DECISION_BTN} cursor-pointer bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500`}
                    >
                      {processingDecision === 'APPROVE' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve Application
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDecision('UNAPPROVED')}
                      disabled={!comment.trim() || submitting || selfAssigning}
                      className={`${DECISION_BTN} cursor-pointer bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500`}
                    >
                      {processingDecision === 'UNAPPROVED' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Requesting...
                        </>
                      ) : (
                        <>
                          <ClipboardList className="w-4 h-4" />
                          Request More Information
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDecision('REJECT')}
                      disabled={!comment.trim() || submitting || selfAssigning}
                      className={`${DECISION_BTN} cursor-pointer bg-red-600 hover:bg-red-700 focus-visible:ring-red-500`}
                    >
                      {processingDecision === 'REJECT' ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject Application
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Review History Panel */}
              <div className={CARD_PADDED}>
                <div className={CARD_HEADING_ROW}>
                  <History className="w-5 h-5 text-slate-500" />
                  <h2 className={CARD_HEADING_TEXT}>Review History</h2>
                </div>
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">No history available</p>
                  ) : (
                    history.map((item, index) => (
                      <div key={item.id || index} className="relative flex gap-3">
                        {index !== history.length - 1 && (
                          <span
                            aria-hidden
                            className="absolute left-3 top-7 -bottom-4 w-px -translate-x-1/2 bg-slate-200"
                          />
                        )}
                        <div className="shrink-0">
                          <div className="w-6 h-6 rounded-full bg-blue-50 ring-1 ring-inset ring-blue-200 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize text-slate-900">
                            {formatStatus(item?.action === "RESUBMITTED" ? item?.action : item.newStatus)}
                          </p>
                          {item.comment && (
                            <p className="text-xs leading-relaxed text-slate-600 mt-0.5">{item.comment}</p>
                          )}
                          {item.createdAt && (
                            <p className="text-xs tabular-nums text-slate-400 mt-1">
                              {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
        </div>
      </div>
    </div>
  );
}