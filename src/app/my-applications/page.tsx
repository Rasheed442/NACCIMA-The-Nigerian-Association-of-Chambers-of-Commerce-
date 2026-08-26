'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { FiPlus } from 'react-icons/fi';

interface Application {
  id: string;
  certificateType: string;
  tin: string;
  shipperName: string;
  shipperAddress: string;
  consignee: string;
  consigneeAddress: string;
  carrier: string;
  modeOfTransport: string;
  destinationCountry: string;
  destinationPort: string;
  countryOfMfg: string;
  totalItems: number;
  totalValueFob: number;
  valueCurrency: string;
  bulkQtyMt: number;
  status: 'DRAFT' | 'SUBMITTED' | 'PENDING_PAYMENT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'UNAPPROVED';
  createdAt?: string;
  updatedAt?: string;
}

export default function MyApplications() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resubmittingId, setResubmittingId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchApplications();
  }, []);

  const getBaseApiUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API;
    if (!rawBaseUrl) {
      return '';
    }
    return rawBaseUrl.replace(/\/+$/, '');
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/');
        return;
      }

      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await fetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        // Handle both single object and array response
        const apps = Array.isArray(result.data) ? result.data : [result.data];
        setApplications(apps);
      } else {
        setError(result.message || 'Failed to fetch applications');
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const getStatusBadge = (status: Application['status']) => {
    const badges: Record<Application['status'], string> = {
      DRAFT: 'bg-[#f3f4f6] text-[#6b7280]',
      SUBMITTED: 'bg-[#dbeafe] text-[#1e40af]',
      PENDING_PAYMENT: 'bg-[#dbeafe] text-[#1e40af]',
      UNDER_REVIEW: 'bg-[#fef3c7] text-[#92400e]',
      APPROVED: 'bg-[#d1fae5] text-[#065f46]',
      REJECTED: 'bg-[#fee2e2] text-[#9b1c1c]',
      ISSUED: 'bg-[#e0e7ff] text-[#3730a3]',
      UNAPPROVED: 'bg-[#fdf2f8] text-[#9d174d]',
    };
    const labels: Record<Application['status'], string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PENDING_PAYMENT: 'Pending Payment',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      ISSUED: 'Issued',
      UNAPPROVED: 'Unapproved',
    };
    return (
      <span className={`inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${badges[status] || 'bg-[#f3f4f6] text-[#6b7280]'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleResubmit = async (id: string) => {
    setResubmittingId(id);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/');
        return;
      }

      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await fetch(`${baseUrl}/api/v1/certificates/applications/${id}/resubmit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/new-application?resubmit=${id}`);
      } else {
        setError(result.message || 'Failed to resubmit application');
      }
    } catch (err) {
      console.error('Failed to resubmit application:', err);
      setError('Failed to resubmit application');
    } finally {
      setResubmittingId(null);
    }
  };

  const getActionButton = (status: Application['status'], id: string) => {
    if (status === 'ISSUED') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]">Download</button>;
    }
    if (status === 'PENDING_PAYMENT') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Pay Now</button>;
    }
    if (status === 'UNAPPROVED') {
      return (
        <button 
          className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleResubmit(id)}
          disabled={resubmittingId === id}
        >
          {resubmittingId === id ? 'Resubmitting...' : 'Edit & Resubmit'}
        </button>
      );
    }
    return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/my-applications/${id}`)}>View</button>;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-[18px]">
              <div className="text-[20px] font-medium text-[#1a2236]">My Applications</div>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[16px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push('/new-application')}><FiPlus color="white" size={16}/> New Application</button>
            </div>
                          {/* <p className='text-[20px] pt-2 font-thin pb-8 px-4 text-[#1a2236]'> Application Drafts</p> */}

            <div className="overflow-x-auto pt-4 overflow-y-auto rounded-lg border border-[#dde3ee]">
              {isLoading ? (
                <div className="text-center py-8 text-[#6a7a9a]">Loading applications...</div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-[#6a7a9a]">No applications found</div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#f1f4f9] text-[14px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Approval #</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">TIN</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Shipper Name</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Shipper Address</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Consignee</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Consignee Address</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Carrier</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Transport Mode</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Destination</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Port</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Country of Mfg</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Items</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Value (FOB)</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Bulk Qty (MT)</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                      <th className="px-[11px] py-[10px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-[#f8faff] text-[14px] transition-colors">
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] font-mono text-[#1a4a8a] whitespace-nowrap">{app.id}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.tin || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.shipperName || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.shipperAddress || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.consignee || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.consigneeAddress || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.carrier || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.modeOfTransport || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.destinationCountry || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.destinationPort || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.countryOfMfg || '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] text-center whitespace-nowrap">{app.totalItems || 0}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.totalValueFob ? `${app.valueCurrency || 'USD'} ${app.totalValueFob.toLocaleString()}` : '—'}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">{app.bulkQtyMt || 0}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap uppercase">{getStatusBadge(app.status)}</td>
                        <td className="px-[11px] py-[12px] border-b border-[#edf0f5] whitespace-nowrap">
                          <div className="flex gap-[5px] ">
                            {getActionButton(app.status, app.id)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
