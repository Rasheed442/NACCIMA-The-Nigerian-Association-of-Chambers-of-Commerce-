'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface RegisterStep2ScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function RegisterStep2Screen({ onBack, onComplete }: RegisterStep2ScreenProps) {
    const router = useRouter();
  
  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[6px]">Almost There</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Set your login credentials</div>
          <div className="bg-[rgba(255,255,255,.07)] border border-[rgba(255,255,255,.15)] rounded-[7px] p-[14px] mb-3">
            <div className="text-[10px] font-bold text-[#7ab8dc] uppercase tracking-[0.5px] mb-[6px]">✅ NRS-Verified Company</div>
            <div className="text-[12px] font-bold text-white">Lagos Traders Ltd</div>
            <div className="text-[11px] text-[#7ab8dc] mt-[2px] font-mono">TIN: 12345678901</div>
          </div>
          <div className="text-[11px] text-[#5a7a9a] mt-3 leading-relaxed">Your TIN will be your username for all future logins. Keep it safe.</div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Step 2 of 2 — Create Your Account</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">Set your contact email and password</div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Contact Email Address <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" placeholder="company@example.com" />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">A verification link will be sent here. Used for notifications.</div>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Phone Number</label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" placeholder="+234 800 000 0000" />
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Password <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" />
          </div>
          <div className="flex flex-col gap-1 mb-[18px]">
            <label className="text-[11px] font-semibold text-[#374151]">Confirm Password <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" type="password" placeholder="Re-enter password" />
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={onBack}>← Back</button>
            <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70]" onClick={() => router.push('/exporter-dashboard')}>Create Account &amp; Verify Email</button>
          </div>
          <div className="text-[10.5px] text-[#9ca3af] mt-[10px] text-center">By registering, you confirm the company details are accurate and that you are authorised to act on behalf of this company.</div>
        </div>
      </div>
    </div>
  );
}
