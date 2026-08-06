'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';

export default function ApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [activeTab, setActiveTab] = React.useState('details');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const application = {
    id: 'NACC-2026-00421',
    certificateType: 'Certificate of Origin',
    transportMode: 'Sea',
    submitted: '26 Mar 2026',
    destination: 'United Kingdom',
    status: 'under_review',
    consignee: 'UK Commodities PLC',
    carrier: 'Maersk Line',
    fobUsd: '$5,000.00',
    fobNgn: '₦7,900,000.00',
    exchangeRate: '₦1,580/$',
    hsCode: '0901.11',
    hsDescription: 'Coffee, not roasted',
    paymentAmount: '₦12,031.88',
    paystackRef: 'NACC-PAY-2026-00422',
    paidOn: '26 Mar 2026, 11:42 AM',
    rateApplied: 'Member rate (0.11% FOB)',
  };

  const timeline = [
    { status: 'done', title: 'Application Submitted', date: '26 Mar 2026, 10:15 AM', note: null },
    { status: 'done', title: 'Payment Confirmed', date: '26 Mar 2026, 11:42 AM', note: '₦12,031.88 — Paystack' },
    { status: 'active', title: 'Under Review', date: '27 Mar 2026 (Current)', note: 'Assigned: Mrs. Adaobi Nwosu' },
    { status: 'todo', title: 'Approved / Rejected', date: 'Pending', note: null },
    { status: 'todo', title: 'Certificate Issued', date: 'Pending', note: null },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      under_review: 'bg-[#fef3c7] text-[#92400e]',
      issued: 'bg-[#e0e7ff] text-[#3730a3]',
      pending_payment: 'bg-[#dbeafe] text-[#1e40af]',
      unapproved: 'bg-[#fdf2f8] text-[#9d174d]',
    };
    const labels = {
      under_review: 'Under Review',
      issued: 'Issued',
      pending_payment: 'Pending Payment',
      unapproved: 'Unapproved',
    };
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
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

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between mb-[3px]">
              <div className="text-[16px] font-bold text-[#1a2236]">Application {application.id}</div>
              {getStatusBadge(application.status)}
            </div>
            <div className="text-[11.5px] text-[#6a7a9a] mb-5">
              {application.certificateType} &nbsp;|&nbsp; 🚢 {application.transportMode} &nbsp;|&nbsp; Submitted {application.submitted} &nbsp;|&nbsp; Destination: {application.destination}
            </div>
            
            <div className="grid grid-cols-[1fr_300px] gap-[18px]">
              <div>
                <div className="flex border-b-2 border-[#e5e7eb] mb-[14px]">
                  <button 
                    className={`px-[14px] py-[7px] text-[11.5px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'details' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('details')}
                  >
                    Application Details
                  </button>
                  <button 
                    className={`px-[14px] py-[7px] text-[11.5px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'lineitems' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('lineitems')}
                  >
                    Line Items (1)
                  </button>
                  <button 
                    className={`px-[14px] py-[7px] text-[11.5px] font-semibold cursor-pointer border-b-2 -mb-[2px] transition-all ${activeTab === 'documents' ? 'text-[#1a4a8a] border-b-[#1a4a8a]' : 'text-[#6a7a9a] border-b-transparent'}`}
                    onClick={() => setActiveTab('documents')}
                  >
                    Documents (1/3)
                  </button>
                </div>

                {activeTab === 'details' && (
                  <>
                    <div className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[6px] p-[10px] [12px] mb-[12px]">
                      <div className="text-[10px] font-bold text-[#1e40af] uppercase tracking-[0.5px] mb-[6px]">Shipment Information</div>
                      <div className="grid grid-cols-[130px_1fr] gap-[3px_10px] text-[11.5px]">
                        <span className="text-[#6a7a9a] font-medium">Consignee</span>
                        <span className="text-[#1a2236] font-semibold">{application.consignee}</span>
                        <span className="text-[#6a7a9a] font-medium">Destination</span>
                        <span className="text-[#1a2236] font-semibold">{application.destination}</span>
                        <span className="text-[#6a7a9a] font-medium">Mode of Transport</span>
                        <span className="text-[#1a2236] font-semibold">🚢 {application.transportMode}</span>
                        <span className="text-[#6a7a9a] font-medium">Carrier</span>
                        <span className="text-[#1a2236] font-semibold">{application.carrier}</span>
                        <span className="text-[#6a7a9a] font-medium">FOB Value (USD)</span>
                        <span className="text-[#1a2236] font-semibold">{application.fobUsd}</span>
                        <span className="text-[#6a7a9a] font-medium">FOB Value (NGN)</span>
                        <span className="text-[#1a2236] font-semibold">{application.fobNgn} @ {application.exchangeRate}</span>
                        <span className="text-[#6a7a9a] font-medium">HS Code</span>
                        <span className="text-[#1a2236] font-semibold font-mono text-[#1a4a8a]">{application.hsCode} — {application.hsDescription}</span>
                      </div>
                    </div>

                    <div className="bg-[#f0f7ff] border border-[#bfdbfe] rounded-[6px] p-[10px] [12px] mb-[12px]">
                      <div className="text-[10px] font-bold text-[#1e40af] uppercase tracking-[0.5px] mb-[6px]">Payment</div>
                      <div className="grid grid-cols-[130px_1fr] gap-[3px_10px] text-[11.5px]">
                        <span className="text-[#6a7a9a] font-medium">Amount Paid</span>
                        <span className="text-[#065f46] font-semibold">{application.paymentAmount}</span>
                        <span className="text-[#6a7a9a] font-medium">Paystack Ref</span>
                        <span className="text-[#1a2236] font-semibold font-mono">{application.paystackRef}</span>
                        <span className="text-[#6a7a9a] font-medium">Paid On</span>
                        <span className="text-[#1a2236] font-semibold">{application.paidOn}</span>
                        <span className="text-[#6a7a9a] font-medium">Rate Applied</span>
                        <span className="text-[#1a2236] font-semibold">{application.rateApplied}</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'lineitems' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[12.5px] font-bold text-[#1a2236] mb-4">Goods Line Items</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Description</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">QTY</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Gross Wt.</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Nomenclature</th>
                            <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-[#f8faff]">
                            <td className="px-2 py-2 border-b border-[#edf0f5]">1</td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]"><span className="font-mono font-bold text-[#1a4a8a]">{application.hsCode}</span></td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">Arabica Coffee Beans</td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">500 KG</td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">520.5 KG</td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">{application.hsDescription}</td>
                            <td className="px-2 py-2 border-b border-[#edf0f5]">{application.fobUsd}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5">
                    <div className="text-[12.5px] font-bold text-[#1a2236] mb-4">Supporting Documents</div>
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="border-[1.5px] border-dashed border-[#3a7bd5] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#3a7bd5] bg-[#f0f7ff] text-center min-w-[140px]">
                        ✅ Bill of Lading<br /><span className="text-[10px] text-[#6a7a9a]">BOL_2026.pdf — 1.2MB</span>
                      </div>
                      <div className="border-[1.5px] border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                        📎 Commercial Invoice<br /><span className="text-[10px] text-[#e53e3e]">Required ✕</span>
                      </div>
                      <div className="border-[1.5px] border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                        📎 Packing List<br /><span className="text-[10px] text-[#e53e3e]">Required ✕</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[12.5px] font-bold text-[#1a2236] mb-[10px]">Application Status</div>
                <div className="flex flex-col gap-0">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-[12px] relative">
                      {index !== timeline.length - 1 && (
                        <div className="absolute left-[10px] top-[24px] bottom-[-4px] w-[2px] bg-[#e5e7eb]"></div>
                      )}
                      {getTimelineDot(item.status)}
                      <div className="pb-[16px]">
                        <div className="text-[12px] font-semibold text-[#1a2236]">{item.title}</div>
                        <div className="text-[10px] text-[#6a7a9a] mt-[1px]">{item.date}</div>
                        {item.note && (
                          <div className="text-[11px] text-[#4a5a7a] mt-[3px] bg-[#f8faff] border-l-3 border-[#3a7bd5] p-[4px_7px] rounded-[0_4px_4px_0]">
                            {item.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/my-applications')}>
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
