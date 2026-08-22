'use client';

import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function VerificationInvalidPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#dc2626]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2236] mb-2">Invalid Verification Link</h1>
          <p className="text-[#6a7a9a] mb-6">
            The verification link you clicked is invalid or has been tampered with. Please request a new verification email or contact support if you believe this is an error.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="http://localhost:3000/login" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-[#1a4a8a] text-white hover:bg-[#153c70] transition-colors"
            >
              Go to Login
            </Link>
            <button 
              onClick={() => window.location.href = 'mailto:support@naccima.org'}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold border border-[#d1d5db] text-[#1a2236] hover:bg-[#f1f4f9] transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
