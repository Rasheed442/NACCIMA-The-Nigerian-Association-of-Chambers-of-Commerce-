'use client';

import React from 'react';

interface AppHeaderProps {
  showMemberBadge?: boolean;
  memberLabel?: string;
  companyName?: string;
  companyInitials?: string;
}

export default function AppHeader({
  showMemberBadge = true,
  memberLabel = '★ MEMBER',
  companyName = 'Lagos Traders Ltd',
  companyInitials = 'LT',
}: AppHeaderProps) {
  return (
    <div className="h-[50px] bg-[#1a3a5c] flex items-center px-[20px] gap-3 flex-shrink-0">
      <div className="text-[15px] font-extrabold text-white tracking-[0.3px]">
        NACCIMA <span className="text-[#7ec8e3] text-[11px] font-normal ml-1">E-Certificate Platform</span>
      </div>
      <div className="ml-auto flex items-center gap-[14px]">
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
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-[30px] h-[30px] rounded-full bg-[#2c6ea3] flex items-center justify-center text-[11px] font-bold text-white">
            {companyInitials}
          </div>
          <span className="text-[12px] text-[#c8ddf0] font-medium">{companyName}</span>
        </div>
      </div>
    </div>
  );
}
