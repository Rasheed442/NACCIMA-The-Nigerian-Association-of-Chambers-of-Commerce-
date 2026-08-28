'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Document {
  id: string;
  applicationId: string;
  companyId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export default function MyDocuments() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
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
        
        // Fetch documents for each application
        const allDocuments: Document[] = [];
        for (const app of apps) {
          try {
            const docsResponse = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${app.id}/documents`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            const docsResult = await docsResponse.json();

            if (docsResponse.ok && docsResult.data) {
              const docs = Array.isArray(docsResult.data) ? docsResult.data : [docsResult.data];
              allDocuments.push(...docs);
            }
          } catch (err) {
            console.error(`Failed to fetch documents for app ${app.id}:`, err);
          }
        }
        
        setDocuments(allDocuments);
      } else {
        setError(appsResult.message || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError('Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'COMMERCIAL_INVOICE': 'Commercial Invoice',
      'PACKING_LIST': 'Packing List',
      'BILL_OF_LADING': 'Bill of Lading',
      'CERTIFICATE_OF_ORIGIN': 'Certificate of Origin',
      'INSURANCE_CERTIFICATE': 'Insurance Certificate',
      'OTHER': 'Other',
    };
    return labels[type] || type;
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = documents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-[18px]">
              <div className="text-[20px] font-medium text-[#1a2236]">My Documents</div>
            </div>

            <div className="overflow-x-auto pt-4 overflow-y-auto rounded-lg border border-[#dde3ee]">
              {isLoading ? (
                <div className="text-center py-8 text-[#6a7a9a]">Loading documents...</div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-[#6a7a9a]">No documents found</div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#f1f4f9] text-[12px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Document Type</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">File Name</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Application ID</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Uploaded At</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getDocumentTypeLabel(doc.documentType)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{doc.fileName}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#1a4a8a]">{doc.applicationId}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{formatDate(doc.uploadedAt)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[5px]">
                            <button 
                              className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]"
                              onClick={() => handleDownload(doc.fileUrl)}
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {documents.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-[11px] text-[#6a7a9a]">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, documents.length)} of {documents.length} documents
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
