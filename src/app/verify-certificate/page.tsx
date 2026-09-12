'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Search as SearchIcon } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { format } from 'date-fns';

interface VerificationResult {
  valid: boolean;
  status: string;
  certificateNumber: string;
  certificateType: string;
  issuedAt: string;
  shipperName: string;
  consignee: string;
  destinationCountry: string;
  destinationPort: string;
}

export default function VerifyCertificatePage() {
  const router = useRouter();
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        throw new Error('API base URL is not configured');
      }

      const response = await apiFetch(`${baseUrl}/api/v1/public/certificates/verify?certificateNumber=${encodeURIComponent(certificateNumber)}`);
      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setResult(data.data);
      } else {
        setError(data?.message || 'Failed to verify certificate. Please check the certificate number and try again.');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Failed to verify certificate. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfe]">
      {/* Header */}
      <div className="bg-[#1a3a5c] h-[50px] flex items-center px-5">
        <div className="text-[15px] font-bold text-white">
          NACCIMA <span className="text-[11px] font-normal text-[#7ec8e3] ml-1">Certificate Verification</span>
        </div>
        <div className="ml-auto text-[11.5px] text-[#7ec8e3]">
          Public — No login required
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[680px] mx-auto px-5 py-8">
        <div className="text-center mb-6">
          <div className="text-[17px] font-bold text-[#1a2236] mb-1">Certificate Authenticity Verification</div>
          <div className="text-[12px] text-[#6a7a9a]">Enter a certificate number to confirm its validity and authenticity</div>
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter certificate number — e.g. CO/2026/00398"
            className="flex-1 px-3 py-2 border border-[#d1d5db] rounded text-[14px] font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent"
            disabled={loading}
          />
          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-5 py-2 bg-[#1a4a8a] text-white text-[13px] font-semibold rounded hover:bg-[#153c70] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#991b1b]">
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Valid Certificate Result */}
        {result && result.valid && (
          <div className="border-2 border-[#065f46] rounded-lg overflow-hidden mb-4">
            <div className="bg-[#065f46] px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <div>
                <div className="text-[14px] font-bold text-white">VALID CERTIFICATE</div>
                <div className="text-[11px] text-[#a7f3d0]">This certificate is authentic and currently valid</div>
              </div>
            </div>
            <div className="p-4 bg-[#f0fdf4]">
              <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3 text-[11.5px]">
                <div className="text-[#6a7a9a] font-medium">Certificate Number</div>
                <div className="text-[#1a2236] font-semibold font-mono">{result.certificateNumber}</div>
                
                <div className="text-[#6a7a9a] font-medium">Certificate Type</div>
                <div className="text-[#1a2236] font-semibold">{result.certificateType}</div>
                
                <div className="text-[#6a7a9a] font-medium">Shipper Name</div>
                <div className="text-[#1a2236] font-semibold">{result.shipperName}</div>
                
                <div className="text-[#6a7a9a] font-medium">Consignee</div>
                <div className="text-[#1a2236] font-semibold">{result.consignee}</div>
                
                <div className="text-[#6a7a9a] font-medium">Destination Country</div>
                <div className="text-[#1a2236] font-semibold">{result.destinationCountry}</div>
                
                <div className="text-[#6a7a9a] font-medium">Destination Port</div>
                <div className="text-[#1a2236] font-semibold">{result.destinationPort}</div>
                
                <div className="text-[#6a7a9a] font-medium">Issue Date</div>
                <div className="text-[#1a2236] font-semibold">{format(new Date(result.issuedAt), 'dd MMM yyyy')}</div>
                
                <div className="text-[#6a7a9a] font-medium">Issued By</div>
                <div className="text-[#1a2236] font-semibold">NACCIMA — Nigerian Association of Chambers of Commerce</div>
              </div>
            </div>
          </div>
        )}

        {/* Invalid Certificate Result */}
        {result && !result.valid && (
          <div className="border-2 border-[#9b1c1c] rounded-lg overflow-hidden mb-4">
            <div className="bg-[#9b1c1c] px-4 py-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-white" />
              <div>
                <div className="text-[14px] font-bold text-white">{result.status === 'REVOKED' ? 'REVOKED CERTIFICATE' : 'INVALID CERTIFICATE'}</div>
                <div className="text-[11px] text-[#fecaca]">
                  {result.status === 'REVOKED' 
                    ? 'This certificate has been revoked and is no longer valid' 
                    : 'This certificate number is not valid or does not exist'}
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#fff5f5]">
              <div className="grid grid-cols-[160px_1fr] gap-y-2 gap-x-3 text-[11.5px]">
                <div className="text-[#6a7a9a] font-medium">Certificate Number</div>
                <div className="text-[#1a2236] font-semibold font-mono">{result.certificateNumber}</div>
                
                <div className="text-[#6a7a9a] font-medium">Status</div>
                <div className="text-[#1a2236] font-semibold">{result.status}</div>
                
                {result.issuedAt && (
                  <>
                    <div className="text-[#6a7a9a] font-medium">Original Issue Date</div>
                    <div className="text-[#1a2236] font-semibold">{format(new Date(result.issuedAt), 'dd MMM yyyy')}</div>
                  </>
                )}
              </div>
              
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#fca5a5] bg-[#fff5f5] px-3 py-2.5 text-[12px] text-[#9b1c1c]">
                <XCircle className="w-4 h-4" />
                <span>
                  Do not accept this certificate. Contact NACCIMA if you believe this is in error: <strong>certificates@naccima.com</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-[11px] text-[#9ca3af]">
          For enquiries: <span className="text-[#3a7bd5]">certificates@naccima.com</span> &nbsp;|&nbsp; Powered by NACCIMA E-Certificate Platform
        </div>
      </div>
    </div>
  );
}