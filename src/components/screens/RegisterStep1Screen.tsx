'use client';
import { FaArrowLeft } from "react-icons/fa6";

import React from 'react';

interface RegisterStep1ScreenProps {
  onBackToLogin: () => void;
  onContinue: () => void;
}

export default function RegisterStep1Screen({ onBackToLogin, onContinue }: RegisterStep1ScreenProps) {
  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[6px]">Company Registration</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Your TIN is your identity on this platform</div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-[10px] items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-[#1a4a8a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</div>
              <div className="text-[11.5px] text-[#c8dce8]"><strong className="text-white">Enter your TIN</strong> — we verify it with the Nigeria Revenue Service (NRS) API</div>
            </div>
            <div className="flex gap-[10px] items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-[#1e2e45] text-[#5a7a9a] text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</div>
              <div className="text-[11.5px] text-[#5a7a9a]">Confirm your company details retrieved from NRS</div>
            </div>
            <div className="flex gap-[10px] items-start">
              <div className="w-[22px] h-[22px] rounded-full bg-[#1e2e45] text-[#5a7a9a] text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</div>
              <div className="text-[11.5px] text-[#5a7a9a]">Set your email and password to complete registration</div>
            </div>
          </div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Step 1 of 3 — Verify your TIN</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">We will retrieve your company details from the NRS</div>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-[11px] font-semibold text-[#374151]">Tax Identification Number (TIN) <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white font-mono text-[14px] tracking-[1.5px] focus:outline-none focus:border-[#3a7bd5] focus:shadow-[0_0_0_2px_rgba(58,123,213,0.15)]" type="text" placeholder="e.g. 12345678901" />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">11-digit number issued by the Nigeria Revenue Service (NRS)</div>
          </div>

          <div className="bg-[#f0fdf4] border border-[#86efac] rounded-[7px] p-[14px] mb-3">
            <div className="text-[11px] font-bold text-[#065f46] mb-2 flex items-center gap-1">✅ TIN Verified — NRS Record Found</div>
            <div className="grid grid-cols-[120px_1fr] gap-1 gap-x-2 text-[11.5px]">
              <span className="text-[#6b7280] font-medium">Registered Name</span><span className="text-[#065f46] font-bold">Lagos Traders Ltd</span>
              <span className="text-[#6b7280] font-medium">Registered Address</span><span className="text-[#065f46] font-bold">14 Commerce Road, Apapa, Lagos State</span>
              <span className="text-[#6b7280] font-medium">TIN</span><span className="text-[#065f46] font-bold font-mono">12345678901</span>
            </div>
            <div className="text-[10.5px] text-[#065f46] mt-2">These details will be stored in your company profile and pre-filled (read-only) on all certificate applications.</div>
          </div>

          <div className="rounded-[7px] p-[10px_13px] text-[12px] mb-3 flex gap-2 items-start bg-[#eff6ff] border border-[#93c5fd] text-[#1e40af]">
            <span>ℹ️</span>
            <span>If the NRS API is unavailable, registration cannot proceed. Please try again later.</span>
          </div>

          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-3.5 py-1.75 rounded text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={onBackToLogin}>
              <FaArrowLeft color="#1a4a8a" /> Back to Login
            </button>
            <button className="inline-flex items-center justify-center gap-1 px-3.5 py-1.75 rounded text-[14px] font-medium cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70]" onClick={onContinue}>Confirm &amp; Continue →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
