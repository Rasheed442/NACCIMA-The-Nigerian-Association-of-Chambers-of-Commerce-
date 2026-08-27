'use client';

import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, message }: SuccessModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-[10px] p-6 w-full max-w-[400px] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-[16px] font-bold text-[#1a2236]">Success</div>
        </div>
        <div className="text-[12px] text-[#6a7a9a] mb-5">{message}</div>
        <div className="flex justify-end">
          <button
            className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
