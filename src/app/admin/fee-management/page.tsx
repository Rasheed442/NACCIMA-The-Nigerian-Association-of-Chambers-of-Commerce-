'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { ChevronDown, X } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface CertificateType {
  certificateTypeId: string;
  certificateTypeCode: string;
  certificateTypeName: string;
  feeBasis: 'FLAT' | 'PERCENTAGE';
  memberAmount?: number | null;
  nonMemberAmount?: number | null;
  memberRate?: number | null;
  nonMemberRate?: number | null;
  vatRate: number;
}

export default function AdminFeeManagement() {
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

  const [formData, setFormData] = useState({
    certificateTypeName: '',
    certificateTypeCode: '',
    feeBasis: 'FLAT' as 'FLAT' | 'PERCENTAGE',
    memberAmount: 0,
    nonMemberAmount: 0,
    memberRate: 0,
    nonMemberRate: 0,
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
      memberAmount: cert.memberAmount || 0,
      nonMemberAmount: cert.nonMemberAmount || 0,
      memberRate: cert.memberRate || 0,
      nonMemberRate: cert.nonMemberRate || 0,
      vatRate: cert.vatRate,
    });
    setIsPanelMounted(true);
    setTimeout(() => setIsPanelOpen(true), 10);
  };

  const handleCancel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setIsPanelMounted(false);
      setSelectedCertificate(null);
      setFormData({
        certificateTypeName: '',
        certificateTypeCode: '',
        feeBasis: 'FLAT',
        memberAmount: 0,
        nonMemberAmount: 0,
        memberRate: 0,
        nonMemberRate: 0,
        vatRate: 0,
      });
    }, 300);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    if (!selectedCertificate) {
      setError('No certificate selected');
      setIsSaving(false);
      return;
    }
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const payload = {
        feeBasis: formData.feeBasis,
        vatRate: formData.vatRate,
        ...(formData.feeBasis === 'FLAT' ? {
          memberAmount: formData.memberAmount,
          nonMemberAmount: formData.nonMemberAmount,
          memberRate: null,
          nonMemberRate: null,
        } : {
          memberRate: formData.memberRate,
          nonMemberRate: formData.nonMemberRate,
          memberAmount: null,
          nonMemberAmount: null,
        }),
      };

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${selectedCertificate.certificateTypeId}/fee`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        handleCancel();
        fetchCertificateTypes();
      } else {
        setError(result.message || 'Failed to save certificate type');
      }
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
                <div className="text-[#6a7a9a] mt-3">Loading fee schedules...</div>
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
                <div className="text-[24px] font-medium text-[#1a2236]">Fee Management</div>
                <div className="text-[12px] text-[#6a7a9a]">Member and Non-Member fee schedules per certificate type — as per v2.2 requirements</div>
              </div>
            </div>

            <div className="mb-4 px-4 py-3 bg-[#eff6ff] text-[#1e40af] rounded-[4px] text-[13px] flex items-start gap-2">
              <span>ℹ️</span>
              <span>Fee changes take effect for applications submitted after the save date. In-flight applications retain the fee calculated at submission time.</span>
            </div>

            {success && (
              <div className="mb-4 px-4 py-3 bg-[#d1fae5] text-[#065f46] rounded-[4px] text-[13px]">
                Fee schedule saved successfully
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
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Certificate Type</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Fee Basis</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Member Rate</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Non-Member Rate</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">VAT</th>
                    <th className="text-left px-4 py-3 text-[12px] font-semibold text-[#1a2236]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certificateTypes.map((cert, index) => (
                    <tr 
                      key={cert.certificateTypeId}
                      className={`border-b border-[#dde3ee] hover:bg-[#f8fafd] ${index === 0 ? 'bg-[#fffbeb]' : ''}`}
                    >
                      <td className="px-4 py-3 text-[13px] font-medium text-[#1a2236]">{cert.certificateTypeName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${cert.feeBasis === 'FLAT' ? 'bg-[#f3f4f6] text-[#374151]' : 'bg-[#dbeafe] text-[#1e40af]'}`}>
                          {cert.feeBasis === 'FLAT' ? 'Flat Rate (NGN)' : '% of FOB (USD→NGN)'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#065f46]">
                        {cert.feeBasis === 'FLAT' 
                          ? `₦${cert.memberAmount?.toLocaleString() || '0'}`
                          : `${(cert.memberRate || 0).toFixed(4)}% of FOB`
                        }
                      </td>
                      <td className="px-4 py-3 text-[13px] font-semibold text-[#9b1c1c]">
                        {cert.feeBasis === 'FLAT'
                          ? `₦${cert.nonMemberAmount?.toLocaleString() || '0'}`
                          : `${(cert.nonMemberRate || 0).toFixed(4)}% of FOB`
                        }
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{(cert.vatRate * 100)?.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleEdit(cert)}
                          className="px-3 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                        >
                          Edit
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
                <div 
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={handleCancel}
                />
                <div className={`relative w-[400px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[14px] font-semibold text-[#1a2236]">✏️ Editing: {selectedCertificate?.certificateTypeName}</div>
                      <button 
                        onClick={handleCancel}
                        className="text-[#6a7a9a] hover:text-[#1a2236]"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Certificate Name</label>
                      <input
                        type="text"
                        name="certificateTypeName"
                        value={formData.certificateTypeName}
                        onChange={handleInputChange}
                        disabled
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] bg-[#f3f4f6] cursor-not-allowed"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Fee Basis</label>
                      <div className="relative">
                        <select
                          name="feeBasis"
                          value={formData.feeBasis}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 pr-8 border border-[#d1d5db] rounded-[4px] text-[13px] appearance-none cursor-pointer"
                        >
                          <option value="FLAT">Flat Rate (NGN)</option>
                          <option value="PERCENTAGE">% of FOB (USD→NGN)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6a7a9a] pointer-events-none" />
                      </div>
                    </div>

                    {formData.feeBasis === 'FLAT' ? (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Member Fee (₦)</label>
                          <input
                            type="number"
                            name="memberAmount"
                            value={formData.memberAmount}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Non-Member Fee (₦)</label>
                          <input
                            type="number"
                            name="nonMemberAmount"
                            value={formData.nonMemberAmount}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Member Rate (%)</label>
                          <input
                            type="number"
                            step="0.0001"
                            name="memberRate"
                            value={formData.memberRate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <div className="text-[10px] text-[#9ca3af] mt-1">e.g. 0.11 = 0.11% of NGN FOB</div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Non-Member Rate (%)</label>
                          <input
                            type="number"
                            step="0.0001"
                            name="nonMemberRate"
                            value={formData.nonMemberRate}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">VAT Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="vatRate"
                        value={formData.vatRate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Fee Changes'}
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
