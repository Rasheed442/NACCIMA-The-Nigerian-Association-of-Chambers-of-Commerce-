'use client';

import React from 'react';

interface AppHeaderProps {
  showMemberBadge?: boolean;
  memberLabel?: string;
  companyName?: string;
  companyInitials?: string;
  role?: 'exporter' | 'admin' | 'vetting';
}

export default function AppHeader({
  showMemberBadge = true,
  memberLabel = '★ MEMBER',
  companyName = 'Lagos Traders Ltd',
  companyInitials = 'LT',
  role = 'exporter',
}: AppHeaderProps) {
  const headerBg = role === 'admin' ? 'bg-[#2d1b69]' : 'bg-[#1a3a5c]';
  const roleTag = role === 'admin' ? 'Admin Panel' : role === 'vetting' ? 'Vetting' : 'E-Certificate Platform';

  return (
    <div className={`h-13.75 ${headerBg} flex items-center px-7.5 gap-3 shrink-0`}>
      <div className="flex items-end gap-2">
        <div className="text-[18px] font-extrabold text-white tracking-[0.3px]">
          NACCIMA
        </div>
        <div className="text-[12px] text-[#7ec8e3] font-normal pb-1">{roleTag}</div>
      </div>
      <div className="ml-auto flex items-center gap-[14px]">
        {role === 'admin' ?"": <div className="flex items-center gap-[14px]">
              <div className="w-[30px] h-[30px] rounded-full bg-[rgba(255,255,255,0.12)] flex items-center justify-center cursor-pointer relative text-[#cde] text-[13px]">
          🔔
          <div className="absolute top-1 right-[5px] w-[7px] h-[7px] rounded-full bg-[#f59e0b] border-[1.5px] border-[#1a3a5c]"></div>
        </div>
        {showMemberBadge && (
          <div className="flex items-center gap-[6px]">
            <span className="inline-block text-[10px] font-bold px-2 py-[2px] rounded-[10px] bg-[#d1fae5] text-[#065f46]">
              {memberLabel}
            </span>
          </div>
        )} 
        </div>}
     

        <div className="flex items-center gap-2 cursor-pointer">
          <div className={`w-8.75 h-8.75 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${role === 'admin' ? 'bg-[#7b4fb1]' : 'bg-[#2c6ea3]'}`}>
            {companyInitials}
          </div>
          <span className="text-[13px] text-[#c8ddf0]">{companyName}</span>
        </div>
      </div>
    </div>
  );
}
