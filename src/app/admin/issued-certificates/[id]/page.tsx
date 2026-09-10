'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Certificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  verificationCode: string;
  certificateType: string;
  status: 'VALID' | 'VOIDED' | 'EXPIRED';
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

export default function AdminCertificateDetail() {
  const router = useRouter();
  const params = useParams();
  const certificateId = params.id as string;
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidSuccess, setVoidSuccess] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates/${certificateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCertificate(result.data);
      } else {
        setError(result.message || 'Failed to fetch certificate');
      }
    } catch (err) {
      console.error('Failed to fetch certificate:', err);
      setError('Failed to fetch certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleViewApplication = (applicationId: string) => {
    router.push(`/admin/my-applications/${applicationId}`);
  };

  const handleVoidCertificate = async () => {
    if (!certificate) return;

    const trimmedReason = voidReason.trim();
    if (!trimmedReason) {
      setVoidError('Please enter a reason before voiding this certificate.');
      return;
    }

    setVoiding(true);
    setVoidError(null);
    setVoidSuccess(null);

    try {
      const baseUrl = getBaseUrl();
      const response = await apiFetch(`${baseUrl}/api/v1/certificates/${certificate.id}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: trimmedReason,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success !== false) {
        setCertificate((current) =>
          current
            ? {
                ...current,
                voided: true,
                status: 'VOIDED',
              }
            : current
        );
        setVoidSuccess('Certificate voided successfully.');
        setShowVoidModal(false);
      } else {
        setVoidError(result.message || 'Failed to void certificate');
      }
    } catch (err) {
      console.error('Failed to void certificate:', err);
      setVoidError('Failed to void certificate');
    } finally {
      setVoiding(false);
    }
  };

  const getStatusBadge = (status: Certificate['status'], voided: boolean) => {
    if (voided) {
      return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Voided</span>;
    }
    if (status === 'VALID') {
      return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Valid</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-3 py-[6px] rounded whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">{status}</span>;
  };

  const getTransportIcon = (mode: string) => {
    const icons: Record<string, string> = {
      'SEA': '🚢',
      'AIR': '✈️',
      'ROAD': '🚛',
      'RAIL': '🚂',
    };
    return icons[mode] || '📦';
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="flex flex-col items-center justify-center py-12">
                <ClipLoader size={40} color="#1a4a8a" />
                <div className="text-[#6a7a9a] mt-3">Loading certificate...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="text-center py-8 text-[#e53e3e]">{error || 'Certificate not found'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[32px] py-[32px] overflow-x-hidden overflow-auto bg-[#f8fafc]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <button 
                  className="text-[13px] text-[#1e40af] hover:text-[#1e3a8a] mb-2 cursor-pointer flex items-center gap-1 transition-colors"
                  onClick={() => router.push('/admin/issued-certificates')}
                >
                  ← Back to Issued Certificates
                </button>
                <div className="text-[24px] font-semibold text-[#1e293b] tracking-tight">Certificate Details</div>
                <div className="text-[13px] text-[#64748b] mt-1">Certificate #{certificate.certificateNumber}</div>
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-5 py-2.5 bg-[#0f766e] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#0d9488] transition-colors shadow-sm"
                  onClick={() => handleDownload(certificate.pdfUrl)}
                >
                  Download PDF
                </button>
                <button 
                  className="px-5 py-2.5 bg-white text-[#334155] border border-[#cbd5e1] rounded-[6px] text-[13px] font-medium hover:bg-[#f1f5f9] transition-colors shadow-sm"
                  onClick={() => handleViewApplication(certificate.applicationId)}
                >
                  View Application
                </button>
                <button
                  className="px-5 py-2.5 bg-[#dc2626] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#b91c1c] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowVoidModal(true)}
                  disabled={certificate.voided || certificate.status === 'VOIDED'}
                >
                  {certificate.voided || certificate.status === 'VOIDED' ? 'Voided' : 'Void Certificate'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[12px] shadow-sm border border-[#e2e8f0] overflow-hidden">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[15px] font-semibold text-white tracking-wide uppercase">Certificate of Origin</div>
                    <div className="text-[13px] text-white/80 mt-1">{certificate.certificateType}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[32px] font-bold text-white">{certificate.certificateNumber}</div>
                    <div className="text-[12px] text-white/70 mt-1">Certificate Number</div>
                  </div>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="p-8">
                {/* Status Badge */}
                <div className="mb-4">
                  {getStatusBadge(certificate.status, certificate.voided)}
                </div>
                {voidSuccess && (
                  <div className="mb-6 rounded-[8px] border border-[#bbf7d0] bg-[#ecfdf5] px-4 py-3 text-[13px] text-[#166534]">
                    {voidSuccess}
                  </div>
                )}
                {voidError && (
                  <div className="mb-6 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#991b1b]">
                    {voidError}
                  </div>
                )}

                {/* Key Details Grid */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-[#f8fafc] rounded-[8px] p-5 border border-[#e2e8f0] overflow-auto">
                    <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Verification Code</div>
                    <div className="text-[15px] font-mono text-[#0f172a] font-semibold tracking-wider">{certificate.verificationCode}</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[8px] p-5 border border-[#e2e8f0]">
                    <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Issued Date</div>
                    <div className="text-[15px] text-[#0f172a] font-medium">{formatDate(certificate.issuedAt)}</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[8px] p-5 border border-[#e2e8f0]">
                    <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Transport Mode</div>
                    <div className="text-[15px] text-[#0f172a] font-medium flex items-center gap-2">
                      <span className="text-[18px]">{getTransportIcon(certificate.modeOfTransport)}</span>
                      <span>{certificate.modeOfTransport}</span>
                    </div>
                  </div>
                </div>

                {/* Parties Section */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <div className="text-[13px] font-semibold text-[#1e293b] mb-4 pb-2 border-b-2 border-[#0f766e] uppercase tracking-wider">Shipper</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Company Name</div>
                        <div className="text-[15px] text-[#0f172a] font-medium">{certificate.shipperName}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Address</div>
                        <div className="text-[15px] text-[#0f172a]">{certificate.shipperAddress}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-[#1e293b] mb-4 pb-2 border-b-2 border-[#0f766e] uppercase tracking-wider">Consignee</div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Company Name</div>
                        <div className="text-[15px] text-[#0f172a] font-medium">{certificate.consignee}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Address</div>
                        <div className="text-[15px] text-[#0f172a]">{certificate.consigneeAddress}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Destination Section */}
                <div className="bg-[#f8fafc] rounded-[8px] p-6 border border-[#e2e8f0]">
                  <div className="text-[13px] font-semibold text-[#1e293b] mb-4 pb-2 border-b border-[#cbd5e1] uppercase tracking-wider">Destination Information</div>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Country</div>
                      <div className="text-[15px] text-[#0f172a] font-medium">{certificate.destinationCountry}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">Port</div>
                      <div className="text-[15px] text-[#0f172a] font-medium">{certificate.destinationPort}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#64748b] font-medium uppercase tracking-wider mb-1">PDF URL</div>
                    <div className="text-[13px] text-[#0f766e] font-medium break-all">{certificate.pdfUrl}</div>
                  </div>
                </div>
              </div>

              {/* Certificate Footer */}
              <div className="bg-[#f8fafc] px-8 py-4 border-t border-[#e2e8f0]">
                <div className="flex items-center justify-between text-[12px] text-[#64748b]">
                  <div>Certificate ID: {certificate.id}</div>
                  <div>Application ID: {certificate.applicationId}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVoidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-[12px] border border-[#e2e8f0] bg-white p-6 shadow-xl">
            <div className="mb-4">
              <div className="text-[20px] font-semibold text-[#0f172a]">Void Certificate</div>
              <p className="mt-2 text-[13px] leading-6 text-[#64748b]">
                This action cannot be undone. The certificate will be marked as void.
              </p>
            </div>

            <label className="block text-[12px] font-semibold uppercase tracking-wider text-[#475569] mb-2">
              Reason for voiding
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Enter a reason for voiding this certificate..."
              rows={4}
              className="w-full rounded-[8px] border border-[#cbd5e1] bg-white px-3 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#0f766e] focus:outline-none focus:ring-2 focus:ring-[#99f6e4] resize-none"
            />

            {voidError && (
              <div className="mt-4 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-3 text-[13px] text-[#991b1b]">
                {voidError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2.5 bg-white text-[#334155] border border-[#cbd5e1] rounded-[6px] text-[13px] font-medium hover:bg-[#f1f5f9] transition-colors"
                onClick={() => {
                  setShowVoidModal(false);
                  setVoidReason('');
                  setVoidError(null);
                }}
                disabled={voiding}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2.5 bg-[#dc2626] text-white rounded-[6px] text-[13px] font-medium hover:bg-[#b91c1c] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleVoidCertificate}
                disabled={voiding || !voidReason.trim()}
              >
                {voiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
