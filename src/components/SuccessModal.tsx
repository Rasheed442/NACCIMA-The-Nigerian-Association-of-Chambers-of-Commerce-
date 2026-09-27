'use client';

import React, { useEffect, useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
  autoCloseDelay?: number;
}

export default function SuccessModal({ isOpen, onClose, message, title = 'Success', autoCloseDelay = 3000 }: SuccessModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 300); // Wait for zoom-out animation to complete
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoCloseDelay]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] ${isClosing ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-200'}`}>
      <div className={`bg-white rounded-md p-8 w-full max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] ${isClosing ? 'animate-out zoom-out-95 duration-300' : 'animate-in zoom-in-95 duration-200'}`}>
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(34,197,94,0.2)]">
            <span className="text-3xl">✅</span>
          </div>
          <div className="text-[20px] font-semibold text-[#1a2236] mb-2">{title}</div>
          <div className="text-[14px] text-[#6a7a9a] leading-relaxed">{message}</div>
        </div>
        
      </div>
    </div>
  );
}
