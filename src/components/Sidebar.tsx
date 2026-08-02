'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="w-[200px] bg-[#f8fafd] border-r border-[#dde3ee] flex-shrink-0 py-[18px] overflow-hidden opacity-0">
        <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a]">
          <span className="w-[15px] text-center">🏠</span> Dashboard
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-[200px] relative bg-[#f8fafd] border-r border-[#dde3ee] flex-shrink-0 py-[18px] overflow-hidden opacity-100 transition-opacity duration-200">
      <div className={`px-[16px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === '/exporter-dashboard' ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push('/exporter-dashboard')}>
        <span className=" w-[15px] text-center">🏠</span> Dashboard
      </div>
      <div className={`px-[16px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === '/new-application' ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push('/new-application')}>
        <span className=" w-[15px] text-center">➕</span> New Application
      </div>
      <div className="px-[16px] py-[3px_16px_6px] text-[9px] font-bold text-[#8a9aba] uppercase tracking-[0.8px]">My Applications</div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">📄</span> All Applications <span className="ml-auto bg-[#d97706] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">3</span>
      </div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🕐</span> Pending Payment <span className="ml-auto bg-[#e53e3e] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">1</span>
      </div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🔍</span> Under Review
      </div>
      <div className="px-[16px] py-[3px_16px_6px] text-[9px] font-bold text-[#8a9aba] uppercase tracking-[0.8px]">Certificates</div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🎖️</span> Issued Certs <span className="ml-auto bg-[#059669] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">23</span>
      </div>
      <div className="px-[16px] py-[3px_16px_6px] text-[9px] font-bold text-[#8a9aba] uppercase tracking-[0.8px]">Account</div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🏢</span> Company Profile
      </div>
      <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">📁</span> My Documents
      </div>
      <div className="flex-1"></div>
      <div className="px-[16px] py-[20px] flex items-center gap-2 text-[15px] text-[#e53e3e] cursor-pointer w-full transition-all hover:bg-[#fef2f2] hover:text-[#dc2626] absolute bottom-30 border-t border-[#dc2626]" onClick={() => window.dispatchEvent(new CustomEvent('open-logout-modal'))}>
        <span className="text-[15px] w-[15px] text-center">🚪</span> Log Out
      </div>
    </nav>
  );
}
