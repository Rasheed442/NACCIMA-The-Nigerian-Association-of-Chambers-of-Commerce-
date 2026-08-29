'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { ClipLoader } from 'react-spinners';

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
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        setIsLoading(false);
        return;
      }

      // First fetch all applications to get their IDs
      const appsResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const appsResult = await appsResponse.json();

      if (appsResponse.ok && appsResult.data) {
        const apps = Array.isArray(appsResult.data) ? appsResult.data : [appsResult.data];
        
        // Set loading to false once we have applications
        setIsLoading(false);
        setIsFetchingMore(true);
        
        // Fetch certificates for each application progressively
        for (const app of apps) {
          try {
            const certResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${app.id}/certificate`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            const certResult = await certResponse.json();

            if (certResponse.ok && certResult.data) {
              setCertificates(prev => {
                const newCertificates = [...prev, certResult.data];
                // Hide loading more indicator once we have at least 10 items
                if (newCertificates.length >= 10) {
                  setIsFetchingMore(false);
                }
                return newCertificates;
              });
            }
          } catch (err) {
            console.error(`Failed to fetch certificate for app ${app.id}:`, err);
          }
        }
        
        setIsFetchingMore(false);
      } else {
        setError(appsResult.message || 'Failed to fetch applications');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to fetch certificates');
      setIsLoading(false);
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
      return <span className="inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Voided</span>;
    }
    if (status === 'VALID') {
      return <span className="inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Valid</span>;
    }
    return <span className="inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">{status}</span>;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-[18px]">
              <div className="text-[20px] font-medium text-[#1a2236]">Issued Certificates</div>
            </div>

            <div className="overflow-x-auto pt-4 overflow-y-auto rounded-lg border border-[#dde3ee]">
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
                  <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#f1f4f9] text-[12px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Certificate #</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Verification Code</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Certificate Type</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Shipper</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Consignee</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Destination</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Issued At</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((cert) => (
                      <tr key={cert.id} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#1a4a8a]">{cert.certificateNumber}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[10px] text-[#6a7a9a]">{cert.verificationCode}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.certificateType}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.shipperName}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.consignee}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{cert.destinationCountry}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(cert.issuedAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(cert.status, cert.voided)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[5px]">
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]"
                              onClick={() => handleDownload(cert.pdfUrl)}
                            >
                              Download
                            </button>
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]"
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
              <div className="flex items-center justify-between mt-4">
                <div className="text-[11px] text-[#6a7a9a]">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, certificates.length)} of {certificates.length} certificates
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
