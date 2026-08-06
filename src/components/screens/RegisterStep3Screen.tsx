'use client';

import React from 'react';

interface RegisterStep3ScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export default function RegisterStep3Screen({ onBack, onComplete }: RegisterStep3ScreenProps) {
  return (
    <div className="h-screen w-full">
      <div className="h-screen w-full grid grid-cols-2">
        <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f2240] pb-30 px-[34px] flex flex-col justify-center">
          <div className="text-[34px] font-extrabold text-white mb-[6px]">One Last Step</div>
          <div className="text-[14px] text-[#7ab8dc] mb-5 font-medium">Add your contact person details</div>
          <div className="bg-[rgba(255,255,255,.07)] border border-[rgba(255,255,255,.15)] rounded-[7px] p-[14px] mb-3">
            <div className="text-[10px] font-bold text-[#7ab8dc] uppercase tracking-[0.5px] mb-[6px]">Contact Person</div>
            <div className="text-[12px] font-bold text-white">Primary Registration Contact</div>
            <div className="text-[11px] text-[#7ab8dc] mt-[2px] font-mono">This person will receive verification emails and support notices.</div>
          </div>
          <div className="text-[11px] text-[#5a7a9a] mt-3 leading-relaxed">Provide a direct contact who can respond to registration and certificate queries.</div>
        </div>
        <div className="px-[34px] flex flex-col justify-center bg-white">
          <div className="text-[24px] font-bold text-[#1a2236] mb-[3px]">Step 3 of 3 — Contact Person</div>
          <div className="text-[11.5px] text-[#6a7a9a] mb-5">Enter the contact details for the person responsible for this account.</div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#374151]">First Name <span className="text-[#e53e3e]">*</span></label>
              <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="First name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[#374151]">Last Name <span className="text-[#e53e3e]">*</span></label>
              <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Last name" />
            </div>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Designation <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Position or role" />
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-[11px] font-semibold text-[#374151]">Phone Number <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="e.g. +234 800 000 0000" />
          </div>
          <div className="flex flex-col gap-1 mb-[18px]">
            <label className="text-[11px] font-semibold text-[#374151]">Email Address <span className="text-[#e53e3e]">*</span></label>
            <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" type="email" placeholder="contact@example.com" />
            <div className="text-[10px] text-[#6b7280] mt-[2px]">This email is used for verification and notifications.</div>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={onBack}>← Back</button>
            <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white flex-1 hover:bg-[#153c70]" onClick={onComplete}>Complete Registration</button>
          </div>
          <div className="text-[10.5px] text-[#9ca3af] mt-[10px] text-center">By continuing, you confirm this contact person is authorised to receive registration emails and support information.</div>
        </div>
      </div>
    </div>
  );
}
