'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { ClipLoader } from 'react-spinners';
import { BadgeCheck, Building2, CalendarDays, Eye, FileText, MapPin, ShieldCheck, Tag } from 'lucide-react';

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

export default function IssuedCerts() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    setCertificates([]);
    setIsFetchingMore(false);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/my`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : result?.data ? [result.data] : [];
        setCertificates(list);
      } else {
        setError(result?.message || 'Failed to fetch certificates');
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to fetch certificates');
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDownload = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleView = (applicationId: string) => {
    router.push(`/my-applications/${applicationId}`);
  };

  const totalPages = Math.ceil(certificates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = certificates.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string, voided: boolean) => {
    if (voided) {
      return <span className="inline-block text-[13px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Voided</span>;
    }
    if (status === 'VALID') {
      return <span className="inline-block text-[13px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Valid</span>;
    }
    return <span className="inline-block text-[13px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">{status}</span>;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-[18px]">
              <div className="text-[24px] font-medium text-[#1a2236]">Issued Certificates</div>
            </div>

            <div className="overflow-x-auto overflow-y-auto rounded border border-[#dde3ee] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipLoader color="#1a4a8a" size={40} />
                  <div className="text-[#6a7a9a] mt-3 text-[12px]">Loading certificates...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : certificates.length === 0 && !isFetchingMore ? (
                <div className="text-center py-8 text-[#6a7a9a]">No certificates found</div>
              ) : (
                <>
                  <table className="w-full min-w-[1160px] border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#f1f4f9] text-[#4a5a7a]">
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><FileText className="h-3 w-3" />Certificate #</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />Verification Code</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><Tag className="h-3 w-3" />Certificate Type</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" />Shipper</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" />Consignee</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />Destination</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Issued At</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3 w-3" />Status</span></th>
                      <th className="whitespace-nowrap border-b-2 border-[#dde3ee] px-[11px] py-[10px] text-left text-[11px] font-semibold uppercase tracking-[0.06em]"><span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" />Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((cert) => (
                      <tr key={cert.id} className="text-[12px] transition-colors hover:bg-[#f8faff]">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#1a4a8a]">{cert.certificateNumber}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#6a7a9a]">{cert.verificationCode}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.certificateType}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.shipperName}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.consignee}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.destinationCountry}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(cert.issuedAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(cert.status, cert.voided)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[9px]">
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded text-[13px] font-medium cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]"
                              onClick={() => handleDownload(cert.pdfUrl)}
                            >
                              Download
                            </button>
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded border border-gray-300 text-[12px] font-medium cursor-pointer transition-all bg-white text-[#2a3a56]  hover:bg-[#f1f4f9]"
                              onClick={() => handleView(cert.applicationId)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  {isFetchingMore && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ClipLoader color="#1a4a8a" size={20} />
                      <div className="text-[#6a7a9a] mt-2 text-[11px]">Loading more certificates...</div>
                    </div>
                  )}
                </>
              )}
            </div>
            {certificates.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-[#6a7a9a]">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, certificates.length)} of {certificates.length} certificates
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="rounded border border-[#ccd3e0] bg-white px-4 py-1.5 text-[11px] font-medium text-[#2a3a56] transition-colors hover:bg-[#f1f4f9] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </button>
                  <span className="px-1 text-[11px] text-[#6a7a9a]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="rounded border border-[#ccd3e0] bg-white px-4 py-1.5 text-[11px] font-medium text-[#2a3a56] transition-colors hover:bg-[#f1f4f9] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
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
