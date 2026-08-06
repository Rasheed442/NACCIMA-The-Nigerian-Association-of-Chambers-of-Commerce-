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
  destination: string;
  submitted: string;
  status: 'draft' | 'submitted' | 'pending_payment' | 'under_review' | 'approved' | 'rejected' | 'issued' | 'unapproved';
}

export default function MyApplications() {
  const router = useRouter();
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

  const applications: Application[] = [
    { id: 'NACC-2026-00421', certificateType: 'Certificate of Origin', destination: 'United Kingdom', submitted: '26 Mar 2026', status: 'under_review' },
    { id: 'NACC-2026-00398', certificateType: 'GSP Certificate', destination: 'Germany', submitted: '20 Mar 2026', status: 'issued' },
    { id: 'NACC-2026-00380', certificateType: 'ECOWAS Free Trade', destination: 'Ghana', submitted: '15 Mar 2026', status: 'unapproved' },
    { id: 'NACC-2026-00341', certificateType: 'Solid Mineral', destination: 'China', submitted: '10 Mar 2026', status: 'pending_payment' },
    { id: 'NACC-2026-00290', certificateType: 'Movement Certificate', destination: 'France', submitted: '01 Mar 2026', status: 'issued' },
  ];

  const getStatusBadge = (status: Application['status']) => {
    const badges = {
      draft: 'bg-[#f3f4f6] text-[#6b7280]',
      submitted: 'bg-[#dbeafe] text-[#1e40af]',
      pending_payment: 'bg-[#dbeafe] text-[#1e40af]',
      under_review: 'bg-[#fef3c7] text-[#92400e]',
      approved: 'bg-[#d1fae5] text-[#065f46]',
      rejected: 'bg-[#fee2e2] text-[#9b1c1c]',
      issued: 'bg-[#e0e7ff] text-[#3730a3]',
      unapproved: 'bg-[#fdf2f8] text-[#9d174d]',
    };
    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      pending_payment: 'Pending Payment',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      issued: 'Issued',
      unapproved: 'Unapproved',
    };
    return (
      <span className={`inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getActionButton = (status: Application['status'], id: string) => {
    if (status === 'issued') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#065f46] text-white hover:bg-[#047857]">Download</button>;
    }
    if (status === 'pending_payment') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Pay Now</button>;
    }
    if (status === 'unapproved') {
      return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#92400e] text-white hover:bg-[#78350f]">Edit & Resubmit</button>;
    }
    return <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push(`/my-applications/${id}`)}>View</button>;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="exporter" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between mb-[13px]">
              <div className="text-[17px] font-medium text-[#1a2236]">My Applications</div>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push('/new-application')}><FiPlus color="white" size={16}/> New Application</button>
            </div>
            
            <div className="overflow-x-auto pt-4">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Approval #</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Certificate Type</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Destination</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Submitted</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Status</th>
                    <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-[#f8faff]">
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] font-mono text-[#1a4a8a]">{app.id}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5]">{app.certificateType}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5]">{app.destination}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5]">{app.submitted}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5]">{getStatusBadge(app.status)}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5]">
                        <div className="flex gap-[5px]">
                          {getActionButton(app.status, app.id)}
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
