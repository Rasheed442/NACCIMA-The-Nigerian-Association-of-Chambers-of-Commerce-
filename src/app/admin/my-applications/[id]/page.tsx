'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Goods {
  id: string;
  hsCode: string;
  hsDescription: string;
  marksNo: string;
  description: string;
  unit: string;
  quantity: number;
  grossWeight: number;
  nomenclature: string;
  value: number;
  valueCurrency: string;
  sortOrder: number;
}

interface Documents {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  required: boolean;
  uploaded: boolean;
  uploadedBy?: string;
  uploadedAt?: string;
}

interface History {
  id: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  reviewerId: string;
  comment: string;
  createdAt: string;
}

interface Application {
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
}

interface Certificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  verificationCode: string;
  certificateType: string;
  status: string;
  issuedAt: string;
  issuedBy: string;
  shipperName: string;
  shipperAddress: string;
  consignee: string;
  consigneeAddress: string;
  destinationCountry: string;
  destinationPort: string;
  modeOfTransport: string;
  pdfUrl: string;
  voided: boolean;
}

interface ApplicationDetail {
  application: Application;
  companyId: string;
  exchangeRate: number;
  feePaid: number;
  goods: Goods[];
  documents: Documents[];
  assignedTo: string;
  history: History[];
}

export default function AdminApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applicationDetail, setApplicationDetail] = useState<ApplicationDetail | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchApplicationDetail();
  }, [applicationId]);

  const fetchApplicationDetail = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/applications/${applicationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setApplicationDetail(result.data.application);
        setCertificate(result.data.certificate || null);
      } else {
        setError(result.message || 'Failed to fetch application details');
      }
    } catch (err) {
      console.error('Failed to fetch application details:', err);
      setError('Failed to fetch application details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'DRAFT': 'bg-[#f3f4f6] text-[#6b7280]',
      'SUBMITTED': 'bg-[#dbeafe] text-[#1e40af]',
      'PENDING_PAYMENT': 'bg-[#dbeafe] text-[#1e40af]',
      'UNDER_REVIEW': 'bg-[#fef3c7] text-[#92400e]',
      'APPROVED': 'bg-[#d1fae5] text-[#065f46]',
      'REJECTED': 'bg-[#fee2e2] text-[#9b1c1c]',
      'CERTIFICATE_ISSUED': 'bg-[#e0e7ff] text-[#3730a3]',
      'UNAPPROVED': 'bg-[#fdf2f8] text-[#9d174d]',
      'PAID': 'bg-[#d1fae5] text-[#065f46]',
      'VALID': 'bg-[#d1fae5] text-[#065f46]',
    };
    return (
      <span className={`inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${badges[status] || 'bg-[#f3f4f6] text-[#6b7280]'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex items-center justify-center">
              <ClipLoader size={40} color="#1a4a8a" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !applicationDetail) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto flex items-center justify-center">
              <div className="text-[#e53e3e]">{error || 'Application not found'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const app = applicationDetail.application;

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-4">
              <button 
                className="text-[#1a4a8a] text-[14px] cursor-pointer font-medium hover:underline mb-2"
                onClick={() => router.push('/admin/my-applications')}
              >
                ← Back to Applications
              </button>
              <div className="text-[20px] font-medium text-[#1a2236]">Application Details</div>
              <div className="text-[12px] text-[#6a7a9a]">{app.id}</div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
              {getStatusBadge(app.status)}
            </div>

            {/* Summary Cards */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 bg-white border border-[#dde3ee] rounded px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#1a4a8a] mb-[2px]">${app.totalValueFob.toLocaleString()}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Total Value (FOB)</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#065f46] mb-[2px]">${applicationDetail.feePaid.toLocaleString()}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Fee Paid</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#92400e] mb-[2px]">{applicationDetail.exchangeRate.toFixed(2)}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Exchange Rate</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#1a2236] mb-[2px]">{app.totalItems}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Total Items</div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-3">Company Information</div>
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <div className="text-[#6a7a9a] mb-1">Company Name</div>
                  <div className="text-[#1a2236]">{app.shipperName}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">TIN</div>
                  <div className="text-[#1a2236] font-mono">{app.tin}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Address</div>
                  <div className="text-[#1a2236]">{app.shipperAddress}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Email</div>
                  <div className="text-[#1a2236]">{app.importerEmail}</div>
                </div>
              </div>
            </div>

            {/* Shipment Information */}
            <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-3">Shipment Information</div>
              <div className="grid grid-cols-2 gap-4 text-[12px]">
                <div>
                  <div className="text-[#6a7a9a] mb-1">Consignee</div>
                  <div className="text-[#1a2236]">{app.consignee}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Consignee Address</div>
                  <div className="text-[#1a2236]">{app.consigneeAddress}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Carrier</div>
                  <div className="text-[#1a2236]">{app.carrier}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Mode of Transport</div>
                  <div className="text-[#1a2236]">{app.modeOfTransport}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Destination Country</div>
                  <div className="text-[#1a2236]">{app.destinationCountry}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Destination Port</div>
                  <div className="text-[#1a2236]">{app.destinationPort}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Country of Manufacture</div>
                  <div className="text-[#1a2236]">{app.countryOfMfg}</div>
                </div>
                <div>
                  <div className="text-[#6a7a9a] mb-1">Bulk Quantity (MT)</div>
                  <div className="text-[#1a2236]">{app.bulkQtyMt || '—'}</div>
                </div>
              </div>
            </div>

            {/* Goods Table */}
            <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-3">Goods</div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-[#f1f4f9]">
                    <tr>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">HS Code</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Description</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Marks & No.</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Unit</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Quantity</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Gross Weight</th>
                      <th className="px-3 py-2 text-left border-b border-[#dde3ee]">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.goods.map((good, index) => (
                      <tr key={good.id || index} className="hover:bg-[#f8faff]">
                        <td className="px-3 py-2 border-b border-[#edf0f5] font-mono">{good.hsCode}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">{good.description}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">{good.marksNo}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">{good.unit}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">{good.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">{good.grossWeight.toLocaleString()}</td>
                        <td className="px-3 py-2 border-b border-[#edf0f5]">${good.value.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-3">Documents</div>
              <div className="space-y-2">
                {applicationDetail.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-[#f8fafd] rounded-[6px]">
                    <div className="flex items-center gap-3">
                      <span className="text-[16px]">📄</span>
                      <div>
                        <div className="text-[12px] font-medium text-[#1a2236]">{doc.fileName}</div>
                        <div className="text-[10px] text-[#6a7a9a]">{doc.documentType.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] px-2 py-1 rounded ${doc.uploaded ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#9b1c1c]'}`}>
                        {doc.uploaded ? 'Uploaded' : 'Pending'}
                      </span>
                      {doc.fileUrl && (
                        <a 
                          href={doc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#1a4a8a] text-[13px] font-medium hover:underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              <div className="text-[14px] font-semibold text-[#1a2236] mb-3">History</div>
              <div className="space-y-3">
                {applicationDetail.history.map((history) => (
                  <div key={history.id} className="flex gap-3 p-3 bg-[#f8fafd] rounded-[6px]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#1a4a8a] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {history.action.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[12px] font-medium text-[#1a2236]">{history.action.replace(/_/g, ' ')}</div>
                      <div className="text-[11px] text-[#6a7a9a]">{history.comment}</div>
                      <div className="text-[10px] text-[#9ca3af] mt-1">
                        {formatDate(history.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificate Information (if issued) */}
            {certificate && (
              <div className="bg-white border border-[#dde3ee] rounded p-[16px] mb-4 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[14px] font-semibold text-[#1a2236] mb-3">Certificate</div>
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <div className="text-[#6a7a9a] mb-1">Certificate Number</div>
                    <div className="text-[#1a2236] font-mono">{certificate.certificateNumber}</div>
                  </div>
                  <div>
                    <div className="text-[#6a7a9a] mb-1">Verification Code</div>
                    <div className="text-[#1a2236] font-mono">{certificate.verificationCode}</div>
                  </div>
                  <div>
                    <div className="text-[#6a7a9a] mb-1">Status</div>
                    <div>{getStatusBadge(certificate.status)}</div>
                  </div>
                  <div>
                    <div className="text-[#6a7a9a] mb-1">Issued At</div>
                    <div className="text-[#1a2236]">{formatDate(certificate.issuedAt)}</div>
                  </div>
                </div>
                {certificate.pdfUrl && (
                  <div className="mt-4">
                    <a 
                      href={certificate.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a4a8a] text-white rounded-[6px] text-[12px] font-medium hover:bg-[#153c70]"
                    >
                      📄 Download Certificate PDF
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
