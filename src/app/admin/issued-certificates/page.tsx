'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { BadgeCheck, Building2, CalendarDays, Eye, FileText, MapPin, Search, Tag } from 'lucide-react';

interface Certificate {
  certificateId: string;
  applicationId: string;
  certificateNumber: string;
  certificateType: string;
  certificateTypeId: string;
  companyName: string;
  companyId: string;
  shipperName: string;
  consignee: string;
  destinationCountry: string;
  destinationPort: string;
  status: 'VALID' | 'VOIDED' | 'EXPIRED';
  issuedAt: string;
  issuedBy: string;
  voided: boolean;
  pdfUrl: string;
}

export default function AdminIssuedCertificates() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const fetchCertificates = async () => {
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
      
      if (searchQuery) params.append('search', searchQuery);

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificates?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const certs = Array.isArray(result.data.content) ? result.data.content : [result.data.content];
        setCertificates(certs);
        setTotalPages(result.data.totalPages || 0);
        setTotalCertificates(result.data.totalElements || 0);
      } else {
        setError(result.message || 'Failed to fetch certificates');
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to fetch certificates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchCertificates();
    }, 0);

    return () => window.clearTimeout(fetchTimer);
  }, [currentPage, searchQuery]);

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

  const handleView = (certificateId: string) => {
    router.push(`/admin/issued-certificates/${certificateId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: Certificate['status'], voided: boolean) => {
    if (voided) {
      return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Voided</span>;
    }
    if (status === 'VALID') {
      return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Valid</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">{status}</span>;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-4">
              <div className="text-[20px] font-medium text-[#1a2236]">Issued Certificates</div>
              <div className="text-[12px] text-[#6a7a9a]">All issued certificates across the system</div>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-white border border-[#dde3ee] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#059669] mb-[2px]">{totalCertificates}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Total Issued</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#065f46] mb-[2px]">{certificates.filter(c => !c.voided && c.status === 'VALID').length}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Valid Certificates</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#9b1c1c] mb-[2px]">{certificates.filter(c => c.voided).length}</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Voided Certificates</div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4 flex gap-2">
              <div className="relative w-full sm:w-[320px] lg:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7a9a]" />
                <input
                  type="text"
                  placeholder="Search company or certificate..."
                  className="w-full rounded-[4px] border border-[#d1d5db] py-2 pl-9 pr-3 text-[12px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-auto rounded border border-[#dde3ee]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipLoader size={40} color="#1a4a8a" />
                  <div className="text-[#6a7a9a] mt-3">Loading certificates...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-8 text-[#6a7a9a]">No certificates found</div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-2">
                    <tr className="bg-[#f1f4f9] text-[12px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><FileText className="h-3 w-3" />Certificate #</span></th>
                      {/* <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Company</th> */}
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Tag className="h-3 w-3" />Certificate Type</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" />Shipper</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" />Consignee</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" />Destination</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Issued At</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3 w-3" />Status</span></th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap"><span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" />Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.certificateId} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#1a4a8a]">{cert.certificateNumber}</td>
                        {/* <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.companyName || '—'}</td> */}
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.certificateType || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.shipperName || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.consignee || '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.destinationCountry ? `${cert.destinationCountry} - ${cert.destinationPort || '—'}` : '—'}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(cert.issuedAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(cert.status, cert.voided)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[8px]">
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded text-[13px] font-medium cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]"
                              onClick={() => handleDownload(cert.pdfUrl)}
                            >
                              Download
                            </button>
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded border border-gray-300 text-[12px] font-medium cursor-pointer transition-all bg-white text-[#2a3a56]  hover:bg-[#f1f4f9]"
                              onClick={() => handleView(cert.certificateId)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {certificates.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-[#6a7a9a]">
                  Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalCertificates)} of {totalCertificates} certificates
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    className="rounded border border-[#ccd3e0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#2a3a56] transition-colors hover:bg-[#f1f4f9] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Prev
                  </button>
                  <span className="px-1 text-[11px] text-[#6a7a9a]">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    className="rounded border border-[#ccd3e0] bg-white px-3 py-1.5 text-[11px] font-medium text-[#2a3a56] transition-colors hover:bg-[#f1f4f9] disabled:cursor-not-allowed disabled:opacity-50"
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
