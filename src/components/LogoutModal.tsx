'use client';

import React from 'react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded p-6 w-full max-w-[400px] shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
        <div className="text-[18px] font-semibold text-[#1a2236] mb-2">Confirm Logout</div>
        <div className="text-[13px] text-[#6a7a9a] mb-5">Are you sure you want to log out of your account?</div>
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex items-center gap-1 px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer border border-[#ccd3e0] transition-all bg-white text-[#2a3a56] hover:bg-[#f1f4f9]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#e53e3e] text-white hover:bg-[#dc2626]"
            onClick={onConfirm}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
