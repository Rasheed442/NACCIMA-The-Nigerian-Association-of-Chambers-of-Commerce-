'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, FileText } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { apiFetch, getBaseUrl } from '@/utils/api';

interface Goods {
  id: string;
  hsCode?: string;
  hsDescription?: string;
  marksNo?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  grossWeight?: number;
  nomenclature?: string;
  value?: number;
  valueCurrency?: string;
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  uploadedAt?: string;
}

interface ReviewData {
  application: {
    id: string;
    certificateType?: string;
    status?: string;
    tin?: string;
    shipperName?: string;
    shipperAddress?: string;
    importerEmail?: string;
    consignee?: string;
    consigneeAddress?: string;
    carrier?: string;
    modeOfTransport?: string;
    destinationCountry?: string;
    destinationPort?: string;
    countryOfMfg?: string;
    totalItems?: number;
    totalValueFob?: number;
    valueCurrency?: string;
    bulkQtyMt?: number;
    goods?: Goods[];
  };
  documents?: Document[];
  membershipStatus?: string;
  validationErrors?: string[];
  canSubmit?: boolean;
}

const labelize = (value?: string) => value?.replace(/_/g, ' ') || '—';

export default function ApplicationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const openLogout = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', openLogout);
    return () => window.removeEventListener('open-logout-modal', openLogout);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadReview = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getBaseUrl();
        if (!baseUrl) throw new Error('API URL not configured');

        const response = await apiFetch(`${baseUrl}/api/v1/certificates/applications/${applicationId}/review`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();

        if (cancelled) return;
        if (!response.ok || !result.data) {
          setError(result.message || 'Failed to load application review.');
          return;
        }
        setData(result.data);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load application review:', err);
          setError(err instanceof Error ? err.message : 'Failed to load application review.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (applicationId) void loadReview();
    return () => { cancelled = true; };
  }, [applicationId]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const app = data?.application;
  const goods = app?.goods || [];
  const documents = data?.documents || [];

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <main className="flex-1 px-[22px] py-[20px] overflow-auto">
            <button
              className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-[#1a4a8a] hover:text-[#153c70]"
              onClick={() => router.push('/my-applications')}
            >
              <ArrowLeft size={16} /> Back to Applications
            </button>

            {loading && <div className="py-10 text-center text-[#6a7a9a]">Loading application review...</div>}

            {!loading && error && (
              <div className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] p-4 text-[13px] text-[#b91c1c]">{error}</div>
            )}

            {!loading && data && app && (
              <div className="max-w-[1200px] pb-8">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-[20px] font-semibold text-[#1a2236]">Application Review</h1>
                    <p className="mt-1 text-[12px] text-[#6a7a9a]">{app.certificateType || 'Certificate'} · {app.id}</p>
                  </div>
                  <span className="rounded bg-[#e0e7ff] px-2 py-1 text-[12px] font-semibold text-[#3730a3]">{labelize(app.status)}</span>
                </div>

                {data.validationErrors && data.validationErrors.length > 0 && (
                  <section className="mb-4 rounded-[6px] border border-[#fde68a] bg-[#fffbeb] p-4">
                    <h2 className="text-[13px] font-semibold text-[#92400e]">Review notes</h2>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-[#92400e]">
                      {data.validationErrors.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                    </ul>
                  </section>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <ReviewCard title="Exporter & shipment details">
                    <Details rows={[
                      ['Shipper', app.shipperName], ['Shipper address', app.shipperAddress], ['TIN', app.tin],
                      ['Consignee', app.consignee], ['Consignee address', app.consigneeAddress], ['Importer email', app.importerEmail],
                      ['Destination', app.destinationCountry], ['Destination port', app.destinationPort], ['Country of manufacture', app.countryOfMfg],
                    ]} />
                  </ReviewCard>
                  <ReviewCard title="Transport & value">
                    <Details rows={[
                      ['Transport mode', labelize(app.modeOfTransport)], ['Carrier', app.carrier], ['Total items', app.totalItems?.toLocaleString()],
                      ['FOB value', app.totalValueFob !== undefined ? `${app.valueCurrency || 'USD'} ${app.totalValueFob.toLocaleString()}` : undefined],
                      ['Bulk quantity', app.bulkQtyMt !== undefined ? `${app.bulkQtyMt.toLocaleString()} MT` : undefined], ['Membership', labelize(data.membershipStatus)],
                    ]} />
                  </ReviewCard>
                </div>

                <ReviewCard title={`Goods (${goods.length})`} className="mt-4">
                  {goods.length === 0 ? <Empty text="No goods listed." /> : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-[12px]">
                        <thead className="bg-[#f1f4f9] text-[#4a5a7a]"><tr><th className="p-2">HS Code</th><th className="p-2">Description</th><th className="p-2">Marks No.</th><th className="p-2">Qty</th><th className="p-2">Gross weight</th><th className="p-2">Value</th></tr></thead>
                        <tbody>{goods.map((item) => <tr key={item.id} className="border-t border-[#edf0f5]"><td className="p-2 font-mono">{item.hsCode || '—'}</td><td className="p-2">{item.description || item.hsDescription || '—'}</td><td className="p-2">{item.marksNo || '—'}</td><td className="p-2">{item.quantity !== undefined ? `${item.quantity.toLocaleString()} ${item.unit || ''}` : '—'}</td><td className="p-2">{item.grossWeight?.toLocaleString() || '—'}</td><td className="p-2">{item.value !== undefined ? `${item.valueCurrency || app.valueCurrency || 'USD'} ${item.value.toLocaleString()}` : '—'}</td></tr>)}</tbody>
                      </table>
                    </div>
                  )}
                </ReviewCard>

                <ReviewCard title={`Documents (${documents.length})`} className="mt-4">
                  {documents.length === 0 ? <Empty text="No documents uploaded." /> : <div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#e5e7eb] px-3 py-2"><div className="flex min-w-0 items-center gap-2"><FileText size={17} className="shrink-0 text-[#1a4a8a]" /><div><div className="text-[12px] font-medium text-[#1a2236]">{document.fileName}</div><div className="text-[11px] text-[#6a7a9a]">{labelize(document.documentType)}</div></div></div>{document.fileUrl && <a className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1a4a8a] hover:underline" href={document.fileUrl} target="_blank" rel="noreferrer">Open <ExternalLink size={13} /></a>}</div>)}</div>}
                </ReviewCard>
              </div>
            )}
          </main>
        </div>
      </div>
      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}

function ReviewCard({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
  return <section className={`rounded-[6px] border border-[#dde3ee] bg-white p-4 ${className}`}><h2 className="mb-3 text-[13px] font-semibold text-[#1a2236]">{title}</h2>{children}</section>;
}

function Details({ rows }: { rows: Array<[string, string | number | undefined]> }) {
  return <dl className="grid grid-cols-[145px_1fr] gap-x-3 gap-y-2 text-[12px]">{rows.map(([label, value]) => <React.Fragment key={label}><dt className="text-[#6a7a9a]">{label}</dt><dd className="break-words font-medium text-[#1a2236]">{value || '—'}</dd></React.Fragment>)}</dl>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-3 text-[12px] text-[#6a7a9a]">{text}</div>;
}
