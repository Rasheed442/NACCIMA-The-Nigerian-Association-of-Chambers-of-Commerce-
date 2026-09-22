'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { FiPlus, FiMoreVertical, FiEdit, FiCheck, FiX } from "react-icons/fi";

interface FeeStructure {
  type: 'FLAT' | 'PERCENTAGE';
  vatRate: number;
  memberAmount?: number;
  nonMemberAmount?: number;
  memberRate?: number;
  nonMemberRate?: number;
}

interface CertificateType {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  applicableFields: string[];
  requiredDocuments: string;
  feeStructure: FeeStructure;
  templateUrl: string;
  certNumberPrefix: string;
  applicationCount: number;
  templateConfig: string;
}

export default function AdminCertificateTypes() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as HTMLElement).closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownId]);

  const fetchCertificateTypes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        // Response is directly an array, not wrapped in a data property
        setCertificateTypes(Array.isArray(result) ? result : result.data || []);
      } else {
        setError(result.message || 'Failed to fetch certificate types');
      }
    } catch (err) {
      console.error('Failed to fetch certificate types:', err);
      setError('Failed to fetch certificate types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchTimer = window.setTimeout(() => {
      void fetchCertificateTypes();
    }, 0);

    return () => window.clearTimeout(fetchTimer);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleEdit = (cert: CertificateType) => {
    router.push(`/admin/certificate-types/${cert.id}/edit`);
  };

  const handleAdd = () => {
    router.push('/admin/certificate-types/new');
  };

  const handleToggleStatus = async (cert: CertificateType, newStatus: boolean) => {
    setUpdatingStatus(cert.id);
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(
        `${baseUrl}/api/v1/admin/certificate-types/${cert.id}/status?active=${newStatus}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update the local state
        setCertificateTypes(prev =>
          prev.map(c => (c.id === cert.id ? { ...c, active: newStatus } : c))
        );
        setOpenDropdownId(null);
      } else {
        const result = await response.json();
        setError(result.message || 'Failed to update certificate type status');
      }
    } catch (err) {
      console.error('Failed to update certificate type status:', err);
      setError('Failed to update certificate type status');
    } finally {
      setUpdatingStatus(null);
    }
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
                <div className="text-[#6a7a9a] mt-3">Loading certificate types...</div>
              </div>
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
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-6">
              <div>
                <div className="text-[24px] font-semibold text-[#1a2236]">Certificate Types</div>
                <div className="text-[14px] font-medium text-[#6a7a9a]">Configure fields, required documents, and certificate number format per type</div>
              </div>
              <button 
                onClick={handleAdd}
                className="px-4 cursor-pointer flex items-center gap-2 py-2 bg-[#1a4a8a] text-white rounded text-[14px] font-medium hover:bg-[#153c70]"
              >
                <FiPlus color="white" /> Add Certificate Type
              </button>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-[#fee2e2] text-[#9b1c1c] rounded-[4px] text-[13px]">
                {error}
              </div>
            )}

            {/* Full-width Table */}
            <div className="bg-white border border-[#dde3ee] rounded shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-[#f8fafd] border-b border-[#dde3ee]">
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Certificate</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Code</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Applications</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Status</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificateTypes.map((cert, index) => (
                    <tr 
                      key={cert.id}
                      className={`border-b border-[#dde3ee] hover:bg-[#f8fafd] ${index === 0 ? 'bg-[#f0f7ff]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1a2236]">{cert.name}</td>
                      <td className="px-4 py-3 text-[13px] font-mono text-[#6a7a9a]">{cert.code}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{cert.applicationCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${cert.active ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                          {cert.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 relative">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === cert.id ? null : cert.id)}
                            className="p-1.5 hover:bg-[#f3f4f9] rounded transition-colors"
                          >
                            <FiMoreVertical className="w-4 h-4 text-[#6a7a9a]" />
                          </button>

                          {openDropdownId === cert.id && (
                            <div className="dropdown-menu absolute right-0 top-full mt-1 w-32 bg-white border border-[#d1d5db] rounded-md shadow-lg z-10 animate-in fade-in slide-in-from-top-1 duration-200">
                              <button
                                onClick={() => {
                                  handleEdit(cert);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-[12px] text-[#1a2236] hover:bg-[#f3f4f9] flex items-center gap-2 transition-colors"
                              >
                                <FiEdit className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              {cert.active ? (
                                <button
                                  onClick={() => handleToggleStatus(cert, false)}
                                  disabled={updatingStatus === cert.id}
                                  className="w-full px-3 py-2 text-left text-[12px] text-[#92400e] hover:bg-[#fef3c7] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                  {updatingStatus === cert.id ? 'Deactivating...' : 'Deactivate'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(cert, true)}
                                  disabled={updatingStatus === cert.id}
                                  className="w-full px-3 py-2 text-left text-[12px] text-[#065f46] hover:bg-[#d1fae5] flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FiCheck className="w-3.5 h-3.5" />
                                  {updatingStatus === cert.id ? 'Activating...' : 'Activate'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
