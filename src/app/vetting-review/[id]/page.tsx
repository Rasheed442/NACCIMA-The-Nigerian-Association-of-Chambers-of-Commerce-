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

export default function VettingReviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'documents'>('details');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${applicationId}`);
      const data = await response.json();
      if (data.success) {
        setApplicationData(data.data);
      } else {
        setError('Failed to load application details');
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.clear();
    router.push('/login');
  };

  const handleDecision = async (decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    if (!comment.trim()) {
      setError('Comment is required for all actions');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/vetting/applications/${applicationId}/decision`, {
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
      if (data.success) {
        router.push('/vetting-queue');
      } else {
        setError(data.message || 'Failed to submit decision');
      }
    } catch (err) {
      console.error('Failed to submit decision:', err);
      setError('Failed to submit decision');
    } finally {
      setSubmitting(false);
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
    const statusMap: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted', icon: <FileText className="w-3 h-3" /> },
      PAID: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Paid', icon: <CheckCircle className="w-3 h-3" /> },
      UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review', icon: <Clock className="w-3 h-3" /> },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: <CheckCircle className="w-3 h-3" /> },
      REJECTED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rejected', icon: <XCircle className="w-3 h-3" /> },
    };

    const s = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: <FileText className="w-3 h-3" /> };
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
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
        <AppHeader role="vetting" />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar role="vetting" />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-500">Loading application details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div className="h-screen flex flex-col">
        <AppHeader role="vetting" />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar role="vetting" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">{error || 'Application not found'}</p>
              <button
                onClick={() => router.push('/vetting-queue')}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Queue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { application, exchangeRate, feePaid, documents, history } = applicationData;

  return (
    <div className="h-screen flex flex-col">
      <AppHeader role="vetting" />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="vetting" />
        <div className="flex-1 px-6 py-5 overflow-auto bg-gray-50">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/vetting-queue')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-lg font-bold text-gray-900">Application Review</h1>
                  {getStatusBadge(application.status)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">{application.tin}</span>
                  <span>•</span>
                  <span>{application.certificateType}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {getTransportIcon(application.modeOfTransport)}
                    <span>{application.modeOfTransport}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Application Details
                </button>
                <button
                  onClick={() => setActiveTab('items')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'items'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Line Items ({application.goods.length})
                </button>
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Documents ({documents.filter(d => d.uploaded).length}/{documents.length})
                </button>
              </div>

              {/* Application Details Tab */}
              {activeTab === 'details' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipment Information</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Shipper</span>
                      <p className="text-gray-900 font-medium">{application.shipperName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">TIN</span>
                      <p className="text-gray-900 font-mono">{application.tin}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Consignee</span>
                      <p className="text-gray-900 font-medium">{application.consignee}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Destination</span>
                      <p className="text-gray-900 font-medium">{application.destinationCountry}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Mode of Transport</span>
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        {getTransportIcon(application.modeOfTransport)}
                        <span>{application.modeOfTransport}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Carrier</span>
                      <p className="text-gray-900 font-medium">{application.carrier}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">FOB ({application.valueCurrency})</span>
                      <p className="text-gray-900 font-medium">
                        {application.valueCurrency === 'USD' ? '$' : '₦'}{application.totalValueFob.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">FOB (NGN)</span>
                      <p className="text-gray-900 font-medium">
                        ₦{(application.totalValueFob * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} @ ₦{exchangeRate.toLocaleString()}/$
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Fee Paid</span>
                      <p className="text-gray-900 font-medium">₦{feePaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Country of Manufacture</span>
                      <p className="text-gray-900 font-medium">{application.countryOfMfg}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Tab */}
              {activeTab === 'items' && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">HS Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Weight</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {application.goods.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">{item.hsCode}</td>
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{item.description}</div>
                            <div className="text-xs text-gray-500">{item.hsDescription}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-700">{item.grossWeight} kg</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {item.valueCurrency === 'USD' ? '$' : '₦'}{item.value.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Documents</h2>
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          doc.uploaded
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {doc.uploaded ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getDocumentTypeLabel(doc.documentType)}
                            </p>
                            <p className="text-xs text-gray-500">{doc.fileName}</p>
                          </div>
                        </div>
                        {doc.uploaded ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-700 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
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
            <div className="space-y-4">
              {/* Review Decision Panel */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Review Decision</h2>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comment required for all actions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                {error && (
                  <p className="text-xs text-red-600 mt-2">{error}</p>
                )}
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => handleDecision('APPROVE')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleDecision('REQUEST_INFO')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Request More Information
                  </button>
                  <button
                    onClick={() => handleDecision('REJECT')}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Application
                  </button>
                </div>
              </div>

              {/* Review History Panel */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Review History</h2>
                </div>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No history available</p>
                  ) : (
                    history.map((item, index) => (
                      <div key={item.id || index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-900">{item.action}</p>
                          {item.comment && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.comment}</p>
                          )}
                          {item.createdAt && (
                            <p className="text-xs text-gray-400 mt-0.5">
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
