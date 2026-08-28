'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface TimelineEvent {
  event: string;
  status: string;
  comment: string | null;
  reviewerId?: string;
  occurredAt: string;
}

interface TrackingData {
  application: {
    id: string;
    certificateType: string;
    status: string;
    submittedAt: string;
    modeOfTransport: string;
    destinationCountry: string;
  };
  shipment: {
    consignee: string;
    consigneeAddress: string;
    carrier: string;
    destinationPort: string;
    totalValueFob: number;
    valueCurrency: string;
    exchangeRate: number;
  };
  payment: {
    paymentReference: string;
    amount: number;
    currency: string;
  };
  timeline: TimelineEvent[];
}

export default function ApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [activeTab, setActiveTab] = React.useState('details');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchTrackingData();
  }, [applicationId]);

  const getBaseApiUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API;
    if (!rawBaseUrl) {
      return '';
    }
    return rawBaseUrl.replace(/\/$/, '');
  };

  const fetchTrackingData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/tracking`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setTrackingData(result.data);
      } else {
        setError(result.message || 'Failed to fetch tracking data');
      }
    } catch (err) {
      console.error('Failed to fetch tracking data:', err);
      setError('Failed to fetch tracking data');
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      SUBMITTED: 'bg-[#dbeafe] text-[#1e40af]',
      PENDING_PAYMENT: 'bg-[#dbeafe] text-[#1e40af]',
      UNDER_REVIEW: 'bg-[#fef3c7] text-[#92400e]',
      APPROVED: 'bg-[#d1fae5] text-[#065f46]',
      REJECTED: 'bg-[#fee2e2] text-[#9b1c1c]',
      ISSUED: 'bg-[#e0e7ff] text-[#3730a3]',
      UNAPPROVED: 'bg-[#fdf2f8] text-[#9d174d]',
    };
    const labels: Record<string, string> = {
      SUBMITTED: 'Submitted',
      PENDING_PAYMENT: 'Pending Payment',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      ISSUED: 'Issued',
      UNAPPROVED: 'Unapproved',
    };
    return (
      <span className={`inline-block text-[12px] font-bold px-2 py-2 rounded whitespace-nowrap ${badges[status] || 'bg-[#f3f4f6] text-[#6b7280]'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTimelineStatus = (event: string, currentIndex: number, totalEvents: number) => {
    if (currentIndex === totalEvents - 1) return 'active';
    return 'done';
  };

  const getTimelineDot = (status: string) => {
    const styles = {
      done: 'bg-[#065f46]',
      active: 'bg-[#1a4a8a]',
      todo: 'bg-[#e5e7eb] text-[#9ca3af]',
    };
    const content = {
      done: '✓',
      active: '●',
      todo: '4',
    };
    return (
      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white z-1 ${styles[status as keyof typeof styles]}`}>
        {content[status as keyof typeof content]}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="exporter" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="text-center py-8 text-[#6a7a9a]">Loading tracking data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="exporter" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar />
            <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
              <div className="text-center py-8 text-[#e53e3e]">{error || 'Failed to load tracking data'}</div>
              <div className="flex justify-center mt-4">
                <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/my-applications')}>
                  ← Back to Applications
                </button>
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
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between text-[18px] uppercase mb-[3px]">
              <div className="text-[16px] font-bold text-[#1a2236]">Application {trackingData.application.id}</div>
              {getStatusBadge(trackingData.application.status)}
            </div>
            <div className="text-[11.5px] text-[#6a7a9a] mb-5">
              {trackingData.application.certificateType} &nbsp;|&nbsp; 🚢 {trackingData.application.modeOfTransport} &nbsp;|&nbsp; Submitted {formatDate(trackingData.application.submittedAt)} &nbsp;|&nbsp; Destination: {trackingData.application.destinationCountry}
            </div>
            
            <div className="grid grid-cols-[1fr_300px] gap-[18px]">
              <div>
                <div className="flex border-b-2 border-[#e5e7eb] mb-[14px]">
                  <button 
                    className={`px-3.5 py-1.75 text-[13px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'details' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Application Details
                  </button>
                  <button 
                    className={`px-3.5 py-1.75 text-[13px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'lineitems' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('lineitems')}
                  >
                    Line Items (1)
                  </button>
                  <button 
                    className={`px-3.5 py-1.75 text-[13px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'documents' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents (1/3)
                  </button>
                </div>

                {activeTab === 'details' && (
                  <>
                    <div className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[6px] p-[10px] [12px] mb-[12px]">
                      <div className="text-[13px] font-bold text-[#1e40af] uppercase tracking-[0.5px] pb-2">Shipment Information</div>
                      <div className="grid grid-cols-[130px_1fr] gap-[3px_10px] text-[13px]">
                        <span className="text-[#6a7a9a] font-medium">Consignee</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.shipment.consignee}</span>
                        <span className="text-[#6a7a9a] font-medium">Consignee Address</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.shipment.consigneeAddress}</span>
                        <span className="text-[#6a7a9a] font-medium">Destination</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.application.destinationCountry}</span>
                        <span className="text-[#6a7a9a] font-medium">Mode of Transport</span>
                        <span className="text-[#1a2236] font-medium">🚢 {trackingData.application.modeOfTransport}</span>
                        <span className="text-[#6a7a9a] font-medium">Carrier</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.shipment.carrier}</span>
                        <span className="text-[#6a7a9a] font-medium">Destination Port</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.shipment.destinationPort}</span>
                        <span className="text-[#6a7a9a] font-medium">FOB Value (USD)</span>
                        <span className="text-[#1a2236] font-medium">{trackingData.shipment.valueCurrency} {trackingData?.shipment?.totalValueFob?.toLocaleString()}</span>
                        <span className="text-[#6a7a9a] font-medium">Exchange Rate</span>
                        <span className="text-[#1a2236] font-medium">₦{trackingData?.shipment?.exchangeRate?.toLocaleString()}/USD</span>
                      </div>
                    </div>

                    <div className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[6px] p-[10px] [12px] mb-[12px]">
                      <div className="text-[13px] font-bold text-[#1e40af] uppercase tracking-[0.5px] pb-2">Payment</div>
                      <div className="grid grid-cols-[130px_1fr] gap-[3px_10px] text-[13px]">
                        <span className="text-[#6a7a9a] font-medium">Amount Paid</span>
                        <span className="text-[#065f46] font-medium">{trackingData.payment.currency} {trackingData?.payment?.amount?.toLocaleString()}</span>
                        <span className="text-[#6a7a9a] font-medium">Payment Reference</span>
                        <span className="text-[#1a2236] font-medium font-mono">{trackingData.payment.paymentReference}</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'lineitems' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[13px] font-medium text-[#1a2236] mb-4">Goods Line Items</div>
                    <div className="text-center py-8 text-[#6a7a9a]">Line items data not available in tracking response</div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[14px] font-medium text-[#1a2236] mb-4">Supporting Documents</div>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="border-[1.5px] flex flex-col gap-2 border-dashed  border-[#3a7bd5] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#3a7bd5] bg-[#f0f7ff] text-center min-w-[140px]">
                        ✅ Bill of Lading <span className="text-[12px] text-[#6a7a9a]">BOL_2026.pdf — 1.2MB</span>
                      </div>
                      <div className="border-[1.5px] flex flex-col gap-2 border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                        📎 Commercial Invoice <span className="text-[12px] text-[#e53e3e]">Required ✕</span>
                      </div>
                      <div className="border-[1.5px] flex flex-col gap-2 border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                        📎 Packing List <span className="text-[12px] text-[#e53e3e]">Required ✕</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[13px] font-medium text-[#1a2236] mb-[10px]">Application Status</div>
                <div className="flex flex-col gap-0">
                  {trackingData.timeline.map((item, index) => {
                    const timelineStatus = getTimelineStatus(item.event, index, trackingData.timeline.length);
                    return (
                      <div key={index} className="flex gap-[12px] relative">
                        {index !== trackingData.timeline.length - 1 && (
                          <div className="absolute left-[10px] top-[24px] bottom-[-4px] w-[2px] bg-[#e5e7eb]"></div>
                        )}
                        {getTimelineDot(timelineStatus)}
                        <div className="pb-[16px]">
                          <div className="text-[13px] font-medium text-[#1a2236]">{item.status.replace(/_/g, ' ')}</div>
                          <div className="text-[13px] text-[#6a7a9a] mt-[1px]">{formatDate(item.occurredAt)}</div>
                          {item.comment && (
                            <div className="text-[11px] text-[#4a5a7a] mt-[3px] bg-[#f8faff] border-l-3 border-[#3a7bd5] p-[4px_7px] rounded-[0_4px_4px_0]">
                              {item.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/my-applications')}>
                ← Back to Applications
              </button>
            </div>
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
