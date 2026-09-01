'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AppHeader from '@/components/AppHeader';
import LogoutModal from '@/components/LogoutModal';
import { ClipLoader } from 'react-spinners';
import { ChevronDown, X } from 'lucide-react';
import { apiFetch, getBaseUrl } from '@/utils/api';
import { FiPlus } from "react-icons/fi";

interface StaffAccount {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber: string;
  roleCode: string;
  roleName: string;
  enabled: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface StaffRole {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function AdminStaffAccounts() {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    roleCode: '',
    temporaryPassword: '',
  });

  useEffect(() => {
    const handleOpenLogoutModal = () => setShowLogoutModal(true);
    window.addEventListener('open-logout-modal', handleOpenLogoutModal);
    return () => window.removeEventListener('open-logout-modal', handleOpenLogoutModal);
  }, []);

  useEffect(() => {
    fetchStaffAccounts();
    fetchStaffRoles();
  }, []);

  const fetchStaffRoles = async () => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/roles/staff`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setStaffRoles(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch staff roles:', err);
    }
  };

  const fetchStaffAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/staff`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setStaffAccounts(result.data);
      } else {
        setError(result.message || 'Failed to fetch staff accounts');
      }
    } catch (err) {
      console.error('Failed to fetch staff accounts:', err);
      setError('Failed to fetch staff accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.push('/');
  };

  const handleCreate = () => {
    setSelectedStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phoneNumber: '',
      roleCode: staffRoles.length > 0 ? staffRoles[0].code : '',
      temporaryPassword: '',
    });
    setIsPanelMounted(true);
    setTimeout(() => setIsPanelOpen(true), 10);
  };

  const handleEdit = (staff: StaffAccount) => {
    setSelectedStaff(staff);
    setFormData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      username: staff.username,
      email: staff.email,
      phoneNumber: staff.phoneNumber,
      roleCode: staff.roleCode,
      temporaryPassword: '',
    });
    setIsPanelMounted(true);
    setTimeout(() => setIsPanelOpen(true), 10);
  };

  const handleCancel = () => {
    setIsPanelOpen(false);
    setTimeout(() => {
      setIsPanelMounted(false);
      setSelectedStaff(null);
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        roleCode: staffRoles.length > 0 ? staffRoles[0].code : '',
        temporaryPassword: '',
      });
    }, 300);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      if (selectedStaff) {
        // Update existing staff
        const payload = {
          userId: selectedStaff.userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          roleCode: formData.roleCode,
        };

        const response = await apiFetch(`${baseUrl}/api/v1/admin/staff/${selectedStaff.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          handleCancel();
          fetchStaffAccounts();
        } else {
          setError(result.message || 'Failed to update staff account');
        }
      } else {
        // Create new staff
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          roleCode: formData.roleCode,
          temporaryPassword: formData.temporaryPassword,
        };

        const response = await apiFetch(`${baseUrl}/api/v1/admin/staff`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          handleCancel();
          fetchStaffAccounts();
        } else {
          setError(result.message || 'Failed to create staff account');
        }
      }
    } catch (err) {
      console.error('Failed to save staff account:', err);
      setError('Failed to save staff account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (staff: StaffAccount) => {
    try {
      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError('API URL not configured');
        return;
      }

      const response = await apiFetch(`${baseUrl}/api/v1/admin/staff/${staff.userId}/status?enabled=${!staff.enabled}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        fetchStaffAccounts();
      } else {
        setError(result.message || 'Failed to toggle staff status');
      }
    } catch (err) {
      console.error('Failed to toggle staff status:', err);
      setError('Failed to toggle staff status');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return '??';
    return (firstName[0] + lastName[0]).toUpperCase();
  };

  const getAvatarColor = (firstName: string) => {
    const colors = ['#6d3bce', '#5521b5', '#1e8449', '#9ca3af'];
    const index = firstName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRoleBadgeColor = (roleCode: string) => {
    switch (roleCode) {
      case 'CERTIFICATE_OFFICER':
        return 'bg-[#e0f2fe] text-[#0369a1]';
      case 'APPROVAL_OFFICER':
        return 'bg-[#dbeafe] text-[#1e40af]';
      case 'NACCIMA_ADMIN':
        return 'bg-[#f3e8ff] text-[#7c3aed]';
      default:
        return 'bg-[#f3f4f6] text-[#374151]';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
          <AppHeader role="admin" />
          <div className="flex-1 flex overflow-hidden min-h-[560px]">
            <Sidebar role="admin" />
            <div className="flex-1 flex items-center justify-center">
              <ClipLoader size={40} color="#1a4a8a" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <AppHeader role="admin" />
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <Sidebar role="admin" />
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            <div className="flex items-center justify-between my-6">
              <div>
                <div className="text-[24px] font-medium text-[#1a2236]">Staff Accounts</div>
                <div className="text-[14px] text-[#6a7a9a]">Staff cannot self-register. Accounts are created and managed here by Admins.</div>
              </div>
              <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-[#1a4a8a] flex items-center gap-2 text-white rounded-[4px] text-[14px] font-semibold hover:bg-[#153c70]"
              >
                <FiPlus color="white"/>{" "} Create Staff Account
              </button>
            </div>

            {success && (
              <div className="mb-4 px-4 py-3 bg-[#d1fae5] text-[#065f46] rounded-[4px] text-[13px]">
                Staff account saved successfully
              </div>
            )}

            {error && (
              <div className="mb-4 px-4 py-3 bg-[#fee2e2] text-[#9b1c1c] rounded-[4px] text-[13px]">
                {error}
              </div>
            )}

            {/* Full-width Table */}
            <div className="bg-white border border-[#dde3ee] rounded shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafd] border-b border-[#dde3ee]">
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Staff Member</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Username</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Role</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Phone</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Created</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Status</th>
                    <th className="text-left px-4 py-3 text-[14px] font-medium text-[#1a2236]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffAccounts.map((staff, index) => (
                    <tr 
                      key={staff.userId}
                      className={`border-b border-[#dde3ee] hover:bg-[#f8fafd] ${!staff.enabled ? 'opacity-55' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium text-white"
                            style={{ backgroundColor: getAvatarColor(staff.firstName) }}
                          >
                            {getInitials(staff.firstName, staff.lastName)}
                          </div>
                          <span className="text-[13px] font-medium text-[#1a2236]">{staff.firstName} {staff.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-mono text-[#6a7a9a]">{staff.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${getRoleBadgeColor(staff.roleCode)}`}>
                          {staff.roleName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{staff.phoneNumber}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6a7a9a]">{formatDate(staff.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-medium px-2 py-[4px] rounded whitespace-nowrap ${staff.enabled ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fef3c7] text-[#92400e]'}`}>
                          {staff.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(staff)}
                            className="px-3 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(staff)}
                            className="px-3 py-1.5 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                          >
                            {staff.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Slide-out Panel */}
            {isPanelMounted && (
              <div className="fixed inset-0 z-50 flex justify-end">
                <div 
                  className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${isPanelOpen ? 'opacity-100' : 'opacity-0'}`}
                  onClick={handleCancel}
                />
                <div className={`relative w-[400px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[14px] font-semibold text-[#1a2236]">
                        {selectedStaff ? '✏️ Edit Staff Account' : '➕ Create Staff Account'}
                      </div>
                      <button 
                        onClick={handleCancel}
                        className="text-[#6a7a9a] hover:text-[#1a2236]"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">First Name <span className="text-[#dc2626]">*</span></label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="First name"
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Last Name <span className="text-[#dc2626]">*</span></label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Last name"
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Username <span className="text-[#dc2626]">*</span></label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="e.g. j.doe"
                        disabled={!!selectedStaff}
                        className={`w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px] font-mono ${selectedStaff ? 'bg-[#f3f4f6] cursor-not-allowed' : ''}`}
                      />
                      <div className="text-[10px] text-[#9ca3af] mt-1">Used to log in. Cannot be changed after creation.</div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Email Address <span className="text-[#dc2626]">*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="staff@naccima.org.ng"
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Phone Number <span className="text-[#dc2626]">*</span></label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="08012345678"
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Role <span className="text-[#dc2626]">*</span></label>
                      <div className="relative">
                        <select
                          name="roleCode"
                          value={formData.roleCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 pr-8 border border-[#d1d5db] rounded-[4px] text-[13px] appearance-none cursor-pointer"
                        >
                          {staffRoles.map((role) => (
                            <option key={role.code} value={role.code}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6a7a9a] pointer-events-none" />
                      </div>
                    </div>

                    {!selectedStaff && (
                      <div className="mb-3">
                        <label className="block text-[11px] text-[#6a7a9a] font-medium mb-1">Temporary Password <span className="text-[#dc2626]">*</span></label>
                        <input
                          type="password"
                          name="temporaryPassword"
                          value={formData.temporaryPassword}
                          onChange={handleInputChange}
                          placeholder="Min 8 chars"
                          className="w-full px-3 py-2 border border-[#d1d5db] rounded-[4px] text-[13px]"
                        />
                        <div className="text-[10px] text-[#9ca3af] mt-1">Staff will be prompted to change on first login.</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-[#1a4a8a] text-white rounded-[4px] text-[12px] font-medium hover:bg-[#153c70] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : selectedStaff ? 'Update Account' : 'Create Account'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 border border-[#d1d5db] rounded-[4px] text-[11px] text-[#1a2236] hover:bg-[#f3f4f9]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
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
