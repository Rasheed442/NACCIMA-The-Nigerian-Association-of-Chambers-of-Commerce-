'use client';

import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function VerificationAlreadyUsedPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
      <div className="max-w-md w-full px-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[#e0e7ff] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#4338ca]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2236] mb-2">Already Verified</h1>
          <p className="text-[#6a7a9a] mb-6">
            This verification link has already been used. Your email has been successfully verified and you can now log in to your account.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="http://localhost:3000/login" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-semibold bg-[#1a4a8a] text-white hover:bg-[#153c70] transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
