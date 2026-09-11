'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { FileText, PackageOpen } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface TimelineEvent {
  event: string;
  status: string;
  comment: string | null;
  reviewerId?: string;
  occurredAt: string;
}

interface LineItem {
  id: string;
  hsCode?: string;
  hsDescription?: string;
  marksNo?: string;
  description?: string;
  nomenclature?: string;
  quantity?: number;
  unit?: string;
  grossWeight?: number;
  value?: number;
  valueCurrency?: string;
}

interface ApplicationDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  uploadedAt?: string;
}

interface TrackingData {
  application: {
    id: string;
    certificateType: string;
    status: string;
    submittedAt: string;
    modeOfTransport: string;
    destinationCountry: string;
    valueCurrency?: string;
    goods?: LineItem[];
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
  lineItems?: LineItem[];
  documents?: ApplicationDocument[];
}

export default function ApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [activeTab, setActiveTab] = React.useState('details');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [applicationGoods, setApplicationGoods] = useState<LineItem[] | null>(null);
  const [lineItemsLoading, setLineItemsLoading] = useState(true);
  const [documents, setDocuments] = useState<ApplicationDocument[] | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadTrackingData = async () => {
      await Promise.resolve();
      if (isCancelled) return;

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

        if (isCancelled) return;

        if (response.ok && result.data) {
          setTrackingData(result.data);
        } else {
          setError(result.message || 'Failed to fetch tracking data');
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch tracking data:', err);
          setError('Failed to fetch tracking data');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const loadDocuments = async () => {
      setDocumentsLoading(true);
      setDocumentsError(null);

      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) throw new Error('API URL not configured');

        const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/documents`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        if (isCancelled) return;
        if (!response.ok) {
          setDocumentsError(result.message || 'Failed to load documents.');
          return;
        }

        setDocuments(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch application documents:', err);
          setDocumentsError('Failed to load documents.');
        }
      } finally {
        if (!isCancelled) setDocumentsLoading(false);
      }
    };

    const loadApplicationGoods = async () => {
      setLineItemsLoading(true);

      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) throw new Error('API URL not configured');

        const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();

        if (isCancelled || !response.ok) return;

        const payload = result.data;
        const applications = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.content)
            ? payload.content
            : payload?.id || payload?.applicationId
              ? [payload]
              : [];
        const application = applications.find((item: { id?: string; applicationId?: string }) => (
          item.id === applicationId || item.applicationId === applicationId
        ));

        setApplicationGoods(Array.isArray(application?.goods) ? application.goods : []);
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch application line items:', err);
          setApplicationGoods([]);
        }
      } finally {
        if (!isCancelled) setLineItemsLoading(false);
      }
    };

    void loadTrackingData();
    void loadDocuments();
    void loadApplicationGoods();

    return () => {
      isCancelled = true;
    };
  }, [applicationId]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  // Tracking responses do not always include goods and documents. The tabs
  // remain available, but show an empty state instead of placeholder records.
  const lineItems = applicationGoods || trackingData?.lineItems || trackingData?.application.goods || [];
  const documentRecords = documents || trackingData?.documents || [];
  const hasLineItems = lineItems.length > 0;
  const hasDocuments = documentRecords.length > 0;
  const firstLineItem = lineItems[0];
  const fobValueNgn = trackingData?.shipment.totalValueFob && trackingData.shipment.exchangeRate
    ? trackingData.shipment.totalValueFob * trackingData.shipment.exchangeRate
    : undefined;

  const getDocumentUrl = (fileUrl?: string) => {
    if (!fileUrl) return undefined;
    const markdownUrl = fileUrl.match(/^\[.*?\]\((https?:\/\/[^)]+)\)$/);
    return markdownUrl?.[1] || fileUrl;
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
                    Line Items ({lineItems.length})
                  </button>
                  <button 
                    className={`px-3.5 py-1.75 text-[13px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'documents' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents ({documentRecords.length})
                  </button>
                </div>

                {activeTab === 'details' && (
                  <>
                    <section className="mb-3 rounded-[6px] border border-[#bfdbfe] bg-[#f0f7ff] p-[10px]">
                      <h2 className="border-b border-[#d6e8fb] pb-2 text-[13px] font-bold uppercase tracking-[0.5px] text-[#1e40af]">Shipment Information</h2>
                      <dl className="mt-2 grid grid-cols-[145px_minmax(0,1fr)] gap-x-[10px] gap-y-[5px] text-[13px]">
                        <dt className="font-medium text-[#6a7a9a]">Consignee</dt><dd className="font-medium text-[#1a2236]">{trackingData.shipment.consignee || '—'}</dd>
                        <dt className="font-medium text-[#6a7a9a]">Destination</dt><dd className="font-medium text-[#1a2236]">{trackingData.application.destinationCountry || '—'}</dd>
                        <dt className="font-medium text-[#6a7a9a]">Mode of Transport</dt><dd className="font-medium text-[#1a2236]">{trackingData.application.modeOfTransport || '—'}</dd>
                        <dt className="font-medium text-[#6a7a9a]">Carrier</dt><dd className="font-medium text-[#1a2236]">{trackingData.shipment.carrier || '—'}</dd>
                        <dt className="font-medium text-[#6a7a9a]">FOB Value ({trackingData.shipment.valueCurrency || 'USD'})</dt><dd className="font-medium text-[#1a2236]">{trackingData.shipment.valueCurrency} {trackingData.shipment.totalValueFob?.toLocaleString() || '—'}</dd>
                        {fobValueNgn && <><dt className="font-medium text-[#6a7a9a]">FOB Value (NGN)</dt><dd className="font-medium text-[#1a2236]">₦{fobValueNgn.toLocaleString()} @ ₦{trackingData.shipment.exchangeRate.toLocaleString()}/$</dd></>}
                        {firstLineItem && <><dt className="font-medium text-[#6a7a9a]">HS Code</dt><dd className="font-mono font-medium text-[#1a4a8a]">{firstLineItem.hsCode || '—'}{firstLineItem.hsDescription ? ` — ${firstLineItem.hsDescription}` : ''}</dd></>}
                      </dl>
                    </section>

                    <section className="mb-3 rounded-[6px] border border-[#bfdbfe] bg-[#f0f7ff] p-[10px]">
                      <h2 className="border-b border-[#d6e8fb] pb-2 text-[13px] font-bold uppercase tracking-[0.5px] text-[#1e40af]">Payment</h2>
                      <dl className="mt-2 grid grid-cols-[145px_minmax(0,1fr)] gap-x-[10px] gap-y-[5px] text-[13px]">
                        <dt className="font-medium text-[#6a7a9a]">Amount Paid</dt><dd className="font-medium text-[#065f46]">{trackingData.payment.currency} {trackingData.payment.amount?.toLocaleString() || '—'}</dd>
                        <dt className="font-medium text-[#6a7a9a]">Payment Reference</dt><dd className="font-mono font-medium text-[#1a2236]">{trackingData.payment.paymentReference || '—'}</dd>
                      </dl>
                    </section>
                  </>
                )}

                {activeTab === 'lineitems' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[13px] font-medium text-[#1a2236] mb-4">Goods Line Items</div>
                    {lineItemsLoading ? <div className="flex flex-col items-center justify-center py-8 text-center text-[#6a7a9a]"><PackageOpen size={32} className="mb-2 animate-pulse text-[#9aa9c2]" /><p className="text-[13px] font-medium">Loading line items...</p></div>
                      : hasLineItems ? <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] overflow-x-auto text-left text-[12px]">
                        <thead className="bg-[#f1f4f9] text-[#4a5a7a]">
                          <tr><th className="p-2">HS Code</th><th className="p-2">Description</th><th className="p-2">Marks No.</th><th className="p-2">Nomenclature</th><th className="p-2">Quantity</th><th className="p-2">Gross Weight</th><th className="p-2">Value</th></tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item) => (
                            <tr key={item.id} className="border-t border-[#dde3ee]">
                              <td className="p-2 font-mono">{item.hsCode || '—'}</td><td className="p-2"><div>{item.description || '—'}</div>{item.hsDescription && <div className="mt-0.5 text-[11px] text-[#6a7a9a]">{item.hsDescription}</div>}</td><td className="p-2">{item.marksNo || '—'}</td><td className="p-2">{item.nomenclature || '—'}</td><td className="p-2">{item.quantity !== undefined ? `${item.quantity.toLocaleString()} ${item.unit || ''}` : '—'}</td><td className="p-2">{item.grossWeight?.toLocaleString() || '—'}</td><td className="p-2">{item.value !== undefined ? `${item.valueCurrency || trackingData.application.valueCurrency || ''} ${item.value.toLocaleString()}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div> : <div className="flex flex-col items-center justify-center py-8 text-center text-[#6a7a9a]"><PackageOpen size={32} className="mb-2 text-[#9aa9c2]" /><p className="text-[13px] font-medium">No line items available</p><p className="mt-1 text-[12px]">Line items will appear here when they are provided.</p></div>}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[14px] font-medium text-[#1a2236] mb-4">Supporting Documents</div>
                    {documentsLoading ? <div className="flex flex-col items-center justify-center py-8 text-center text-[#6a7a9a]"><FileText size={32} className="mb-2 animate-pulse text-[#9aa9c2]" /><p className="text-[13px] font-medium">Loading documents...</p></div>
                      : documentsError ? <div className="flex flex-col items-center justify-center py-8 text-center text-[#9b1c1c]"><FileText size={32} className="mb-2 text-[#fca5a5]" /><p className="text-[13px] font-medium">{documentsError}</p></div>
                        : hasDocuments ? <div className="flex flex-wrap gap-3 mb-3">
                          {documentRecords.map((document) => {
                            const url = getDocumentUrl(document.fileUrl);
                            const content = <><span>{document.documentType.replace(/_/g, ' ')}</span><span className="text-[12px] text-[#6a7a9a]">{document.fileName}</span></>;
                            return url ? <a key={document.id} href={url} target="_blank" rel="noreferrer" className="border-[1.5px] flex flex-col gap-2 border-dashed border-[#3a7bd5] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#3a7bd5] bg-[#f0f7ff] text-center min-w-[140px] hover:bg-[#e4f1ff]">{content}</a>
                              : <div key={document.id} className="border-[1.5px] flex flex-col gap-2 border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[13px] text-[#4a5a7a] text-center min-w-[140px]">{content}</div>;
                          })}
                        </div> : <div className="flex flex-col items-center justify-center py-8 text-center text-[#6a7a9a]"><FileText size={32} className="mb-2 text-[#9aa9c2]" /><p className="text-[13px] font-medium">No documents available</p><p className="mt-1 text-[12px]">Uploaded documents will appear here.</p></div>}
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

function DetailField({
  label,
  value,
  wide = false,
  mono = false,
  emphasis,
}: {
  label: string;
  value?: string;
  wide?: boolean;
  mono?: boolean;
  emphasis?: 'success';
}) {
  return (
    <div className={`min-w-0 bg-white px-4 py-3 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#71809a]">{label}</dt>
      <dd className={`break-words text-[13px] font-medium ${mono ? 'font-mono text-[12px]' : ''} ${emphasis === 'success' ? 'text-[#047857]' : 'text-[#1a2236]'}`}>
        {value || '—'}
      </dd>
    </div>
  );
}
