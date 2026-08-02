'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const router = useRouter();

  const handleLogin = () => {
    onLogin();
    localStorage.setItem('showWelcomeToast', 'true');
    router.push('/exporter-dashboard');
  };
  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[5px]">NACCIMA</div>
          <div className="text-[14px] text-[#7ab8dc] mb-6 font-medium">E-Certificate Platform</div>
          <div className="text-[14px] text-[#aac8e0] leading-relaxed mb-6">Apply for, track and receive your<br/>official NACCIMA export certificates.<br/><br/>All five certificate types — in one place.</div>
          <div className="flex flex-col gap-[7px]">
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Certificate of Origin (COO) &amp; GSP</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ ECOWAS &amp; Movement Certificates</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Solid Mineral Certificate</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Paystack-powered secure payments</div>
            <div className="flex items-center gap-2 text-[15px] text-[#7ab8dc]">✅ Member &amp; Non-Member fee rates</div>
          </div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Sign in to your account</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-[22px]">Use your company TIN as your username</div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">TIN (Tax Identification Number) <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white tracking-widest font-mono text-[13px] focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" type="text" placeholder="e.g. 12345678901" maxLength={11} />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">Your 11-digit NRS-issued Tax Identification Number</div>
          </div>
          <div className="flex flex-col gap-1 mb-[6px]">
            <label className="text-[11px] font-semibold text-[#374151]">Password <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" type="password" placeholder="••••••••" />
          </div>
          <div className="text-right text-[11px] text-[#3a7bd5] mb-4 cursor-pointer">Forgot password?</div>
          <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[10px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white w-full mb-[14px] hover:bg-[#153c70]" onClick={handleLogin}>Sign In</button>
          <div className="text-center text-[11.5px] text-[#6a7a9a]">
            New exporter? <span className="text-[#3a7bd5] font-semibold cursor-pointer" onClick={onNavigateToRegister}>Register your company →</span>
          </div>
          <div className="mt-[18px] pt-[14px] border-t border-[#f0f0f0]">
            <div className="text-[10.5px] text-[#9ca3af] text-center mb-2">— NACCIMA Staff / Admin login —</div>
            <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] w-full hover:bg-[#f1f4f9] text-[11.5px]">🏢 Login as NACCIMA Staff / Admin</button>
          </div>
        </div>
      </div>
    </div>
  );
}
