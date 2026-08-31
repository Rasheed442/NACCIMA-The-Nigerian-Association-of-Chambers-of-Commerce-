'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  role?: 'exporter' | 'admin' | 'vetting';
}

interface Application {
  id: string;
  status: string;
}

export default function Sidebar({ role = 'exporter' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (role === 'admin') {
        fetchAdminData();
      } else {
        fetchApplications();
      }
    }
  }, [mounted, role]);

  const getBaseApiUrl = () => {
    const rawBaseUrl = process.env.NEXT_PUBLIC_API;
    if (!rawBaseUrl) {
      return '';
    }
    return rawBaseUrl.replace(/\/+$/, '');
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return;
      }

      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        return;
      }

      // Fetch applications count
      const appsResponse = await fetch(`${baseUrl}/api/v1/admin/certificates/applications?page=0&size=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const appsResult = await appsResponse.json();
      if (appsResponse.ok && appsResult.data) {
        setApplicationsCount(appsResult.data.totalElements || 0);
      }

      // Fetch certificates count
      const certsResponse = await fetch(`${baseUrl}/api/v1/admin/certificates?page=0&size=1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const certsResult = await certsResponse.json();
      if (certsResponse.ok && certsResult.data) {
        setCertificatesCount(certsResult.data.totalElements || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return;
      }

      const baseUrl = getBaseApiUrl();
      if (!baseUrl) {
        return;
      }

      const response = await fetch(`${baseUrl}/api/v1/certificates/applications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const apps = Array.isArray(result.data) ? result.data : [result.data];
        setApplications(apps);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const allCount = role === 'admin' ? applicationsCount : applications.length;
  const pendingPaymentCount = applications.filter(app => app.status === 'PENDING_PAYMENT').length;
  const issuedCount = role === 'admin' ? certificatesCount : certificates.filter(cert => cert.status === 'ISSUED' || cert.status === 'VALID').length;

  if (!mounted) {
    return (
      <nav className="w-[200px] bg-[#f8fafd] border-r border-[#dde3ee] flex-shrink-0 py-[18px] overflow-hidden opacity-0">
        <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a]">
          <span className="w-[15px] text-center">🏠</span> Dashboard
        </div>
      </nav>
    );
  }

  const sidebarBg = role === 'admin' ? 'bg-[#f6f4fb]' : 'bg-[#f8fafd]';
  const borderColor = role === 'admin' ? 'border-[#e6e0f2]' : 'border-[#dde3ee]';
  const dashboardPath = role === 'admin' ? '/admin' : '/exporter-dashboard';
  const companyProfilePath = role === 'admin' ? '/admin/company-profiles' : '/exporter/company-profile';
  const newApplicationPath = role === 'admin' ? '/admin/new-application' : '/new-application';
  const myApplicationsPath = role === 'admin' ? '/admin/my-applications' : '/my-applications';
  const issuedCertificatesPath = role === 'admin' ? '/admin/issued-certificates' : '/issued-certs';
  const certificateTypesPath = '/admin/certificate-types';

  const renderAdminSidebar = () => (
    <>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === dashboardPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(dashboardPath)}>
        <span className=" w-[15px]  text-center">🏠</span> Dashboard
      </div>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === myApplicationsPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(myApplicationsPath)}>
        <span className="text-[13px] w-[15px] text-center">📄</span> All Applications {isLoading ? '' : <span className="ml-auto bg-[#d97706] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">{allCount}</span>}
      </div>
      <div className={`px-[16px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === issuedCertificatesPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(issuedCertificatesPath)}>
        <span className="text-[13px] w-[15px] text-center">🎖️</span> Issued Certificates {isLoading ? '' : <span className="ml-auto bg-[#059669] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">{issuedCount}</span>}
      </div>
      
      <div className="px-[16px] text-[12px] py-[3px_16px_6px] text-[9px] font-medium pt-3 text-[#8a9aba] uppercase tracking-[0.8px]">Company Management</div>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === companyProfilePath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(companyProfilePath)}>
        <span className="text-[13px] w-[15px] text-center">🏢</span> Company Profiles
      </div>
      
      <div className="px-[16px] text-[12px] py-[3px_16px_6px] text-[9px] font-medium pt-3 text-[#8a9aba] uppercase tracking-[0.8px]">Configuration</div>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === certificateTypesPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(certificateTypesPath)}>
        <span className="text-[13px] w-[15px] text-center">📋</span> Certificate Types
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">💰</span> Fee Management
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">👥</span> Staff Accounts
      </div>
      
      <div className="px-[16px] text-[12px] py-[3px_16px_6px] text-[9px] font-medium pt-3 text-[#8a9aba] uppercase tracking-[0.8px]">Reports</div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">📊</span> Analytics
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">💳</span> Payment Reports
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">📝</span> Audit Log
      </div>
    </>
  );

  const renderExporterSidebar = () => (
    <>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === dashboardPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(dashboardPath)}>
        <span className=" w-[15px]  text-center">🏠</span> Dashboard
      </div>
      <div className={`px-[16px] text-[14px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === newApplicationPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(newApplicationPath)}>
        <span className=" w-[15px] text-center">➕</span> New Application
      </div>
      <div className="px-[16px] text-[12px] pb-1 py-[3px_16px_6px] font-medium text-[#8a9aba] uppercase tracking-[0.8px] mt-2">My Applications</div>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === myApplicationsPath ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push(myApplicationsPath)}>
        <span className="text-[13px] w-[15px] text-center">📄</span> All Applications {isLoading ? '' : <span className="ml-auto bg-[#d97706] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">{allCount}</span>}
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🕐</span> Pending Payment {isLoading ? '' : <span className="ml-auto bg-[#e53e3e] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">{pendingPaymentCount}</span>}
      </div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]">
        <span className="text-[13px] w-[15px] text-center">🔍</span> Under Review
      </div>
      <div className="px-[16px] text-[12px] py-[3px_16px_6px] text-[9px] font-medium pt-3 text-[#8a9aba] uppercase tracking-[0.8px]">Certificates</div>
      <div className={`px-[16px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === '/issued-certs' ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push('/issued-certs')}>
        <span className="text-[13px] w-[15px] text-center">🎖️</span> Issued Certs {isLoading ? '' : <span className="ml-auto bg-[#059669] text-white text-[9px] font-bold px-[5px] py-[1px] rounded-[8px]">{issuedCount}</span>}
      </div>
      <div className="px-[16px] text-[12px] py-[3px_16px_6px] text-[9px] font-medium text-[#8a9aba] uppercase tracking-[0.8px] pt-3">Account</div>
      <div className="px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]" onClick={() => router.push(companyProfilePath)}>
        <span className="text-[13px] w-[15px] text-center">🏢</span> Company Profile
      </div>
      <div className={`px-[16px] text-[15px] py-[10px] flex items-center gap-2 text-[13px] cursor-pointer border-l-3 transition-all ${pathname === '/my-documents' ? 'bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold' : 'text-[#4a5a7a] border-transparent hover:bg-[#edf2ff] hover:text-[#2c4a7a]'}`} onClick={() => router.push('/my-documents')}>
        <span className="text-[13px] w-[15px] text-center">📁</span> My Documents
      </div>
    </>
  );

  return (
    <nav className={`w-[300px] relative ${sidebarBg} border-r ${borderColor} flex-shrink-0 py-[18px] overflow-y-auto opacity-100 transition-opacity duration-200`}>
      {role === 'admin' ? renderAdminSidebar() : renderExporterSidebar()}
      <div className="flex-1"></div>
      <div className="px-[16px] py-[20px] flex items-center gap-2 text-[15px] text-[#e53e3e] cursor-pointer w-full transition-all hover:bg-[#fef2f2] hover:text-[#dc2626] absolute bottom-30 border-t-1 border-[#dc2626]" onClick={() => window.dispatchEvent(new CustomEvent('open-logout-modal'))}>
        <span className="text-[15px] w-3.75 text-center">🚪</span> Log Out
      </div>
    </nav>
  );
}