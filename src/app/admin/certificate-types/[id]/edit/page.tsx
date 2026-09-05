'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { TemplateDesigner } from '../../components/template-designer';

interface CertificateType {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  applicableFields: string[];
  requiredDocuments: string;
  feeStructure: any;
  templateUrl: string;
  certNumberPrefix: string;
  applicationCount: number;
  templateConfig: string;
}

export default function EditCertificateType() {
  const router = useRouter();
  const params = useParams();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [certificateType, setCertificateType] = useState<CertificateType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchCertificateType(params.id as string);
    }
  }, [params.id]);

  const fetchCertificateType = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/certificate-types/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setCertificateType(result.data || result);
      } else {
        setError(result.message || 'Failed to fetch certificate type');
      }
    } catch (err) {
      console.error('Failed to fetch certificate type:', err);
      setError('Failed to fetch certificate type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/login');
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
                <div className="text-[#6a7a9a] mt-3">Loading certificate type...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificateType) {
    console.log('Edit page - error or no certificateType:', { error, certificateType });
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-600 mb-3">{error || 'Certificate type not found'}</div>
                <button
                  onClick={() => router.push('/admin/certificate-types')}
                  className="px-4 py-2 bg-[#1a4a8a] text-white rounded"
                >
                  Back to Certificate Types
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Edit page - rendering TemplateDesigner with:', { mode: 'edit', certificateType });
  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <TemplateDesigner mode="edit" certificateType={certificateType} />
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
