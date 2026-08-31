'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface CertificateType {
  certificateTypeId: string;
  certificateTypeCode: string;
  certificateTypeName: string;
  feeBasis: 'FLAT' | 'PER_UNIT';
  memberAmount: number;
  nonMemberAmount: number;
  vatRate: number;
}

export default function AdminCertificateTypes() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateType | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    certificateTypeName: '',
    certificateTypeCode: '',
    feeBasis: 'FLAT' as 'FLAT' | 'PER_UNIT',
    memberAmount: 0,
    nonMemberAmount: 0,
    vatRate: 0,
  });

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCertificateTypes();
  }, []);

  const fetchCertificateTypes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/fees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setCertificateTypes(result.data);
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

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleEdit = (cert: CertificateType) => {
    setSelectedCertificate(cert);
    setFormData({
      certificateTypeName: cert.certificateTypeName,
      certificateTypeCode: cert.certificateTypeCode,
      feeBasis: cert.feeBasis,
      memberAmount: cert.memberAmount,
      nonMemberAmount: cert.nonMemberAmount,
      vatRate: cert.vatRate,
    });
    setIsPanelMounted(true);
    setTimeout(() => setIsPanelOpen(true), 10);
  };

  const handleCancel = () => {
    setIsPanelOpen(false);
    // Wait for slide-out animation to complete before unmounting
    setTimeout(() => {
      setIsPanelMounted(false);
      setSelectedCertificate(null);
      setFormData({
        certificateTypeName: '',
        certificateTypeCode: '',
        feeBasis: 'FLAT',
        memberAmount: 0,
        nonMemberAmount: 0,
        vatRate: 0,
      });
    }, 300);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh data
      fetchCertificateTypes();
    } catch (err) {
      console.error('Failed to save certificate type:', err);
      setError('Failed to save certificate type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-[24px] font-medium text-[#1a2236]">Certificate Type</div>
                <div className="text-[12px] text-[#6a7a9a]">Configure fields, required documents, and certificate number format per type</div>
              </div>
              <button className="px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70]">
                ➕ Add Certificate Type
              </button>
            </div>

            {success && (
              <div className="mb-4 px-4 py-3 bg-[#d1fae5] text-[#065f46] rounded-[4px] text-[13px]">
                Certificate type saved successfully
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 bg-[#fee2e2] text-[#9b1c1c] rounded-[4px] text-[13px]">
                {error}
              </div>
            )}

            {/* Full-width Table */}
            <div className="bg-white border border-[#dde3ee] rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafd] border-b border-[#dde3ee]">
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Certificate</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Code</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Fee Basis</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Member Fee</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Non-Member Fee</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">VAT Rate</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificateTypes.map((cert, index) => (
                    <tr 
                      key={cert.certificateTypeId}
                      className={`border-b border-[#dde3ee] hover:bg-[#f8fafd] ${index === 0 ? 'bg-[#f0f7ff]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1a2236]">{cert.certificateTypeName}</td>
                      <td className="px-4 py-3 text-[13px] font-mono text-[#6a7a9a]">{cert.certificateTypeCode}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{cert.feeBasis}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">₦{cert.memberAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">₦{cert.nonMemberAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{(cert.vatRate * 100)?.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleEdit(cert)}
                          className="px-3 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Slide-out Configuration Panel */}
            {isPanelMounted && selectedCertificate && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop */}
                <div 
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={handleCancel}
                />
                {/* Slide-out Panel */}
                <div className={`relative w-[400px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[14px] font-semibold text-[#1a2236]">✏️ Editing: {selectedCertificate?.certificateTypeName}</div>
                      <button 
                        onClick={handleCancel}
                        className="text-[#6a7a9a] hover:text-[#1a2236] text-[18px]"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Certificate Name</label>
                      <input
                        type="text"
                        name="certificateTypeName"
                        value={formData.certificateTypeName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Code</label>
                        <input
                          type="text"
                          name="certificateTypeCode"
                          value={formData.certificateTypeCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Fee Basis</label>
                        <select
                          name="feeBasis"
                          value={formData.feeBasis}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        >
                          <option value="FLAT">Flat</option>
                          <option value="PER_UNIT">Per Unit</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Member Fee (₦)</label>
                        <input
                          type="number"
                          name="memberAmount"
                          value={formData.memberAmount}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Non-Member Fee (₦)</label>
                        <input
                          type="number"
                          name="nonMemberAmount"
                          value={formData.nonMemberAmount}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">VAT Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        name="vatRate"
                        value={formData.vatRate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
