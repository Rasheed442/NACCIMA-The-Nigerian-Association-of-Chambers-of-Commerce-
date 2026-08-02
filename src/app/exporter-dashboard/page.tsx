'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export default function ExporterDashboard() {
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

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white  overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)] ">
        <div className="h-[50px] bg-[#1a3a5c] flex items-center px-[20px] gap-3 flex-shrink-0">
          <div className="text-[15px] font-extrabold text-white tracking-[0.3px]">NACCIMA <span className="text-[#7ec8e3] text-[11px] font-normal ml-1">E-Certificate Platform</span></div>
          <div className="ml-auto flex items-center gap-[14px]">
            <div className="w-[30px] h-[30px] rounded-full bg-[rgba(255,255,255,0.12)] flex items-center justify-center cursor-pointer relative text-[#cde] text-[13px]">
              🔔
              <div className="absolute top-1 right-[5px] w-[7px] h-[7px] rounded-full bg-[#f59e0b] border-[1.5px] border-[#1a3a5c]"></div>
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] bg-[#d1fae5] text-[#065f46]">★ MEMBER</span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-[30px] h-[30px] rounded-full bg-[#2c6ea3] flex items-center justify-center text-[11px] font-bold text-white">LT</div>
              <span className="text-[12px] text-[#c8ddf0] font-medium">Lagos Traders Ltd</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="text-[22px] font-bold text-[#1a2236] mb-[3px]">Welcome, Lagos Traders Ltd</div>
            <div className="text-[13px] text-[#6a7a9a] mb-[18px]">TIN: 12345678901 &nbsp;|&nbsp; Last login: Today, 10:24 AM</div>
            <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-[14px] text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
              ★ &nbsp;NACCIMA Member &nbsp;—&nbsp; Member rates apply &nbsp;|&nbsp; Valid until: 31 Dec 2026
            </div>
            <div className="flex gap-3 mb-[18px]">
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#2c5282] mb-[2px]">5</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Active Applications</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">↑ 2 new this week</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#92400e] mb-[2px]">1</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Pending Payment</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">Action required</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#1a2236] mb-[2px]">2</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Under Review</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">Avg. 2 days</div>
              </div>
              <div className="flex-1 bg-white border border-[#dde3ee] rounded-[8px] px-[14px] py-[12px] shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                <div className="text-[24px] font-extrabold text-[#065f46] mb-[2px]">23</div>
                <div className="text-[10.5px] text-[#6a7a9a] font-medium">Certificates Issued</div>
                <div className="text-[10px] text-[#059669] mt-[3px]">↑ 4 this month</div>
              </div>
            </div>
            <div className="flex items-center justify-between my-[13px]">
              <div className="text-[17px] font-medium text-[#1a2236]">Recent Applications</div>
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => router.push('/new-application')}><FaPlus color="white"/> New Application</button>
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
                  {[
                    {id:'NACC-2026-00421', type:'Certificate of Origin', dest:'United Kingdom', date:'26 Mar 2026', status:'Under Review', statusBg:'bg-[#fef3c7]', statusText:'text-[#92400e]', action:'View', actionStyle:'bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]'},
                    {id:'NACC-2026-00398', type:'GSP Certificate', dest:'Germany', date:'20 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                    {id:'NACC-2026-00380', type:'ECOWAS Free Trade', dest:'Ghana', date:'15 Mar 2026', status:'Unapproved', statusBg:'bg-[#fdf2f8]', statusText:'text-[#9d174d]', action:'Edit & Resubmit', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00341', type:'Solid Mineral', dest:'China', date:'10 Mar 2026', status:'Pending Payment', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Pay Now', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00290', type:'Movement Certificate', dest:'France', date:'01 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                    {id:'NACC-2026-00421', type:'Certificate of Origin', dest:'United Kingdom', date:'26 Mar 2026', status:'Under Review', statusBg:'bg-[#fef3c7]', statusText:'text-[#92400e]', action:'View', actionStyle:'bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]'},
                    {id:'NACC-2026-00398', type:'GSP Certificate', dest:'Germany', date:'20 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                    {id:'NACC-2026-00380', type:'ECOWAS Free Trade', dest:'Ghana', date:'15 Mar 2026', status:'Unapproved', statusBg:'bg-[#fdf2f8]', statusText:'text-[#9d174d]', action:'Edit & Resubmit', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00341', type:'Solid Mineral', dest:'China', date:'10 Mar 2026', status:'Pending Payment', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Pay Now', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00290', type:'Movement Certificate', dest:'France', date:'01 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                    {id:'NACC-2026-00421', type:'Certificate of Origin', dest:'United Kingdom', date:'26 Mar 2026', status:'Under Review', statusBg:'bg-[#fef3c7]', statusText:'text-[#92400e]', action:'View', actionStyle:'bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]'},
                    {id:'NACC-2026-00398', type:'GSP Certificate', dest:'Germany', date:'20 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                    {id:'NACC-2026-00380', type:'ECOWAS Free Trade', dest:'Ghana', date:'15 Mar 2026', status:'Unapproved', statusBg:'bg-[#fdf2f8]', statusText:'text-[#9d174d]', action:'Edit & Resubmit', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00341', type:'Solid Mineral', dest:'China', date:'10 Mar 2026', status:'Pending Payment', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Pay Now', actionStyle:'bg-[#92400e] text-white hover:bg-[#78350f]'},
                    {id:'NACC-2026-00290', type:'Movement Certificate', dest:'France', date:'01 Mar 2026', status:'Issued', statusBg:'bg-[#d1fae5]', statusText:'text-[#065f46]', action:'Download', actionStyle:'bg-[#065f46] text-white hover:bg-[#047857]'},
                  ].map((app, index) => (
                    <tr key={index} className="hover:bg-[#f8faff] uppercase">
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.id}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.type}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.dest}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle">{app.date}</td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle"><span className={`inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] whitespace-nowrap ${app.statusBg} ${app.statusText}`}>{app.status}</span></td>
                      <td className="px-[11px] py-[8px] border-b border-[#edf0f5] text-[#2a3a56] vertical-align-middle"><div className="flex gap-1"><button className={`inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all ${app.actionStyle}`}>{app.action}</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-[11px] text-[#6a7a9a]">Showing 1-5 of 25 applications</div>
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" disabled>← Previous</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white">1</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">2</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">3</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">...</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">5</button>
                <button className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-2 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-[400px] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="text-[16px] font-bold text-[#1a2236] mb-2">Confirm Logout</div>
            <div className="text-[12px] text-[#6a7a9a] mb-5">Are you sure you want to log out of your account?</div>
            <div className="flex justify-end gap-2">
              <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#e53e3e] text-white hover:bg-[#dc2626]" onClick={handleLogout}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
