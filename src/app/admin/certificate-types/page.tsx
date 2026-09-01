'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { ChevronDown, X } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';

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
  const [success, setSuccess] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateType | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    certNumberPrefix: '',
    description: '',
    applicableFields: [] as string[],
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

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleEdit = (cert: CertificateType) => {
    setSelectedCertificate(cert);
    setFormData({
      name: cert.name,
      code: cert.code,
      certNumberPrefix: cert.certNumberPrefix,
      description: cert.description,
      applicableFields: cert.applicableFields,
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
        name: '',
        code: '',
        certNumberPrefix: '',
        description: '',
        applicableFields: [],
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
        name: formData.name,
        code: formData.code,
        certNumberPrefix: formData.certNumberPrefix,
        description: formData.description,
        applicableFields: formData.applicableFields,
      };

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${selectedCertificate.id}`, {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFieldToggle = (field: string) => {
    setFormData(prev => ({
      ...prev,
      applicableFields: prev.applicableFields.includes(field)
        ? prev.applicableFields.filter(f => f !== field)
        : [...prev.applicableFields, field]
    }));
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
                <div className="text-[24px] font-medium text-[#1a2236]">Certificate Types</div>
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
                <div 
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={handleCancel}
                />
                <div className={`relative w-[340px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[14px] font-semibold text-[#1a2236]">✏️ Editing: {selectedCertificate?.name}</div>
                      <button 
                        onClick={handleCancel}
                        className="text-[#6a7a9a] hover:text-[#1a2236]"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Display Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Code</label>
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Cert # Prefix</label>
                        <input
                          type="text"
                          name="certNumberPrefix"
                          value={formData.certNumberPrefix}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-[#374151] mb-2">Applicable Fields <span className="font-normal text-[#9ca3af]">(toggle to show/hide on form)</span></div>
                    <div className="border border-[#e5e7eb] rounded-[6px] p-2 mb-3 max-h-[220px] overflow-y-auto">
                      {['TIN', 'SHIPPER_NAME', 'SHIPPER_ADDRESS', 'APPROVAL_NUMBER', 'IMPORTER_EMAIL', 'CONSIGNEE', 'CONSIGNEE_ADDRESS', 'CARRIER', 'MODE_OF_TRANSPORT', 'DESTINATION', 'COUNTRY_OF_MANUFACTURING', 'TOTAL_ITEMS', 'DATE', 'TOTAL_VALUE_FOB', 'ECOWAS_NUMBER', 'CRITERIA', 'HS_CODE', 'BULK_PRODUCT_QTY_MT', 'DESCRIPTION', 'QUANTITY', 'GROSS_WEIGHT', 'NOMENCLATURE', 'VALUE'].map((field) => (
                        <div key={field} className="flex items-center justify-between py-2 px-1">
                          <span className="text-[12px] text-[#374151]">{field.replace(/_/g, ' ')}</span>
                          <button 
                            onClick={() => handleFieldToggle(field)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${formData.applicableFields.includes(field) ? 'bg-[#1a4a8a]' : 'bg-[#d1d5db]'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.applicableFields.includes(field) ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
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
