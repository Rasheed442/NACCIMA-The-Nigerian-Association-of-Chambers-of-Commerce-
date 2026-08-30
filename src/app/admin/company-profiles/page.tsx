'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ChevronDown } from 'lucide-react';
import { ClipLoader } from 'react-spinners';
import { apiFetch, getBaseUrl } from '@/utils/api';
import Dropdown from '@/components/Dropdown';

interface Company {
  id: string;
  tin: string;
  companyName: string;
  email: string;
  applications: number;
  membershipStatus: 'NON_MEMBER' | 'MEMBER';
  active: boolean;
}

export default function AdminCompanyProfiles() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMembership, setFilterMembership] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [membershipDropdownOpen, setMembershipDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [currentPage, searchQuery, filterMembership, filterStatus]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      
      if (searchQuery) params.append('search', searchQuery);
      if (filterMembership) params.append('membershipStatus', filterMembership);
      if (filterStatus) params.append('active', filterStatus);

      const response = await apiFetch(`${baseUrl}/api/v1/admin/companies?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const comps = Array.isArray(result.data.content) ? result.data.content : [result.data.content];
        setCompanies(comps);
        setTotalPages(result.data.totalPages || 0);
      } else {
        setError(result.message || 'Failed to fetch companies');
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getMembershipBadge = (status: Company['membershipStatus']) => {
    if (status === 'MEMBER') {
      return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Member ★</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#f3f4f6] text-[#6b7280]">Non-Member</span>;
  };

  const getStatusBadge = (active: boolean) => {
    if (active) {
      return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#d1fae5] text-[#065f46]">Active</span>;
    }
    return <span className="inline-block text-[14px] font-medium px-2 py-[4px] rounded whitespace-nowrap bg-[#fee2e2] text-[#9b1c1c]">Inactive</span>;
  };

  const handleViewCompany = (companyId: string) => {
    router.push(`/admin/company-profiles/${companyId}`);
  };

  const handleManageCompany = (companyId: string) => {
    // TODO: Update this route once the manage page is created
    router.push(`/admin/company-profiles/${companyId}/manage`);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="mb-4">
              <div className="text-[20px] font-medium text-[#1a2236]">Company Profiles</div>
              <div className="text-[12px] text-[#6a7a9a]">Manage registered companies and their memberships</div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* Membership Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[140px]"
                  onClick={() => setMembershipDropdownOpen(!membershipDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterMembership === '' ? 'All Membership' : filterMembership === 'MEMBER' ? 'Member' : 'Non-Member'}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {membershipDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[140px]">
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterMembership(''); setMembershipDropdownOpen(false); }}
                    >
                      All Membership
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterMembership('MEMBER'); setMembershipDropdownOpen(false); }}
                    >
                      Member
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterMembership('NON_MEMBER'); setMembershipDropdownOpen(false); }}
                    >
                      Non-Member
                    </div>
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="relative">
                <button 
                  className="flex items-center gap-2 px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] bg-white min-w-[120px]"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                >
                  <span className="flex-1 text-left">
                    {filterStatus === '' ? 'All Status' : filterStatus === 'true' ? 'Active' : 'Inactive'}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {statusDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] rounded-[4px] shadow-lg z-10 min-w-[120px]">
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus(''); setStatusDropdownOpen(false); }}
                    >
                      All Status
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('true'); setStatusDropdownOpen(false); }}
                    >
                      Active
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-[#f1f4f9] cursor-pointer text-[12px]"
                      onClick={() => { setFilterStatus('false'); setStatusDropdownOpen(false); }}
                    >
                      Inactive
                    </div>
                  </div>
                )}
              </div>

              <input 
                type="text" 
                placeholder="Search by company name, TIN, or email..."
                className="px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[12px] flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70]">
                Filter
              </button>
            </div>

            <div className="overflow-x-auto pt-4 overflow-y-auto rounded-lg border border-[#dde3ee]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipLoader size={40} color="#1a4a8a" />
                  <div className="text-[#6a7a9a] mt-3">Loading companies...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-[#e53e3e]">{error}</div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 text-[#6a7a9a]">No companies found</div>
              ) : (
                <table className="w-full border-collapse text-[12px]">
                  <thead className="sticky top-0 z-2">
                    <tr className="bg-[#f1f4f9] text-[12px] text-[#4a5a7a] font-semibold">
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">TIN</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Company Name</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Email</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Applications</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Membership</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Member Until</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Account</th>
                      <th className="px-[11px] py-[8px] text-left border-b-2 border-[#dde3ee] whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="hover:bg-[#f8faff] text-[12px] transition-colors">
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap font-mono text-[#1a4a8a]">{company.tin}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{company.companyName}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{company.email}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{company.applications}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getMembershipBadge(company.membershipStatus)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap text-[#6a7a9a]">—</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">{getStatusBadge(company.active)}</td>
                        <td className="px-[11px] py-[10px] border-b border-[#edf0f5] whitespace-nowrap">
                          <Dropdown
                            trigger={
                              <button className="inline-flex items-center gap-1 px-[9px] py-[5px] rounded-[6px] text-[14px] font-medium cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">
                                Actions <ChevronDown size={14} />
                              </button>
                            }
                            options={[
                              { label: 'View', onClick: () => handleViewCompany(company.id) },
                              { label: 'Manage', onClick: () => handleManageCompany(company.id) }
                            ]}
                            align="right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {companies.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-[11px] text-[#6a7a9a]">
                  Page {currentPage + 1} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Prev
                  </button>
                  <button 
                    className="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9] disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={handleLogout} />
    </div>
  );
}
