'use client';

import React, { useState } from 'react';

interface DashboardScreenProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
}

export default function DashboardScreen({ activeScreen, onScreenChange }: DashboardScreenProps) {
  const [selectedCert, setSelectedCert] = useState(0);
  const [selectedTransport, setSelectedTransport] = useState('sea');

  const SCREENS = {
    's-exporter-home': { title: 'Exporter Dashboard', role: 'Exporter', desc: 'Shows membership status, active applications, pending payments, and issued certificates' },
    's-cert-select': { title: '① Select Certificate Type', role: 'Exporter', desc: 'Cert type cards show member fee rates. Membership banner confirms active member pricing.' },
    's-app-form': { title: '② Application Form (v2.2)', role: 'Exporter', desc: 'NRS read-only fields, Mode of Transport selector with conditional documents, USD FOB for CoO' },
    's-app-review': { title: '③ Review & Submit (v2.2)', role: 'Exporter', desc: 'Shows membership tier, USD/NGN conversion box with live rate, correct member fee calculation' },
    's-payment': { title: '④ Payment — Paystack', role: 'Exporter', desc: 'Paystack popup — card, bank transfer, USSD. Reference stored for reconciliation' },
    's-tracking': { title: 'Application Tracking', role: 'Exporter', desc: 'Full status timeline showing Mode of Transport, USD/NGN rate used, Paystack ref, and reviewing officer' },
    's-resubmit': { title: 'Resubmit After Unapproval', role: 'Exporter', desc: 'Exporter can edit and resubmit an UNAPPROVED application. No repayment required.' },
    's-vetting-queue': { title: 'Vetting Queue Dashboard', role: 'NACCIMA Staff', desc: 'Queue filtered by cert type, status, and transport mode. Unapproved-resubmitted applications are clearly flagged.' },
    's-vetting-review': { title: 'Application Review', role: 'NACCIMA Staff', desc: 'Full application view with Mode of Transport, USD/NGN rate, missing document warnings, and mandatory comment before any action.' },
    's-admin-dash': { title: 'Admin Dashboard', role: 'NACCIMA Admin', desc: 'Platform KPIs, applications by type, status breakdown (including Unapproved), and live activity feed.' },
    's-admin-companies': { title: 'Company Profiles', role: 'NACCIMA Admin', desc: 'All registered companies with membership status, expiry dates, and account controls.' },
    's-admin-company-detail': { title: 'Company Detail + Membership', role: 'NACCIMA Admin', desc: 'NRS-locked fields with admin override option. Membership toggle, start/end dates, and membership change log.' },
    's-admin-staff': { title: 'Staff Accounts', role: 'NACCIMA Admin', desc: 'Admin-only staff account creation. Staff cannot self-register. Username and role assigned here.' },
    's-admin-fees': { title: 'Fee Management', role: 'NACCIMA Admin', desc: 'Full fee schedule: CoO is percentage-based (member 0.11% / non-member 0.125%), all others are flat NGN. USD/NGN rate settings included.' },
    's-admin-certs': { title: 'Certificate Configuration', role: 'NACCIMA Admin', desc: 'Field toggles per cert type, now including TIN, Mode of Transport, and conditional document rules.' },
    's-cert-verify': { title: 'Certificate Verification (Public)', role: 'Public', desc: 'No login required. Shows VALID or REVOKED/VOID status. Revoked certs clearly marked — cannot appear as valid.' },
  };

  const currentScreen = SCREENS[activeScreen as keyof typeof SCREENS] || SCREENS['s-exporter-home'];

  return (
    <>
      <div id="screen-header">
        <div id="sh-title" className="sh-title">{currentScreen.title}</div>
        <div id="sh-role" className="sh-role">{currentScreen.role}</div>
        <div id="sh-desc" className="sh-desc">{currentScreen.desc}</div>
        <button
          className="btn btn-outline btn-sm"
          style={{ marginTop: '8px', alignSelf: 'flex-start' }}
          onClick={() => window.dispatchEvent(new CustomEvent('open-logout-modal'))}
        >
          Log Out
        </button>
      </div>
      <div id="wireframe-wrap">
        {/* SCREEN: EXPORTER DASHBOARD */}
        {activeScreen === 's-exporter-home' && (
          <div className="screen active">
            <div className="app-shell">
              <div className="app-topbar">
                <div className="brand">NACCIMA <span>E-Certificate Platform</span></div>
                <div className="topbar-right">
                  <div className="tb-notif">🔔<div className="notif-dot"></div></div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <span className="badge b-member" style={{fontSize:'10px'}}>★ MEMBER</span>
                  </div>
                  <div className="tb-user">
                    <div className="tb-avatar">LT</div><span className="tb-uname">Lagos Traders Ltd</span>
                  </div>
                </div>
              </div>
              <div className="app-body">
                {/* <nav className="app-sidebar">
                  <div className="sidebar-link active"><span className="sico">🏠</span> Dashboard</div>
                  <div className="sidebar-link"><span className="sico">➕</span> New Application</div>
                  <div className="sidebar-label">My Applications</div>
                  <div className="sidebar-link"><span className="sico">📄</span> All Applications <span className="sidebar-badge amber">3</span></div>
                  <div className="sidebar-link"><span className="sico">🕐</span> Pending Payment <span className="sidebar-badge red">1</span></div>
                  <div className="sidebar-link"><span className="sico">🔍</span> Under Review</div>
                  <div className="sidebar-label">Certificates</div>
                  <div className="sidebar-link"><span className="sico">🎖️</span> Issued Certs <span className="sidebar-badge green">23</span></div>
                  <div className="sidebar-label">Account</div>
                  <div className="sidebar-link"><span className="sico">🏢</span> Company Profile</div>
                  <div className="sidebar-link"><span className="sico">📁</span> My Documents</div>
                </nav> */}
                <div className="app-content" style={{ width: '100%' }}>
                  <div className="page-title">Welcome, Lagos Traders Ltd</div>
                  <div className="page-sub">TIN: 12345678901 &nbsp;|&nbsp; Last login: Today, 10:24 AM</div>
                  <div className="membership-banner member">★ &nbsp;NACCIMA Member &nbsp;—&nbsp; Member rates apply &nbsp;|&nbsp; Valid until: 31 Dec 2026</div>
                  <div className="stat-row">
                    <div className="stat-card blue">
                      <div className="sc-val">5</div>
                      <div className="sc-lbl">Active Applications</div>
                      <div className="sc-trend">↑ 2 new this week</div>
                    </div>
                    <div className="stat-card amber">
                      <div className="sc-val">1</div>
                      <div className="sc-lbl">Pending Payment</div>
                      <div className="sc-trend">Action required</div>
                    </div>
                    <div className="stat-card">
                      <div className="sc-val">2</div>
                      <div className="sc-lbl">Under Review</div>
                      <div className="sc-trend">Avg. 2 days</div>
                    </div>
                    <div className="stat-card green">
                      <div className="sc-val">23</div>
                      <div className="sc-lbl">Certificates Issued</div>
                      <div className="sc-trend">↑ 4 this month</div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
                    <div style={{fontSize:'13px',fontWeight:700,color:'#1a2236'}}>Recent Applications</div>
                    <button className="btn btn-primary btn-sm" onClick={() => onScreenChange('s-cert-select')}>➕ New Application</button>
                  </div>
                  <div className="scrollable-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Approval #</th>
                          <th>Certificate Type</th>
                          <th>Destination</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>NACC-2026-00421</td>
                          <td>Certificate of Origin</td>
                          <td>United Kingdom</td>
                          <td>26 Mar 2026</td>
                          <td><span className="badge b-review">Under Review</span></td>
                          <td><div className="actions"><button className="btn btn-outline btn-sm">View</button></div></td>
                        </tr>
                        <tr>
                          <td>NACC-2026-00398</td>
                          <td>GSP Certificate</td>
                          <td>Germany</td>
                          <td>20 Mar 2026</td>
                          <td><span className="badge b-issued">Issued</span></td>
                          <td><div className="actions"><button className="btn btn-success btn-sm">Download</button></div></td>
                        </tr>
                        <tr>
                          <td>NACC-2026-00380</td>
                          <td>ECOWAS Free Trade</td>
                          <td>Ghana</td>
                          <td>15 Mar 2026</td>
                          <td><span className="badge b-unapproved">Unapproved</span></td>
                          <td><div className="actions"><button className="btn btn-amber btn-sm" onClick={() => onScreenChange('s-resubmit')}>Edit &amp; Resubmit</button></div></td>
                        </tr>
                        <tr>
                          <td>NACC-2026-00341</td>
                          <td>Solid Mineral</td>
                          <td>China</td>
                          <td>10 Mar 2026</td>
                          <td><span className="badge b-submitted">Pending Payment</span></td>
                          <td><div className="actions"><button className="btn btn-amber btn-sm">Pay Now</button></div></td>
                        </tr>
                        <tr>
                          <td>NACC-2026-00290</td>
                          <td>Movement Certificate</td>
                          <td>France</td>
                          <td>01 Mar 2026</td>
                          <td><span className="badge b-issued">Issued</span></td>
                          <td><div className="actions"><button className="btn btn-success btn-sm">Download</button></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: SELECT CERTIFICATE TYPE */}
        {activeScreen === 's-cert-select' && (
          <div className="screen active">
            <div className="app-shell">
              <div className="app-topbar">
                <div className="brand">NACCIMA <span>E-Certificate Platform</span></div>
                <div className="topbar-right">
                  <div className="tb-user">
                    <div className="tb-avatar">LT</div><span className="tb-uname">Lagos Traders Ltd</span>
                  </div>
                </div>
              </div>
              <div className="app-body">
                <nav className="app-sidebar">
                  <div className="sidebar-link" onClick={() => onScreenChange('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
                  <div className="sidebar-link active"><span className="sico">➕</span> New Application</div>
                </nav>
                <div className="app-content">
                  <div className="page-title">New Certificate Application</div>
                  <div className="page-sub">Step 1 of 4 — Select the certificate type</div>
                  <div className="stepper">
                    <div className="step">
                      <div className="step-circle active">1</div><span className="step-label active">Select Type</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                      <div className="step-circle todo">2</div><span className="step-label todo">Application Details</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                      <div className="step-circle todo">3</div><span className="step-label todo">Review & Submit</span>
                    </div>
                    <div className="step-line"></div>
                    <div className="step">
                      <div className="step-circle todo">4</div><span className="step-label todo">Payment</span>
                    </div>
                  </div>
                  <div className="membership-banner member" style={{marginBottom:'14px'}}>★ NACCIMA Member — member rates apply to your application</div>
                  <div className="cert-grid">
                    {[
                      {icon:'📜',name:'NACCIMA Certificate of Origin',desc:'Confirms Nigerian origin of exported goods. FOB entered in USD and converted to NGN for fee calculation.',tag:'Most Common · Member: 0.11% FOB'},
                      {icon:'🌍',name:'GSP Certificate',desc:'Enables preferential tariff rates under the Generalised System of Preferences scheme.',tag:'Member: ₦25,000'},
                      {icon:'🤝',name:'ECOWAS Free Trade Certificate',desc:'Facilitates tariff-free movement under ETLS. Requires ECOWAS Number and Criteria fields.',tag:'Needs ECOWAS No. · Member: ₦40,000'},
                      {icon:'🚚',name:'Movement Certificate',desc:'Accompanies goods in transit. HS Code classification not required for this type.',tag:'No HS Code · Member: ₦40,000'},
                      {icon:'⛏️',name:'Solid Mineral Certificate',desc:'For solid mineral exports. Includes Unit of Measurement, ECOWAS Number, and Criteria fields.',tag:'Minerals Only · Member: ₦150,000'},
                    ].map((cert, index) => (
                      <div key={index} className={`cert-card ${selectedCert === index ? 'selected' : ''}`} onClick={() => setSelectedCert(index)}>
                        <div className="cc-icon">{cert.icon}</div>
                        <div className="cc-name">{cert.name}</div>
                        <div className="cc-desc">{cert.desc}</div>
                        <div className="cc-tag">{cert.tag}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
                    <button className="btn btn-outline" onClick={() => onScreenChange('s-exporter-home')}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onScreenChange('s-app-form')}>Continue with Certificate of Origin →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other screens - they will be added similarly */}
        {activeScreen !== 's-exporter-home' && activeScreen !== 's-cert-select' && (
          <div className="screen active">
            <div className="app-shell">
              <div style={{padding:'40px',textAlign:'center'}}>
                <div style={{fontSize:'18px',fontWeight:700,color:'#1a2236',marginBottom:'10px'}}>{currentScreen.title}</div>
                <div style={{fontSize:'13px',color:'#6a7a9a'}}>{currentScreen.desc}</div>
                <div style={{marginTop:'20px',fontSize:'12px',color:'#9ca3af'}}>This screen content will be added in the next iteration.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
