'use client';

import React from 'react';

interface NavbarProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

export default function Navbar({ activeScreen, onScreenChange }: NavbarProps) {
  return (
    <aside id="meta-nav">
      <div className="logo">
        <div className="l1">NACCIMA</div>
        <div className="l2">UI/UX Wireframes v2.2</div>
      </div>

      <div className="nav-group">
        <div className="nav-group-title">Auth</div>
        <div className={`nav-item ${activeScreen === 's-login' ? 'active' : ''}`} onClick={() => onScreenChange('s-login')}>🔐 Login (TIN-based)</div>
        <div className={`nav-item ${activeScreen === 's-register-1' ? 'active' : ''}`} onClick={() => onScreenChange('s-register-1')}>📝 Register — Step 1: TIN</div>
        <div className={`nav-item ${activeScreen === 's-register-2' ? 'active' : ''}`} onClick={() => onScreenChange('s-register-2')}>📝 Register — Step 2: Account</div>
      </div>
      <div className="nav-sep"></div>
      <div className="nav-group">
        <div className="nav-group-title">Exporter Flow</div>
        <div className={`nav-item ${activeScreen === 's-exporter-home' ? 'active' : ''}`} onClick={() => onScreenChange('s-exporter-home')}>🏠 Exporter Dashboard</div>
        <div className={`nav-item ${activeScreen === 's-cert-select' ? 'active' : ''}`} onClick={() => onScreenChange('s-cert-select')}>① Select Cert Type</div>
        <div className={`nav-item ${activeScreen === 's-app-form' ? 'active' : ''}`} onClick={() => onScreenChange('s-app-form')}>② Application Form</div>
        <div className={`nav-item ${activeScreen === 's-app-review' ? 'active' : ''}`} onClick={() => onScreenChange('s-app-review')}>③ Review & Submit</div>
        <div className={`nav-item ${activeScreen === 's-payment' ? 'active' : ''}`} onClick={() => onScreenChange('s-payment')}>④ Payment</div>
        <div className={`nav-item ${activeScreen === 's-tracking' ? 'active' : ''}`} onClick={() => onScreenChange('s-tracking')}>📋 App. Tracking</div>
        <div className={`nav-item ${activeScreen === 's-resubmit' ? 'active' : ''}`} onClick={() => onScreenChange('s-resubmit')}>🔄 Resubmit (Unapproved)</div>
      </div>
      <div className="nav-sep"></div>
      <div className="nav-group">
        <div className="nav-group-title">Vetting Staff</div>
        <div className={`nav-item ${activeScreen === 's-vetting-queue' ? 'active' : ''}`} onClick={() => onScreenChange('s-vetting-queue')}>📥 Vetting Queue</div>
        <div className={`nav-item ${activeScreen === 's-vetting-review' ? 'active' : ''}`} onClick={() => onScreenChange('s-vetting-review')}>🔍 Review Application</div>
      </div>
      <div className="nav-sep"></div>
      <div className="nav-group">
        <div className="nav-group-title">Admin Panel</div>
        <div className={`nav-item ${activeScreen === 's-admin-dash' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-dash')}>📊 Dashboard</div>
        <div className={`nav-item ${activeScreen === 's-admin-companies' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-companies')}>🏢 Company Profiles</div>
        <div className={`nav-item ${activeScreen === 's-admin-company-detail' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-company-detail')}>👤 Company Detail + Membership</div>
        <div className={`nav-item ${activeScreen === 's-admin-staff' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-staff')}>👥 Staff Accounts</div>
        <div className={`nav-item ${activeScreen === 's-admin-fees' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-fees')}>💰 Fee Management</div>
        <div className={`nav-item ${activeScreen === 's-admin-certs' ? 'active' : ''}`} onClick={() => onScreenChange('s-admin-certs')}>⚙️ Certificate Config</div>
      </div>
      <div className="nav-sep"></div>
      <div className="nav-group">
        <div className="nav-group-title">Public</div>
        <div className={`nav-item ${activeScreen === 's-cert-verify' ? 'active' : ''}`} onClick={() => onScreenChange('s-cert-verify')}>🔎 Certificate Verification</div>
      </div>
    </aside>
  );
}
