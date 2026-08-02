'use client';

import { useState } from 'react';

export default function Home() {
  const [activeScreen, setActiveScreen] = useState('s-login');
  const [selectedCert, setSelectedCert] = useState(0);
  const [selectedTransport, setSelectedTransport] = useState('sea');

  const SCREENS = {
    's-login': { title: 'Login (TIN-based)', role: 'All Users', desc: 'Exporters sign in with TIN as username. Staff use a separate login path.' },
    's-register-1': { title: 'Register — Step 1: TIN + NRS', role: 'Exporter', desc: 'Enter TIN → NRS API verifies and retrieves company name & address' },
    's-register-2': { title: 'Register — Step 2: Account', role: 'Exporter', desc: 'Set contact email and password after NRS verification is confirmed' },
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

  const currentScreen = SCREENS[activeScreen] || SCREENS['s-login'];

  return (
    <>
      {/* META NAVIGATION */}
      <aside id="meta-nav">
        <div className="logo">
          <div className="l1">NACCIMA</div>
          <div className="l2">UI/UX Wireframes v2.2</div>
        </div>

        <div className="nav-group">
          <div className="nav-group-title">Auth</div>
          <div className={`nav-item ${activeScreen === 's-login' ? 'active' : ''}`} onClick={() => setActiveScreen('s-login')}>🔐 Login (TIN-based)</div>
          <div className={`nav-item ${activeScreen === 's-register-1' ? 'active' : ''}`} onClick={() => setActiveScreen('s-register-1')}>📝 Register — Step 1: TIN</div>
          <div className={`nav-item ${activeScreen === 's-register-2' ? 'active' : ''}`} onClick={() => setActiveScreen('s-register-2')}>📝 Register — Step 2: Account</div>
        </div>
        <div className="nav-sep"></div>
        <div className="nav-group">
          <div className="nav-group-title">Exporter Flow</div>
          <div className={`nav-item ${activeScreen === 's-exporter-home' ? 'active' : ''}`} onClick={() => setActiveScreen('s-exporter-home')}>🏠 Exporter Dashboard</div>
          <div className={`nav-item ${activeScreen === 's-cert-select' ? 'active' : ''}`} onClick={() => setActiveScreen('s-cert-select')}>① Select Cert Type</div>
          <div className={`nav-item ${activeScreen === 's-app-form' ? 'active' : ''}`} onClick={() => setActiveScreen('s-app-form')}>② Application Form</div>
          <div className={`nav-item ${activeScreen === 's-app-review' ? 'active' : ''}`} onClick={() => setActiveScreen('s-app-review')}>③ Review & Submit</div>
          <div className={`nav-item ${activeScreen === 's-payment' ? 'active' : ''}`} onClick={() => setActiveScreen('s-payment')}>④ Payment</div>
          <div className={`nav-item ${activeScreen === 's-tracking' ? 'active' : ''}`} onClick={() => setActiveScreen('s-tracking')}>📋 App. Tracking</div>
          <div className={`nav-item ${activeScreen === 's-resubmit' ? 'active' : ''}`} onClick={() => setActiveScreen('s-resubmit')}>🔄 Resubmit (Unapproved)</div>
        </div>
        <div className="nav-sep"></div>
        <div className="nav-group">
          <div className="nav-group-title">Vetting Staff</div>
          <div className={`nav-item ${activeScreen === 's-vetting-queue' ? 'active' : ''}`} onClick={() => setActiveScreen('s-vetting-queue')}>📥 Vetting Queue</div>
          <div className={`nav-item ${activeScreen === 's-vetting-review' ? 'active' : ''}`} onClick={() => setActiveScreen('s-vetting-review')}>🔍 Review Application</div>
        </div>
        <div className="nav-sep"></div>
        <div className="nav-group">
          <div className="nav-group-title">Admin Panel</div>
          <div className={`nav-item ${activeScreen === 's-admin-dash' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-dash')}>📊 Dashboard</div>
          <div className={`nav-item ${activeScreen === 's-admin-companies' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-companies')}>🏢 Company Profiles</div>
          <div className={`nav-item ${activeScreen === 's-admin-company-detail' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-company-detail')}>👤 Company Detail + Membership</div>
          <div className={`nav-item ${activeScreen === 's-admin-staff' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-staff')}>👥 Staff Accounts</div>
          <div className={`nav-item ${activeScreen === 's-admin-fees' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-fees')}>💰 Fee Management</div>
          <div className={`nav-item ${activeScreen === 's-admin-certs' ? 'active' : ''}`} onClick={() => setActiveScreen('s-admin-certs')}>⚙️ Certificate Config</div>
        </div>
        <div className="nav-sep"></div>
        <div className="nav-group">
          <div className="nav-group-title">Public</div>
          <div className={`nav-item ${activeScreen === 's-cert-verify' ? 'active' : ''}`} onClick={() => setActiveScreen('s-cert-verify')}>🔎 Certificate Verification</div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div id="main-area">
        <div id="screen-header">
          <div id="sh-title" className="sh-title">{currentScreen.title}</div>
          <div id="sh-role" className="sh-role">{currentScreen.role}</div>
          <div id="sh-desc" className="sh-desc">{currentScreen.desc}</div>
        </div>
        <div id="wireframe-wrap">

          {/* SCREEN: LOGIN */}
          {activeScreen === 's-login' && (
            <div className="screen active">
              <div className="app-shell" style={{minHeight:'500px',display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                <div style={{background:'linear-gradient(155deg,#1a3a5c 0%,#0f2240 100%)',padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={{fontSize:'22px',fontWeight:800,color:'#fff',marginBottom:'5px'}}>NACCIMA</div>
                  <div style={{fontSize:'13px',color:'#7ab8dc',marginBottom:'24px',fontWeight:500}}>E-Certificate Platform</div>
                  <div style={{fontSize:'12.5px',color:'#aac8e0',lineHeight:1.8,marginBottom:'24px'}}>Apply for, track and receive your<br/>official NACCIMA export certificates.<br/><br/>All five certificate types — in one place.</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'#7ab8dc'}}>✅ Certificate of Origin (COO) &amp; GSP</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'#7ab8dc'}}>✅ ECOWAS &amp; Movement Certificates</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'#7ab8dc'}}>✅ Solid Mineral Certificate</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'#7ab8dc'}}>✅ Paystack-powered secure payments</div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11px',color:'#7ab8dc'}}>✅ Member &amp; Non-Member fee rates</div>
                  </div>
                </div>
                <div style={{padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center',background:'#fff'}}>
                  <div style={{fontSize:'16px',fontWeight:700,color:'#1a2236',marginBottom:'3px'}}>Sign in to your account</div>
                  <div style={{fontSize:'11.5px',color:'#6a7a9a',marginBottom:'22px'}}>Use your company TIN as your username</div>
                  <div className="form-group" style={{marginBottom:'12px'}}>
                    <label className="form-label">TIN (Tax Identification Number) <span className="req">*</span></label>
                    <input className="form-input" type="text" placeholder="e.g. 12345678901" maxLength={11} style={{letterSpacing:'1px',fontFamily:'monospace',fontSize:'13px'}} />
                    <div className="form-hint">Your 11-digit NRS-issued Tax Identification Number</div>
                  </div>
                  <div className="form-group" style={{marginBottom:'6px'}}>
                    <label className="form-label">Password <span className="req">*</span></label>
                    <input className="form-input" type="password" placeholder="••••••••" />
                  </div>
                  <div style={{textAlign:'right',fontSize:'11px',color:'#3a7bd5',marginBottom:'16px',cursor:'pointer'}}>Forgot password?</div>
                  <button className="btn btn-primary" style={{width:'100%',padding:'10px',fontSize:'13px',justifyContent:'center',marginBottom:'14px'}}>Sign In</button>
                  <div style={{textAlign:'center',fontSize:'11.5px',color:'#6a7a9a'}}>
                    New exporter? <span style={{color:'#3a7bd5',fontWeight:600,cursor:'pointer'}} onClick={() => setActiveScreen('s-register-1')}>Register your company →</span>
                  </div>
                  <div style={{marginTop:'18px',paddingTop:'14px',borderTop:'1px solid #f0f0f0'}}>
                    <div style={{fontSize:'10.5px',color:'#9ca3af',textAlign:'center',marginBottom:'8px'}}>— NACCIMA Staff / Admin login —</div>
                    <button className="btn btn-outline" style={{width:'100%',justifyContent:'center',fontSize:'11.5px'}}>🏢 Login as NACCIMA Staff / Admin</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: REGISTER STEP 1 */}
          {activeScreen === 's-register-1' && (
            <div className="screen active">
              <div className="app-shell" style={{minHeight:'480px',display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                <div style={{background:'linear-gradient(155deg,#1a3a5c 0%,#0f2240 100%)',padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={{fontSize:'18px',fontWeight:800,color:'#fff',marginBottom:'6px'}}>Company Registration</div>
                  <div style={{fontSize:'12px',color:'#7ab8dc',marginBottom:'20px'}}>Your TIN is your identity on this platform</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'#1a4a8a',color:'#fff',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>1</div>
                      <div style={{fontSize:'11.5px',color:'#c8dce8'}}><strong style={{color:'#fff'}}>Enter your TIN</strong> — we verify it with the Nigeria Revenue Service (NRS) API</div>
                    </div>
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'#1e2e45',color:'#5a7a9a',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>2</div>
                      <div style={{fontSize:'11.5px',color:'#5a7a9a'}}>Confirm your company details retrieved from NRS</div>
                    </div>
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                      <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'#1e2e45',color:'#5a7a9a',fontSize:'10px',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>3</div>
                      <div style={{fontSize:'11.5px',color:'#5a7a9a'}}>Set your email and password to complete registration</div>
                    </div>
                  </div>
                </div>
                <div style={{padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center',background:'#fff'}}>
                  <div style={{fontSize:'15px',fontWeight:700,color:'#1a2236',marginBottom:'3px'}}>Step 1 of 2 — Verify your TIN</div>
                  <div style={{fontSize:'11.5px',color:'#6a7a9a',marginBottom:'20px'}}>We will retrieve your company details from the NRS</div>
                  <div className="form-group" style={{marginBottom:'16px'}}>
                    <label className="form-label">Tax Identification Number (TIN) <span className="req">*</span></label>
                    <input className="form-input" type="text" placeholder="e.g. 12345678901" style={{fontFamily:'monospace',fontSize:'14px',letterSpacing:'1.5px'}} />
                    <div className="form-hint">11-digit number issued by the Nigeria Revenue Service (NRS)</div>
                  </div>

                  <div className="nrs-verify">
                    <div className="nrs-title">✅ TIN Verified — NRS Record Found</div>
                    <div className="nrs-field">
                      <span className="nk">Registered Name</span><span className="nv">Lagos Traders Ltd</span>
                      <span className="nk">Registered Address</span><span className="nv">14 Commerce Road, Apapa, Lagos State</span>
                      <span className="nk">TIN</span><span className="nv" style={{fontFamily:'monospace'}}>12345678901</span>
                    </div>
                    <div style={{fontSize:'10.5px',color:'#065f46',marginTop:'8px'}}>These details will be stored in your company profile and pre-filled (read-only) on all certificate applications.</div>
                  </div>

                  <div className="alert alert-info" style={{marginBottom:'12px'}}>
                    <span>ℹ️</span>
                    <span>If the NRS API is unavailable, registration cannot proceed. Please try again later.</span>
                  </div>

                  <div style={{display:'flex',gap:'8px'}}>
                    <button className="btn btn-outline" onClick={() => setActiveScreen('s-login')}>← Back to Login</button>
                    <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={() => setActiveScreen('s-register-2')}>Confirm &amp; Continue →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: REGISTER STEP 2 */}
          {activeScreen === 's-register-2' && (
            <div className="screen active">
              <div className="app-shell" style={{minHeight:'440px',display:'grid',gridTemplateColumns:'1fr 1fr'}}>
                <div style={{background:'linear-gradient(155deg,#1a3a5c 0%,#0f2240 100%)',padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={{fontSize:'18px',fontWeight:800,color:'#fff',marginBottom:'6px'}}>Almost There</div>
                  <div style={{fontSize:'12px',color:'#7ab8dc',marginBottom:'20px'}}>Set your login credentials</div>
                  <div className="nrs-verify" style={{background:'rgba(255,255,255,.07)',borderColor:'rgba(255,255,255,.15)'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:'#7ab8dc',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:'6px'}}>✅ NRS-Verified Company</div>
                    <div style={{fontSize:'12px',fontWeight:700,color:'#fff'}}>Lagos Traders Ltd</div>
                    <div style={{fontSize:'11px',color:'#7ab8dc',marginTop:'2px',fontFamily:'monospace'}}>TIN: 12345678901</div>
                  </div>
                  <div style={{fontSize:'11px',color:'#5a7a9a',marginTop:'12px',lineHeight:1.6}}>Your TIN will be your username for all future logins. Keep it safe.</div>
                </div>
                <div style={{padding:'38px 34px',display:'flex',flexDirection:'column',justifyContent:'center',background:'#fff'}}>
                  <div style={{fontSize:'15px',fontWeight:700,color:'#1a2236',marginBottom:'3px'}}>Step 2 of 2 — Create Your Account</div>
                  <div style={{fontSize:'11.5px',color:'#6a7a9a',marginBottom:'20px'}}>Set your contact email and password</div>
                  <div className="form-group" style={{marginBottom:'12px'}}>
                    <label className="form-label">Contact Email Address <span className="req">*</span></label>
                    <input className="form-input" placeholder="company@example.com" />
                    <div className="form-hint">A verification link will be sent here. Used for notifications.</div>
                  </div>
                  <div className="form-group" style={{marginBottom:'12px'}}>
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" placeholder="+234 800 000 0000" />
                  </div>
                  <div className="form-group" style={{marginBottom:'12px'}}>
                    <label className="form-label">Password <span className="req">*</span></label>
                    <input className="form-input" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special" />
                  </div>
                  <div className="form-group" style={{marginBottom:'18px'}}>
                    <label className="form-label">Confirm Password <span className="req">*</span></label>
                    <input className="form-input" type="password" placeholder="Re-enter password" />
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <button className="btn btn-outline" onClick={() => setActiveScreen('s-register-1')}>← Back</button>
                    <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>Create Account &amp; Verify Email</button>
                  </div>
                  <div style={{fontSize:'10.5px',color:'#9ca3af',marginTop:'10px',textAlign:'center'}}>By registering, you confirm the company details are accurate and that you are authorised to act on behalf of this company.</div>
                </div>
              </div>
            </div>
          )}

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
                  <nav className="app-sidebar">
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
                  </nav>
                  <div className="app-content">
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
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveScreen('s-cert-select')}>➕ New Application</button>
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
                            <td><div className="actions"><button className="btn btn-amber btn-sm" onClick={() => setActiveScreen('s-resubmit')}>Edit &amp; Resubmit</button></div></td>
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
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
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
                      <button className="btn btn-outline" onClick={() => setActiveScreen('s-exporter-home')}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => setActiveScreen('s-app-form')}>Continue with Certificate of Origin →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: APPLICATION FORM */}
          {activeScreen === 's-app-form' && (
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
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
                    <div className="sidebar-link active"><span className="sico">➕</span> New Application</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">NACCIMA Certificate of Origin</div>
                    <div className="page-sub">Step 2 of 4 — Complete all required fields</div>
                    <div className="stepper">
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Select Type</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle active">2</div><span className="step-label active">Application Details</span>
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

                    <div className="form-section">
                      <div className="form-section-title">
                        <div className="snum">1</div>Shipper / Exporter Details <span className="version-badge">NRS-Verified · Read-Only</span>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">TIN <span className="req">*</span></label>
                          <input className="form-input verified" value="12345678901" readOnly style={{fontFamily:'monospace',letterSpacing:'1px'}} />
                          <div className="form-hint">🔒 From your company profile — cannot be changed</div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Importer Email</label>
                          <input className="form-input" placeholder="importer@overseas.com" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Shipper's Name <span className="req">*</span></label>
                          <input className="form-input verified" value="Lagos Traders Ltd" readOnly />
                          <div className="form-hint">🔒 NRS-verified name — contact Admin to correct</div>
                        </div>
                        <div className="form-group form-full">
                          <label className="form-label">Shipper's Address <span className="req">*</span></label>
                          <input className="form-input verified" value="14 Commerce Road, Apapa, Lagos State, Nigeria" readOnly />
                          <div className="form-hint">🔒 NRS-verified address — contact Admin to correct</div>
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <div className="form-section-title">
                        <div className="snum">2</div>Mode of Transport <span className="req">*</span> <span className="version-badge">New in v2.2</span>
                      </div>
                      <div className="transport-grid">
                        {[
                          {mode:'land',icon:'🚛',name:'Land',docs:'Required docs:<br/>Invoice + Packing List'},
                          {mode:'air',icon:'✈️',name:'Air',docs:'Required docs:<br/>Airway Bill + Invoice + Packing List'},
                          {mode:'sea',icon:'🚢',name:'Sea',docs:'Required docs:<br/>Bill of Lading + Invoice + Packing List'},
                        ].map((t) => (
                          <div key={t.mode} className={`transport-card ${selectedTransport === t.mode ? 'selected' : ''}`} onClick={() => setSelectedTransport(t.mode)}>
                            <div className="tc-icon">{t.icon}</div>
                            <div className="tc-name">{t.name}</div>
                            <div className="tc-docs">{t.docs}</div>
                          </div>
                        ))}
                      </div>
                      <div className="alert alert-info">
                        <span>ℹ️</span>
                        <span><strong>Sea selected:</strong> You must upload Bill of Lading, Commercial Invoice, and Packing List before submitting.</span>
                      </div>
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',gap:'10px',paddingTop:'6px',borderTop:'1px solid #edf0f5',marginTop:'4px'}}>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="btn btn-outline" onClick={() => setActiveScreen('s-cert-select')}>← Back</button>
                        <button className="btn btn-outline">💾 Save Draft</button>
                      </div>
                      <button className="btn btn-primary" onClick={() => setActiveScreen('s-app-review')}>Review Application →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: REVIEW & SUBMIT */}
          {activeScreen === 's-app-review' && (
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
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
                    <div className="sidebar-link active"><span className="sico">➕</span> New Application</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">Review Your Application</div>
                    <div className="page-sub">Step 3 of 4 — Confirm all details before submitting</div>
                    <div className="stepper">
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Select Type</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Application Details</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle active">3</div><span className="step-label active">Review & Submit</span>
                      </div>
                      <div className="step-line"></div>
                      <div className="step">
                        <div className="step-circle todo">4</div><span className="step-label todo">Payment</span>
                      </div>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                      <div className="info-box">
                        <div className="ib-title">Certificate Type</div>
                        <div style={{fontSize:'13.5px',fontWeight:700,color:'#1a2236'}}>📜 NACCIMA Certificate of Origin</div>
                      </div>
                      <div className="info-box">
                        <div className="ib-title">Exporter</div>
                        <div className="info-kv">
                          <span className="k">Company</span><span className="v">Lagos Traders Ltd</span>
                          <span className="k">TIN</span><span className="v" style={{fontFamily:'monospace'}}>12345678901</span>
                          <span className="k">Membership</span><span className="v"><span className="badge b-member">★ MEMBER</span></span>
                        </div>
                      </div>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',alignItems:'start'}}>
                      <div>
                        <div style={{fontSize:'12.5px',fontWeight:700,color:'#1a2236',marginBottom:'8px'}}>Supporting Documents</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'5px',fontSize:'11.5px',marginBottom:'12px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'7px',color:'#065f46'}}>✅ Bill of Lading — BOL_2026.pdf</div>
                          <div style={{display:'flex',alignItems:'center',gap:'7px',color:'#e53e3e'}}>⚠️ Commercial Invoice — Not uploaded</div>
                          <div style={{display:'flex',alignItems:'center',gap:'7px',color:'#e53e3e'}}>⚠️ Packing List — Not uploaded</div>
                        </div>
                      </div>
                      <div>
                        <div className="fx-box">
                          <div className="fx-title">💱 FOB Value Conversion (Certificate of Origin)</div>
                          <div className="fx-row"><span>FOB Value (USD)</span><span className="fxv">$5,000.00</span></div>
                          <div className="fx-row"><span>Exchange Rate (USD/NGN)</span><span className="fxv">₦1,580.00</span></div>
                          <div className="fx-row" style={{fontSize:'10px',color:'#9ca3af'}}><span>Rate retrieved</span><span>30 Jun 2026, 09:15 AM (cached ≤1hr)</span></div>
                          <div className="fx-row" style={{marginTop:'4px',fontWeight:700,borderTop:'1px solid #fbbf24',paddingTop:'5px'}}><span>FOB Value (NGN)</span><span className="fxv">₦7,900,000.00</span></div>
                        </div>
                        <div className="fee-box" style={{marginTop:'10px'}}>
                          <div className="fee-row"><span style={{color:'#065f46',fontWeight:600}}>★ Member Rate Applied</span><span className="amt" style={{color:'#065f46',fontSize:'10.5px'}}>0.11% of FOB</span></div>
                          <div className="fee-row"><span>Certificate Fee (0.11% × ₦7,900,000)</span><span className="amt">₦8,690.00</span></div>
                          <div className="fee-row"><span>Processing Fee</span><span className="amt">₦2,500.00</span></div>
                          <div className="fee-row"><span>VAT (7.5%)</span><span className="amt">₦841.88</span></div>
                          <div className="fee-row total"><span>Total Payable</span><span className="amt">₦12,031.88</span></div>
                        </div>
                      </div>
                    </div>

                    <div style={{display:'flex',justifyContent:'space-between',gap:'10px',paddingTop:'14px',borderTop:'1px solid #edf0f5',marginTop:'14px'}}>
                      <button className="btn btn-outline" onClick={() => setActiveScreen('s-app-form')}>← Back to Edit</button>
                      <button className="btn btn-primary" onClick={() => setActiveScreen('s-payment')}>Submit &amp; Proceed to Payment →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: PAYMENT */}
          {activeScreen === 's-payment' && (
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
                  <div className="app-content" style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'26px'}}>
                    <div className="page-title" style={{textAlign:'center',marginBottom:'3px'}}>Secure Payment</div>
                    <div className="page-sub" style={{textAlign:'center',marginBottom:'20px'}}>Step 4 of 4 — Application NACC-2026-00422 submitted. Complete payment to begin processing.</div>
                    <div className="stepper" style={{maxWidth:'620px',width:'100%'}}>
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Select Type</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Application Details</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle done">✓</div><span className="step-label done">Review &amp; Submit</span>
                      </div>
                      <div className="step-line done"></div>
                      <div className="step">
                        <div className="step-circle active">4</div><span className="step-label active">Payment</span>
                      </div>
                    </div>
                    <div className="ps-wrap">
                      <div className="ps-header">
                        <div className="ps-logo">Paystack</div>
                        <div style={{fontSize:'10.5px',opacity:.8,marginTop:'2px'}}>Lagos Traders Ltd — lagos@traders.ng</div>
                        <div className="ps-amt">₦ 12,031.88</div>
                        <div className="ps-ref">Ref: NACC-PAY-2026-00422 &nbsp;|&nbsp; NACCIMA Certificate Fee</div>
                      </div>
                      <div className="ps-body">
                        <div className="ps-tabs">
                          <div className="ps-tab active">💳 Card</div>
                          <div className="ps-tab">🏦 Bank Transfer</div>
                          <div className="ps-tab">📱 USSD</div>
                        </div>
                        <div className="ps-field"><label>Card Number</label><input placeholder="0000  0000  0000  0000" /></div>
                        <div className="ps-card-row">
                          <div className="ps-field"><label>Expiry Date</label><input placeholder="MM / YY" /></div>
                          <div className="ps-field"><label>CVV</label><input placeholder="•••" /></div>
                        </div>
                        <button className="ps-pay-btn">Pay ₦12,031.88</button>
                        <div className="ps-secure">🔒 Secured by Paystack — PCI DSS Compliant</div>
                      </div>
                    </div>
                    <div style={{fontSize:'11px',color:'#9ca3af',textAlign:'center',marginTop:'12px'}}>
                      Having trouble? <span style={{color:'#3a7bd5',cursor:'pointer'}}>Return to application</span> — your data is saved as PAYMENT PENDING.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: APPLICATION TRACKING */}
          {activeScreen === 's-tracking' && (
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
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
                    <div className="sidebar-link active"><span className="sico">📄</span> All Applications</div>
                  </nav>
                  <div className="app-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <div className="page-title">Application NACC-2026-00421</div>
                      <span className="badge b-review" style={{fontSize:'12px',padding:'4px 10px'}}>Under Review</span>
                    </div>
                    <div className="page-sub">Certificate of Origin &nbsp;|&nbsp; 🚢 Sea &nbsp;|&nbsp; Submitted 26 Mar 2026 &nbsp;|&nbsp; Destination: United Kingdom</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'18px'}}>
                      <div>
                        <div className="tabs">
                          <div className="tab active">Application Details</div>
                          <div className="tab">Line Items (1)</div>
                          <div className="tab">Documents (1/3)</div>
                        </div>
                        <div className="info-box">
                          <div className="ib-title">Shipment Information</div>
                          <div className="info-kv">
                            <span className="k">Consignee</span><span className="v">UK Commodities PLC</span>
                            <span className="k">Destination</span><span className="v">United Kingdom</span>
                            <span className="k">Mode of Transport</span><span className="v">🚢 Sea</span>
                            <span className="k">Carrier</span><span className="v">Maersk Line</span>
                            <span className="k">FOB Value (USD)</span><span className="v">$5,000.00</span>
                            <span className="k">FOB Value (NGN)</span><span className="v">₦7,900,000.00 @ ₦1,580/$</span>
                            <span className="k">HS Code</span><span className="v"><span style={{fontFamily:'monospace',color:'#1a4a8a',fontWeight:700}}>0901.11</span> — Coffee, not roasted</span>
                          </div>
                        </div>
                        <div className="info-box">
                          <div className="ib-title">Payment</div>
                          <div className="info-kv">
                            <span className="k">Amount Paid</span><span className="v" style={{color:'#065f46'}}>₦12,031.88</span>
                            <span className="k">Paystack Ref</span><span className="v" style={{fontFamily:'monospace'}}>NACC-PAY-2026-00422</span>
                            <span className="k">Paid On</span><span className="v">26 Mar 2026, 11:42 AM</span>
                            <span className="k">Rate Applied</span><span className="v">Member rate (0.11% FOB)</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div style={{fontSize:'12.5px',fontWeight:700,color:'#1a2236',marginBottom:'10px'}}>Application Status</div>
                        <div className="timeline">
                          <div className="tl-item">
                            <div className="tl-dot done">✓</div>
                            <div className="tl-body">
                              <div className="tl-title">Application Submitted</div>
                              <div className="tl-date">26 Mar 2026, 10:15 AM</div>
                            </div>
                          </div>
                          <div className="tl-item">
                            <div className="tl-dot done">✓</div>
                            <div className="tl-body">
                              <div className="tl-title">Payment Confirmed</div>
                              <div className="tl-date">26 Mar 2026, 11:42 AM</div>
                              <div className="tl-note">₦12,031.88 — Paystack</div>
                            </div>
                          </div>
                          <div className="tl-item">
                            <div className="tl-dot active">●</div>
                            <div className="tl-body">
                              <div className="tl-title">Under Review</div>
                              <div className="tl-date">27 Mar 2026 (Current)</div>
                              <div className="tl-note">Assigned: Mrs. Adaobi Nwosu</div>
                            </div>
                          </div>
                          <div className="tl-item">
                            <div className="tl-dot todo">4</div>
                            <div className="tl-body">
                              <div className="tl-title">Approved / Rejected</div>
                              <div className="tl-date">Pending</div>
                            </div>
                          </div>
                          <div className="tl-item">
                            <div className="tl-dot todo">5</div>
                            <div className="tl-body">
                              <div className="tl-title">Certificate Issued</div>
                              <div className="tl-date">Pending</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: RESUBMIT */}
          {activeScreen === 's-resubmit' && (
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
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-exporter-home')}><span className="sico">🏠</span> Dashboard</div>
                    <div className="sidebar-link active"><span className="sico">🔄</span> NACC-2026-00380</div>
                  </nav>
                  <div className="app-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <div className="page-title">NACC-2026-00380 — ECOWAS Free Trade</div>
                      <span className="badge b-unapproved" style={{fontSize:'12px',padding:'4px 10px'}}>⚠ Unapproved</span>
                    </div>
                    <div className="page-sub">Certificate revoked — you may edit and resubmit. No additional payment required.</div>
                    <div className="alert alert-danger">
                      <span>🚫</span>
                      <div>
                        <strong>Certificate Revoked by Admin</strong><br/>
                        <span style={{fontSize:'11px'}}>Reason provided: "ECOWAS Number supplied (EX-00221) is not registered under the ETLS scheme. Please verify and resubmit with the correct ECOWAS Number."</span><br/>
                        <span style={{fontSize:'10.5px',color:'#9b1c1c',marginTop:'3px',display:'block'}}>Revoked: 28 Mar 2026 by Admin Chukwu</span>
                      </div>
                    </div>
                    <div className="alert alert-info">
                      <span>ℹ️</span>
                      <span>Edit the fields below and click <strong>Resubmit</strong>. Your application will re-enter the vetting queue. Original payment of ₦40,000 is already on record — no new payment is required.</span>
                    </div>
                    <div className="form-section">
                      <div className="form-section-title">
                        <div className="snum">1</div>Shipper Details <span style={{fontSize:'10.5px',fontWeight:400,color:'#9ca3af'}}>— read-only (NRS-verified)</span>
                      </div>
                      <div className="form-grid">
                        <div className="form-group"><label className="form-label">TIN</label><input className="form-input verified" value="12345678901" readOnly style={{fontFamily:'monospace'}} /></div>
                        <div className="form-group"><label className="form-label">Shipper's Name</label><input className="form-input verified" value="Lagos Traders Ltd" readOnly /></div>
                      </div>
                    </div>
                    <div className="form-section">
                      <div className="form-section-title">
                        <div className="snum">2</div>ECOWAS Details <span style={{fontSize:'10.5px',color:'#e53e3e'}}>⚠ Revocation reason relates to this section</span>
                      </div>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">ECOWAS Number <span className="req">*</span></label>
                          <input className="form-input" value="EX-00221" style={{borderColor:'#fca5a5',background:'#fff5f5'}} />
                          <div className="form-hint" style={{color:'#e53e3e'}}>⚠ Previous value rejected — enter corrected ECOWAS Number</div>
                        </div>
                        <div className="form-group"><label className="form-label">Criteria <span className="req">*</span></label><input className="form-input" value="A" placeholder="ETLS criteria code" /></div>
                      </div>
                    </div>
                    <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',borderTop:'1px solid #edf0f5',paddingTop:'12px'}}>
                      <button className="btn btn-outline" onClick={() => setActiveScreen('s-exporter-home')}>Cancel</button>
                      <button className="btn btn-primary">Resubmit Application →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: VETTING QUEUE */}
          {activeScreen === 's-vetting-queue' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#1a3a2a'}}>
                  <div className="brand">NACCIMA <span>Staff Portal — Vetting</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#1e8449'}}>AN</div><span className="tb-uname">Mrs. Adaobi Nwosu</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link active"><span className="sico">📥</span> Applications Queue <span className="sidebar-badge red">12</span></div>
                    <div className="sidebar-link"><span className="sico">🗂️</span> My Reviews</div>
                    <div className="sidebar-link"><span className="sico">✅</span> Approved Today <span className="sidebar-badge green">5</span></div>
                    <div className="sidebar-link"><span className="sico">❌</span> Rejected</div>
                    <div className="sidebar-link"><span className="sico">📊</span> Reports</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">Applications Queue</div>
                    <div className="page-sub">Paid applications awaiting vetting — oldest first (FIFO)</div>
                    <div className="stat-row">
                      <div className="stat-card amber">
                        <div className="sc-val">12</div>
                        <div className="sc-lbl">Pending Review</div>
                      </div>
                      <div className="stat-card green">
                        <div className="sc-val">5</div>
                        <div className="sc-lbl">Reviewed Today</div>
                      </div>
                      <div className="stat-card blue">
                        <div className="sc-val">48</div>
                        <div className="sc-lbl">Approved This Month</div>
                      </div>
                      <div className="stat-card red">
                        <div className="sc-val">3</div>
                        <div className="sc-lbl">Rejected This Month</div>
                      </div>
                    </div>
                    <div className="scrollable-table">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Approval #</th>
                            <th>Company</th>
                            <th>TIN</th>
                            <th>Cert Type</th>
                            <th>Transport</th>
                            <th>Submitted</th>
                            <th>FOB</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>NACC-2026-00421</td>
                            <td>Lagos Traders Ltd</td>
                            <td style={{fontFamily:'monospace',fontSize:'11px'}}>12345678901</td>
                            <td>Cert. of Origin</td>
                            <td>🚢 Sea</td>
                            <td>26 Mar</td>
                            <td>$5,000</td>
                            <td><span className="badge b-review">Under Review</span></td>
                            <td style={{fontSize:'11px'}}>A. Nwosu</td>
                            <td><button className="btn btn-primary btn-sm" onClick={() => setActiveScreen('s-vetting-review')}>Review</button></td>
                          </tr>
                          <tr>
                            <td>NACC-2026-00420</td>
                            <td>Abuja Minerals Co.</td>
                            <td style={{fontFamily:'monospace',fontSize:'11px'}}>98765432100</td>
                            <td>Solid Mineral</td>
                            <td>✈️ Air</td>
                            <td>25 Mar</td>
                            <td>₦12.1M</td>
                            <td><span className="badge b-paid">Paid</span></td>
                            <td style={{fontSize:'11px',color:'#9ca3af'}}>Unassigned</td>
                            <td><button className="btn btn-outline btn-sm">Assign &amp; Review</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: VETTING REVIEW */}
          {activeScreen === 's-vetting-review' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#1a3a2a'}}>
                  <div className="brand">NACCIMA <span>Staff Portal — Application Review</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#1e8449'}}>AN</div><span className="tb-uname">Mrs. Adaobi Nwosu</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-vetting-queue')}><span className="sico">📥</span> Back to Queue</div>
                    <div className="sidebar-link active"><span className="sico">🔍</span> NACC-2026-00421</div>
                  </nav>
                  <div className="app-content" style={{padding:'14px 18px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                      <div>
                        <div style={{fontSize:'14px',fontWeight:700,color:'#1a2236'}}>NACC-2026-00421 &nbsp;<span className="badge b-review">Under Review</span></div>
                        <div style={{fontSize:'11.5px',color:'#6a7a9a',marginTop:'2px'}}>Lagos Traders Ltd &nbsp;|&nbsp; TIN: 12345678901 &nbsp;|&nbsp; Cert. of Origin &nbsp;|&nbsp; 🚢 Sea &nbsp;|&nbsp; <span className="badge b-member" style={{fontSize:'9px'}}>★ MEMBER</span></div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:'16px'}}>
                      <div>
                        <div className="tabs">
                          <div className="tab active">Application Details</div>
                          <div className="tab">Line Items (1)</div>
                          <div className="tab">Documents (1/3)</div>
                        </div>
                        <div className="info-box">
                          <div className="ib-title">Shipment Information</div>
                          <div className="info-kv">
                            <span className="k">Shipper</span><span className="v">Lagos Traders Ltd</span>
                            <span className="k">TIN</span><span className="v" style={{fontFamily:'monospace'}}>12345678901</span>
                            <span className="k">Consignee</span><span className="v">UK Commodities PLC</span>
                            <span className="k">Destination</span><span className="v">United Kingdom</span>
                            <span className="k">Mode of Transport</span><span className="v">🚢 Sea</span>
                            <span className="k">Carrier</span><span className="v">Maersk Line</span>
                            <span className="k">FOB (USD)</span><span className="v">$5,000.00</span>
                            <span className="k">FOB (NGN)</span><span className="v">₦7,900,000.00 @ ₦1,580/$</span>
                            <span className="k">HS Code</span><span className="v"><span style={{fontFamily:'monospace',color:'#1a4a8a',fontWeight:700}}>0901.11</span> — Coffee, not roasted</span>
                            <span className="k">Fee Paid</span><span className="v">₦12,031.88 (Member rate)</span>
                          </div>
                        </div>
                        <div style={{fontSize:'11.5px',fontWeight:700,color:'#1a2236',marginBottom:'7px'}}>Documents</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'5px',fontSize:'11.5px',marginBottom:'12px'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#f8fafd',border:'1px solid #dde3ee',borderRadius:'5px'}}>
                            <span>📄 BOL_2026.pdf &nbsp;<span style={{color:'#9ca3af'}}>(1.2 MB)</span></span>
                            <button className="btn btn-outline btn-sm">👁 View</button>
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'5px'}}>
                            <span style={{color:'#9b1c1c'}}>⚠️ Commercial Invoice — Missing</span>
                            <span className="badge b-rejected">Required for Sea</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:'#fff5f5',border:'1px solid #fca5a5',borderRadius:'5px'}}>
                            <span style={{color:'#9b1c1c'}}>⚠️ Packing List — Missing</span>
                            <span className="badge b-rejected">Required for Sea</span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                        <div className="review-panel">
                          <div className="rp-title">⚖️ Review Decision</div>
                          <textarea className="rp-textarea" placeholder="Comment required for all actions…"></textarea>
                          <button className="rp-action-btn rp-approve">✅ Approve Application</button>
                          <button className="rp-action-btn rp-request">📋 Request More Information</button>
                          <button className="rp-action-btn rp-reject">❌ Reject Application</button>
                        </div>
                        <div className="review-panel">
                          <div className="rp-title">📋 Review History</div>
                          <div className="timeline" style={{marginTop:'3px'}}>
                            <div className="tl-item">
                              <div className="tl-dot done" style={{width:'19px',height:'19px',fontSize:'9px'}}>✓</div>
                              <div className="tl-body">
                                <div className="tl-title" style={{fontSize:'11px'}}>Application Received</div>
                                <div className="tl-date">26 Mar, 10:15 AM</div>
                              </div>
                            </div>
                            <div className="tl-item">
                              <div className="tl-dot done" style={{width:'19px',height:'19px',fontSize:'9px'}}>✓</div>
                              <div className="tl-body">
                                <div className="tl-title" style={{fontSize:'11px'}}>Payment Confirmed</div>
                                <div className="tl-date">26 Mar, 11:42 AM</div>
                              </div>
                            </div>
                            <div className="tl-item">
                              <div className="tl-dot active" style={{width:'19px',height:'19px',fontSize:'9px'}}>●</div>
                              <div className="tl-body">
                                <div className="tl-title" style={{fontSize:'11px'}}>Assigned to A. Nwosu</div>
                                <div className="tl-date">27 Mar, 9:00 AM</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN DASHBOARD */}
          {activeScreen === 's-admin-dash' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link active"><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-link"><span className="sico">📋</span> All Applications</div>
                    <div className="sidebar-link"><span className="sico">🎖️</span> Issued Certificates</div>
                    <div className="sidebar-label">Company Management</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-companies')}><span className="sico">🏢</span> Company Profiles</div>
                    <div className="sidebar-label">Configuration</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-certs')}><span className="sico">⚙️</span> Certificate Types</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-fees')}><span className="sico">💰</span> Fee Management</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-staff')}><span className="sico">👥</span> Staff Accounts</div>
                    <div className="sidebar-label">Reports</div>
                    <div className="sidebar-link"><span className="sico">📈</span> Analytics</div>
                    <div className="sidebar-link"><span className="sico">💳</span> Payment Reports</div>
                    <div className="sidebar-link"><span className="sico">🔐</span> Audit Log</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">Admin Dashboard</div>
                    <div className="page-sub">Overview as of 30 June 2026</div>
                    <div className="stat-row">
                      <div className="stat-card blue">
                        <div className="sc-val">1,284</div>
                        <div className="sc-lbl">Total Applications (2026)</div>
                        <div className="sc-trend">↑ 12% vs last year</div>
                      </div>
                      <div className="stat-card green">
                        <div className="sc-val">₦28.4M</div>
                        <div className="sc-lbl">Revenue Collected (YTD)</div>
                        <div className="sc-trend">↑ 8% vs target</div>
                      </div>
                      <div className="stat-card">
                        <div className="sc-val">2.4 days</div>
                        <div className="sc-lbl">Avg. Processing Time</div>
                        <div className="sc-trend">↓ 0.3 days improvement</div>
                      </div>
                      <div className="stat-card red">
                        <div className="sc-val">6.2%</div>
                        <div className="sc-lbl">Rejection Rate</div>
                        <div className="sc-trend">— Stable</div>
                      </div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
                      <div style={{background:'#fff',border:'1px solid #dde3ee',borderRadius:'8px',padding:'14px'}}>
                        <div style={{fontSize:'12px',fontWeight:700,color:'#1a2236',marginBottom:'12px'}}>Applications by Certificate Type (2026)</div>
                        <div className="bar-chart">
                          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <div className="bar" style={{height:'88px',background:'#1a4a8a',width:'100%'}}><span>482</span></div><span style={{fontSize:'9px',color:'#6a7a9a'}}>Cert. of<br/>Origin</span>
                          </div>
                          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <div className="bar" style={{height:'58px',background:'#3a7bd5',width:'100%'}}><span>320</span></div><span style={{fontSize:'9px',color:'#6a7a9a'}}>GSP</span>
                          </div>
                          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <div className="bar" style={{height:'38px',background:'#5b9bd5',width:'100%'}}><span>214</span></div><span style={{fontSize:'9px',color:'#6a7a9a'}}>ECOWAS</span>
                          </div>
                          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <div className="bar" style={{height:'20px',background:'#7ab5e0',width:'100%'}}><span>118</span></div><span style={{fontSize:'9px',color:'#6a7a9a'}}>Movement</span>
                          </div>
                          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'}}>
                            <div className="bar" style={{height:'26px',background:'#9acfe8',width:'100%'}}><span>150</span></div><span style={{fontSize:'9px',color:'#6a7a9a'}}>Solid<br/>Mineral</span>
                          </div>
                        </div>
                      </div>
                      <div style={{background:'#fff',border:'1px solid #dde3ee',borderRadius:'8px',padding:'14px'}}>
                        <div style={{fontSize:'12px',fontWeight:700,color:'#1a2236',marginBottom:'12px'}}>Status Breakdown</div>
                        <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px'}}>
                            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#1a4a8a',flexShrink:0}}></div><span style={{flex:1}}>Issued</span>
                            <div style={{flex:2,height:'9px',background:'#e5e7eb',borderRadius:'5px',overflowHidden}}>
                              <div style={{width:'72%',height:'100%',background:'#1a4a8a',borderRadius:'5px'}}></div>
                            </div><span style={{minWidth:'30px',textAlignRight,fontWeight:600}}>920</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px'}}>
                            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#d97706',flexShrink:0}}></div><span style={{flex:1}}>Under Review</span>
                            <div style={{flex:2,height:'9px',background:'#e5e7eb',borderRadius:'5px',overflowHidden}}>
                              <div style={{width:'12%',height:'100%',background:'#d97706',borderRadius:'5px'}}></div>
                            </div><span style={{minWidth:'30px',textAlignRight,fontWeight:600}}>154</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px'}}>
                            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#059669',flexShrink:0}}></div><span style={{flex:1}}>Paid / Awaiting Review</span>
                            <div style={{flex:2,height:'9px',background:'#e5e7eb',borderRadius:'5px',overflowHidden}}>
                              <div style={{width:'7%',height:'100%',background:'#059669',borderRadius:'5px'}}></div>
                            </div><span style={{minWidth:'30px',textAlignRight,fontWeight:600}}>90</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px'}}>
                            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#e53e3e',flexShrink:0}}></div><span style={{flex:1}}>Rejected</span>
                            <div style={{flex:2,height:'9px',background:'#e5e7eb',borderRadius:'5px',overflowHidden}}>
                              <div style={{width:'6%',height:'100%',background:'#e53e3e',borderRadius:'5px'}}></div>
                            </div><span style={{minWidth:'30px',textAlignRight,fontWeight:600}}>80</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px'}}>
                            <div style={{width:'10px',height:'10px',borderRadius:'2px',background:'#9d174d',flexShrink:0}}></div><span style={{flex:1}}>Unapproved</span>
                            <div style={{flex:2,height:'9px',background:'#e5e7eb',borderRadius:'5px',overflowHidden}}>
                              <div style={{width:'2%',height:'100%',background:'#9d174d',borderRadius:'5px'}}></div>
                            </div><span style={{minWidth:'30px',textAlignRight,fontWeight:600}}>7</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:'12.5px',fontWeight:700,color:'#1a2236',marginBottom:'8px'}}>Recent Activity</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'11.5px',padding:'7px 10px',background:'#f8fafd',borderRadius:'6px',border:'1px solid #edf0f5'}}>
                        <span style={{color:'#065f46'}}>🎖️</span><span style={{flex:1}}>Certificate issued — <strong>NACC-2026-00398</strong> (GSP) for Lagos Traders Ltd</span><span style={{color:'#9ca3af'}}>5 min ago</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'11.5px',padding:'7px 10px',background:'#fff8f8',borderRadius:'6px',border:'1px solid #fecaca'}}>
                        <span style={{color:'#9d174d'}}>🚫</span><span style={{flex:1}}>Certificate unapproved — <strong>NACC-2026-00380</strong> (ECOWAS) — Invalid ECOWAS Number</span><span style={{color:'#9ca3af'}}>1 hr ago</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'11.5px',padding:'7px 10px',background:'#f8fafd',borderRadius:'6px',border:'1px solid #edf0f5'}}>
                        <span style={{color:'#1a4a8a'}}>💳</span><span style={{flex:1}}>Payment confirmed — <strong>NACC-2026-00422</strong> · ₦12,031.88 via Paystack</span><span style={{color:'#9ca3af'}}>2 hr ago</span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'11.5px',padding:'7px 10px',background:'#f0fdf4',borderRadius:'6px',border:'1px solid #86efac'}}>
                        <span style={{color:'#065f46'}}>★</span><span style={{flex:1}}>Membership activated — <strong>Kano Agro Ltd</strong> — Member until 31 Dec 2026</span><span style={{color:'#9ca3af'}}>3 hr ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN COMPANIES */}
          {activeScreen === 's-admin-companies' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel — Company Profiles</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-dash')}><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-label">Company Management</div>
                    <div className="sidebar-link active"><span className="sico">🏢</span> Company Profiles</div>
                    <div className="sidebar-label">Configuration</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-fees')}><span className="sico">💰</span> Fee Management</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-staff')}><span className="sico">👥</span> Staff Accounts</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">Company Profiles</div>
                    <div className="page-sub">All registered exporter companies — manage membership and account status</div>
                    <div className="scrollable-table">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>TIN</th>
                            <th>Company Name</th>
                            <th>Email</th>
                            <th>Applications</th>
                            <th>Membership</th>
                            <th>Member Until</th>
                            <th>Account</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{fontFamily:'monospace',fontSize:'11px'}}>12345678901</td>
                            <td><strong>Lagos Traders Ltd</strong></td>
                            <td style={{fontSize:'11px'}}>lagos@traders.ng</td>
                            <td>28</td>
                            <td><span className="badge b-member">★ MEMBER</span></td>
                            <td style={{fontSize:'11px'}}>31 Dec 2026</td>
                            <td><span className="badge b-active">Active</span></td>
                            <td><button className="btn btn-outline btn-sm" onClick={() => setActiveScreen('s-admin-company-detail')}>Manage</button></td>
                          </tr>
                          <tr>
                            <td style={{fontFamily:'monospace',fontSize:'11px'}}>98765432100</td>
                            <td><strong>Abuja Minerals Co.</strong></td>
                            <td style={{fontSize:'11px'}}>info@abujamc.ng</td>
                            <td>14</td>
                            <td><span className="badge b-nonmember">Non-Member</span></td>
                            <td style={{fontSize:'11px',color:'#9ca3af'}}>—</td>
                            <td><span className="badge b-active">Active</span></td>
                            <td><button className="btn btn-outline btn-sm" onClick={() => setActiveScreen('s-admin-company-detail')}>Manage</button></td>
                          </tr>
                          <tr>
                            <td style={{fontFamily:'monospace',fontSize:'11px'}}>55667788990</td>
                            <td><strong>Kano Agro Ltd</strong></td>
                            <td style={{fontSize:'11px'}}>kano@agro.ng</td>
                            <td>9</td>
                            <td><span className="badge b-member">★ MEMBER</span></td>
                            <td style={{fontSize:'11px'}}>31 Dec 2026</td>
                            <td><span className="badge b-active">Active</span></td>
                            <td><button className="btn btn-outline btn-sm" onClick={() => setActiveScreen('s-admin-company-detail')}>Manage</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN COMPANY DETAIL */}
          {activeScreen === 's-admin-company-detail' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel — Company Profile</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-dash')}><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-companies')}><span className="sico">🏢</span> ← Company Profiles</div>
                    <div className="sidebar-link active"><span className="sico">👤</span> Lagos Traders Ltd</div>
                  </nav>
                  <div className="app-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <div className="page-title">Lagos Traders Ltd</div>
                      <div style={{display:'flex',gap:'8px'}}>
                        <span className="badge b-member" style={{fontSize:'11px',padding:'4px 10px'}}>★ MEMBER</span>
                        <span className="badge b-active" style={{fontSize:'11px',padding:'4px 10px'}}>Active Account</span>
                      </div>
                    </div>
                    <div className="page-sub">TIN: 12345678901 &nbsp;|&nbsp; Registered: 12 Jan 2026</div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'16px'}}>
                      <div>
                        <div className="form-section">
                          <div className="form-section-title">
                            <div className="snum">1</div>NRS-Verified Details <span className="version-badge">Locked · NRS API</span>
                          </div>
                          <div className="nrs-verify">
                            <div className="nrs-title">🔒 These fields are locked — retrieved from NRS at registration</div>
                            <div className="form-grid" style={{marginBottom:0}}>
                              <div className="form-group"><label className="form-label">TIN</label><input className="form-input verified" value="12345678901" readOnly style={{fontFamily:'monospace'}} /></div>
                              <div className="form-group"><label className="form-label">Shipper's Name</label><input className="form-input verified" value="Lagos Traders Ltd" readOnly /></div>
                              <div className="form-group form-full"><label className="form-label">Registered Address</label><input className="form-input verified" value="14 Commerce Road, Apapa, Lagos State, Nigeria" readOnly /></div>
                            </div>
                            <div style={{fontSize:'10.5px',color:'#065f46',marginTop:'7px'}}>To correct these fields, make the change here and record the reason — the action will be logged in the audit trail.</div>
                            <button className="btn btn-outline btn-sm" style={{marginTop:'6px'}}>✏️ Override NRS Fields (Admin only)</button>
                          </div>
                        </div>
                        <div className="form-section">
                          <div className="form-section-title">
                            <div className="snum">2</div>Contact Details
                          </div>
                          <div className="form-grid">
                            <div className="form-group"><label className="form-label">Contact Email</label><input className="form-input" value="lagos@traders.ng" /></div>
                            <div className="form-group"><label className="form-label">Phone Number</label><input className="form-input" value="+234 802 000 1234" /></div>
                          </div>
                        </div>
                        <div className="form-section">
                          <div className="form-section-title">
                            <div className="snum">3</div>Account Status
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'10px 12px',background:'#f8fafd',border:'1px solid #dde3ee',borderRadius:'6px'}}>
                            <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
                            <div>
                              <div style={{fontSize:'12px',fontWeight:600,color:'#1a2236'}}>Account Active</div>
                              <div style={{fontSize:'10.5px',color:'#6b7280'}}>Toggle to disable — exporter cannot log in while inactive</div>
                            </div>
                          </div>
                        </div>
                        <button className="btn btn-primary">Save Contact &amp; Status Changes</button>
                      </div>

                      <div>
                        <div className="config-panel">
                          <div className="cp-title">★ Membership Management <span className="version-badge">v2.2</span></div>
                          <div style={{marginBottom:'12px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',background:'#d1fae5',border:'1px solid #86efac',borderRadius:'6px',marginBottom:'8px'}}>
                              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
                              <div>
                                <div style={{fontSize:'12px',fontWeight:700,color:'#065f46'}}>NACCIMA Member</div>
                                <div style={{fontSize:'10px',color:'#065f46'}}>Member rates apply when active</div>
                              </div>
                            </div>
                            <div className="form-group" style={{marginBottom:'10px'}}>
                              <label className="form-label">Membership Start Date <span className="req">*</span></label>
                              <input className="form-input" type="date" value="2026-01-01" />
                            </div>
                            <div className="form-group" style={{marginBottom:'10px'}}>
                              <label className="form-label">Membership End Date <span className="req">*</span></label>
                              <input className="form-input" type="date" value="2026-12-31" />
                            </div>
                            <div style={{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'5px',padding:'7px 9px',fontSize:'11px',color:'#065f46',marginBottom:'10px'}}>
                              ✅ Active Member: 1 Jan 2026 – 31 Dec 2026<br/>
                              <span style={{color:'#374151',fontSize:'10.5px'}}>Fee calculation will use member rates for applications submitted within this period.</span>
                            </div>
                            <button className="btn btn-success" style={{width:'100%',justifyContent:'center',marginBottom:'6px'}}>Save Membership Status</button>
                            <div style={{fontSize:'10.5px',color:'#9ca3af',textAlign:'center'}}>Changes are recorded in the audit log</div>
                          </div>
                          <hr style={{border:'none',borderTop:'1px solid #e5e7eb',margin:'10px 0'}} />
                          <div className="cp-title" style={{fontSize:'11.5px'}}>Membership Change Log</div>
                          <div style={{fontSize:'11px',display:'flex',flexDirection:'column',gap:'5px'}}>
                            <div style={{padding:'5px 7px',background:'#f8fafd',borderRadius:'4px',border:'1px solid #edf0f5'}}>
                              <div style={{fontWeight:600,color:'#1a2236'}}>Member activated</div>
                              <div style={{color:'#6a7a9a'}}>12 Jan 2026 by Admin Chukwu</div>
                              <div style={{color:'#6a7a9a'}}>1 Jan 2026 → 31 Dec 2026</div>
                            </div>
                            <div style={{padding:'5px 7px',background:'#f8fafd',borderRadius:'4px',border:'1px solid #edf0f5'}}>
                              <div style={{fontWeight:600,color:'#1a2236'}}>Non-Member → Member</div>
                              <div style={{color:'#6a7a9a'}}>10 Jan 2026 by Admin Chukwu</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN STAFF */}
          {activeScreen === 's-admin-staff' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel — Staff Accounts</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-dash')}><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-companies')}><span className="sico">🏢</span> Company Profiles</div>
                    <div className="sidebar-label">Configuration</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-fees')}><span className="sico">💰</span> Fee Management</div>
                    <div className="sidebar-link active"><span className="sico">👥</span> Staff Accounts</div>
                  </nav>
                  <div className="app-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <div className="page-title">Staff Accounts</div>
                      <button className="btn btn-primary btn-sm">➕ Create Staff Account</button>
                    </div>
                    <div className="page-sub">Staff cannot self-register. Accounts are created and managed here by Admins.</div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'16px'}}>
                      <div>
                        <div className="scrollable-table">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Staff Member</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Reviews (Month)</th>
                                <th>Last Login</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                    <div className="staff-avatar">AN</div>Mrs. Adaobi Nwosu
                                  </div>
                                </td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>a.nwosu</td>
                                <td><span className="badge b-info">Vetting Officer</span></td>
                                <td>48</td>
                                <td>Today 09:12</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><div className="actions"><button className="btn btn-outline btn-sm">Edit</button><button className="btn btn-outline btn-sm">Disable</button></div></td>
                              </tr>
                              <tr>
                                <td>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                    <div className="staff-avatar" style={{background:'#5521b5'}}>BO</div>Mr. Babatunde Okafor
                                  </div>
                                </td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>b.okafor</td>
                                <td><span className="badge b-info">Vetting Officer</span></td>
                                <td>31</td>
                                <td>Today 08:55</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><div className="actions"><button className="btn btn-outline btn-sm">Edit</button><button className="btn btn-outline btn-sm">Disable</button></div></td>
                              </tr>
                              <tr>
                                <td>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                    <div className="staff-avatar" style={{background:'#1e8449'}}>EC</div>Ms. Emeka Chukwu
                                  </div>
                                </td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>e.chukwu</td>
                                <td><span className="badge b-purple">Admin</span></td>
                                <td>—</td>
                                <td>Yesterday</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><div className="actions"><button className="btn btn-outline btn-sm">Edit</button><button className="btn btn-outline btn-sm">Disable</button></div></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="config-panel">
                        <div className="cp-title">➕ Create Staff Account</div>
                        <div className="form-group" style={{marginBottom:'10px'}}><label className="form-label">Full Name <span className="req">*</span></label><input className="form-input" placeholder="First and last name" /></div>
                        <div className="form-group" style={{marginBottom:'10px'}}><label className="form-label">Username <span className="req">*</span></label><input className="form-input" placeholder="e.g. j.doe" style={{fontFamily:'monospace'}} /><div className="form-hint">Used to log in. Cannot be changed after creation.</div></div>
                        <div className="form-group" style={{marginBottom:'10px'}}><label className="form-label">Email Address <span className="req">*</span></label><input className="form-input" placeholder="staff@naccima.com" /></div>
                        <div className="form-group" style={{marginBottom:'10px'}}><label className="form-label">Role <span className="req">*</span></label><select className="form-select"><option>-- Select Role --</option><option selected>Vetting Officer</option><option>Admin</option><option>Super Admin</option></select></div>
                        <div className="form-group" style={{marginBottom:'12px'}}><label className="form-label">Temporary Password <span className="req">*</span></label><input className="form-input" type="password" placeholder="Min 8 chars" /><div className="form-hint">Staff will be prompted to change on first login.</div></div>
                        <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>Create Account</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN FEES */}
          {activeScreen === 's-admin-fees' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel — Fee Management</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-dash')}><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-companies')}><span className="sico">🏢</span> Company Profiles</div>
                    <div className="sidebar-label">Configuration</div>
                    <div className="sidebar-link active"><span className="sico">💰</span> Fee Management</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-staff')}><span className="sico">👥</span> Staff Accounts</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-certs')}><span className="sico">⚙️</span> Certificate Types</div>
                  </nav>
                  <div className="app-content">
                    <div className="page-title">Fee Management</div>
                    <div className="page-sub">Member and Non-Member fee schedules per certificate type — as per v2.2 requirements</div>
                    <div className="alert alert-info" style={{marginBottom:'14px'}}>
                      <span>ℹ️</span><span>Fee changes take effect for applications submitted after the save date. In-flight applications retain the fee calculated at submission time.</span>
                    </div>
                    <div className="scrollable-table" style={{marginBottom:'16px'}}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Certificate Type</th>
                            <th>Fee Basis</th>
                            <th>Member Rate</th>
                            <th>Non-Member Rate</th>
                            <th>VAT</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{background:'#fffbeb'}}>
                            <td><strong>NACCIMA Certificate of Origin</strong></td>
                            <td><span className="badge b-info">% of FOB (USD→NGN)</span></td>
                            <td style={{fontWeight:700,color:'#065f46'}}>0.11% of FOB</td>
                            <td style={{fontWeight:700,color:'#9b1c1c'}}>0.125% of FOB</td>
                            <td>7.5%</td>
                            <td style={{fontSize:'10.5px',color:'#6a7a9a'}}>FOB entered in USD; converted at prevailing CBN rate</td>
                            <td><button className="btn btn-outline btn-sm">Edit</button></td>
                          </tr>
                          <tr>
                            <td><strong>GSP Certificate</strong></td>
                            <td><span className="badge b-draft">Flat Rate (NGN)</span></td>
                            <td style={{fontWeight:700,color:'#065f46'}}>₦25,000</td>
                            <td style={{fontWeight:700,color:'#9b1c1c'}}>₦32,000</td>
                            <td>7.5%</td>
                            <td style={{fontSize:'10.5px',color:'#6a7a9a'}}>Fixed flat fee regardless of FOB value</td>
                            <td><button className="btn btn-outline btn-sm">Edit</button></td>
                          </tr>
                          <tr>
                            <td><strong>ECOWAS Free Trade</strong></td>
                            <td><span className="badge b-draft">Flat Rate (NGN)</span></td>
                            <td style={{fontWeight:700,color:'#065f46'}}>₦40,000</td>
                            <td style={{fontWeight:700,color:'#9b1c1c'}}>₦52,000</td>
                            <td>7.5%</td>
                            <td style={{fontSize:'10.5px',color:'#6a7a9a'}}>—</td>
                            <td><button className="btn btn-outline btn-sm">Edit</button></td>
                          </tr>
                          <tr>
                            <td><strong>Movement Certificate</strong></td>
                            <td><span className="badge b-draft">Flat Rate (NGN)</span></td>
                            <td style={{fontWeight:700,color:'#065f46'}}>₦40,000</td>
                            <td style={{fontWeight:700,color:'#9b1c1c'}}>₦52,000</td>
                            <td>7.5%</td>
                            <td style={{fontSize:'10.5px',color:'#6a7a9a'}}>No HS Code required</td>
                            <td><button className="btn btn-outline btn-sm">Edit</button></td>
                          </tr>
                          <tr>
                            <td><strong>Solid Mineral Certificate</strong></td>
                            <td><span className="badge b-draft">Flat Rate (NGN)</span></td>
                            <td style={{fontWeight:700,color:'#065f46'}}>₦150,000</td>
                            <td style={{fontWeight:700,color:'#9b1c1c'}}>₦250,000</td>
                            <td>7.5%</td>
                            <td style={{fontSize:'10.5px',color:'#6a7a9a'}}>Premium rate for mineral exports</td>
                            <td><button className="btn btn-outline btn-sm">Edit</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: ADMIN CERTS */}
          {activeScreen === 's-admin-certs' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar" style={{background:'#2d1b69'}}>
                  <div className="brand">NACCIMA <span>Admin Panel — Certificate Configuration</span></div>
                  <div className="topbar-right">
                    <div className="tb-user">
                      <div className="tb-avatar" style={{background:'#6d3bce'}}>DG</div><span className="tb-uname">Director-General</span>
                    </div>
                  </div>
                </div>
                <div className="app-body">
                  <nav className="app-sidebar">
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-dash')}><span className="sico">📊</span> Dashboard</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-companies')}><span className="sico">🏢</span> Company Profiles</div>
                    <div className="sidebar-label">Configuration</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-fees')}><span className="sico">💰</span> Fee Management</div>
                    <div className="sidebar-link" onClick={() => setActiveScreen('s-admin-staff')}><span className="sico">👥</span> Staff Accounts</div>
                    <div className="sidebar-link active"><span className="sico">⚙️</span> Certificate Types</div>
                  </nav>
                  <div className="app-content">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <div className="page-title">Certificate Types</div>
                      <button className="btn btn-primary btn-sm">➕ Add Certificate Type</button>
                    </div>
                    <div className="page-sub">Configure fields, required documents, and certificate number format per type</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'16px'}}>
                      <div>
                        <div className="scrollable-table">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Certificate</th>
                                <th>Code</th>
                                <th>Applications</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{background:'#f0f7ff'}}>
                                <td><strong>Certificate of Origin</strong></td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>NACC-CO</td>
                                <td>482</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><button className="btn btn-outline btn-sm">✏️ Edit</button></td>
                              </tr>
                              <tr>
                                <td><strong>GSP Certificate</strong></td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>NACC-GSP</td>
                                <td>320</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><button className="btn btn-outline btn-sm">✏️ Edit</button></td>
                              </tr>
                              <tr>
                                <td><strong>ECOWAS Free Trade</strong></td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>NACC-ETLS</td>
                                <td>214</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><button className="btn btn-outline btn-sm">✏️ Edit</button></td>
                              </tr>
                              <tr>
                                <td><strong>Movement Certificate</strong></td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>NACC-MV</td>
                                <td>118</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><button className="btn btn-outline btn-sm">✏️ Edit</button></td>
                              </tr>
                              <tr>
                                <td><strong>Solid Mineral Certificate</strong></td>
                                <td style={{fontFamily:'monospace',fontSize:'11px'}}>NACC-SM</td>
                                <td>150</td>
                                <td><span className="badge b-active">Active</span></td>
                                <td><button className="btn btn-outline btn-sm">✏️ Edit</button></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="config-panel">
                        <div className="cp-title">✏️ Editing: Certificate of Origin</div>
                        <div className="form-group" style={{marginBottom:'10px'}}><label className="form-label">Display Name</label><input className="form-input" value="NACCIMA Certificate of Origin" /></div>
                        <div className="form-grid" style={{marginBottom:'10px'}}>
                          <div className="form-group"><label className="form-label">Code</label><input className="form-input" value="NACC-CO" style={{fontFamily:'monospace'}} /></div>
                          <div className="form-group"><label className="form-label">Cert # Prefix</label><input className="form-input" value="CO/" style={{fontFamily:'monospace'}} /></div>
                        </div>
                        <div style={{fontSize:'11px',fontWeight:700,color:'#374151',marginBottom:'6px'}}>Applicable Fields <span style={{fontWeight:400,color:'#9ca3af'}}>(toggle to show/hide on form)</span></div>
                        <div style={{maxHeight:'220px',overflowY:'auto',border:'1px solid #e5e7eb',borderRadius:'6px',padding:'3px 7px'}}>
                          <div className="field-toggle"><span>TIN (read-only, always shown)</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Shipper's Name (NRS-locked)</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Shipper's Address (NRS-locked)</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Mode of Transport</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Consignee</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Carrier</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Destination</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>HS Code</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>FOB Value (USD for CoO)</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>Marks / No.</span><div className="toggle on"></div></div>
                          <div className="field-toggle"><span>ECOWAS Number</span><div className="toggle"></div></div>
                          <div className="field-toggle"><span>Criteria (ETLS)</span><div className="toggle"></div></div>
                          <div className="field-toggle"><span>Unit of Measurement</span><div className="toggle"></div></div>
                        </div>
                        <div style={{fontSize:'11px',fontWeight:700,color:'#374151',marginTop:'10px',marginBottom:'6px'}}>Required Documents</div>
                        <div style={{fontSize:'11px',color:'#6a7a9a',background:'#f8fafd',border:'1px solid #dde3ee',borderRadius:'5px',padding:'7px 9px'}}>
                          Conditional on Mode of Transport (FR-54):<br/>
                          • Land: Invoice + Packing List<br/>
                          • Air: Airway Bill + Invoice + Packing List<br/>
                          • Sea: Bill of Lading + Invoice + Packing List
                        </div>
                        <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                          <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}}>Save Changes</button>
                          <button className="btn btn-outline btn-sm">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: CERTIFICATE VERIFICATION */}
          {activeScreen === 's-cert-verify' && (
            <div className="screen active">
              <div className="app-shell">
                <div className="app-topbar">
                  <div className="brand">NACCIMA <span>Certificate Verification</span></div>
                  <div className="topbar-right">
                    <div style={{fontSize:'11.5px',color:'#7ec8e3'}}>Public — No login required</div>
                  </div>
                </div>
                <div className="app-body" style={{minHeight:'480px'}}>
                  <div className="app-content" style={{maxWidth:'680px',margin:'0 auto',paddingTop:'28px'}}>
                    <div style={{textAlign:'center',marginBottom:'22px'}}>
                      <div style={{fontSize:'17px',fontWeight:700,color:'#1a2236',marginBottom:'4px'}}>Certificate Authenticity Verification</div>
                      <div style={{fontSize:'12px',color:'#6a7a9a'}}>Enter a certificate number to confirm its validity and authenticity</div>
                    </div>
                    <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
                      <input className="form-input" style={{flex:1,fontSize:'14px',fontFamily:'monospace',letterSpacing:'1px'}} placeholder="Enter certificate number — e.g. CO/2026/00398" value="CO/2026/00398" />
                      <button className="btn btn-primary" style={{padding:'8px 20px',fontSize:'13px'}}>Verify</button>
                    </div>

                    <div style={{border:'2px solid #065f46',borderRadius:'10px',overflow:'hidden',marginBottom:'16px'}}>
                      <div style={{background:'#065f46',padding:'12px 18px',display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{fontSize:'20px'}}>✅</span>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>VALID CERTIFICATE</div>
                          <div style={{fontSize:'11px',color:'#a7f3d0'}}>This certificate is authentic and currently valid</div>
                        </div>
                      </div>
                      <div style={{padding:'14px 18px',background:'#f0fdf4'}}>
                        <div className="info-kv" style={{gridTemplateColumns:'160px 1fr'}}>
                          <span className="k">Certificate Number</span><span className="v" style={{fontFamily:'monospace'}}>CO/2026/00398</span>
                          <span className="k">Certificate Type</span><span className="v">NACCIMA Certificate of Origin</span>
                          <span className="k">Issued To</span><span className="v">Lagos Traders Ltd (TIN: 12345678901)</span>
                          <span className="k">Consignee</span><span className="v">UK Commodities PLC, United Kingdom</span>
                          <span className="k">HS Code</span><span className="v" style={{fontFamily:'monospace'}}>0901.11 — Coffee, not roasted, not decaffeinated</span>
                          <span className="k">Issue Date</span><span className="v">20 Mar 2026</span>
                          <span className="k">Issued By</span><span className="v">NACCIMA — Nigerian Association of Chambers of Commerce</span>
                        </div>
                      </div>
                    </div>

                    <div style={{border:'2px solid #9b1c1c',borderRadius:'10px',overflow:'hidden'}}>
                      <div style={{background:'#9b1c1c',padding:'12px 18px',display:'flex',alignItems:'center',gap:'10px'}}>
                        <span style={{fontSize:'20px'}}>🚫</span>
                        <div>
                          <div style={{fontSize:'14px',fontWeight:800,color:'#fff'}}>REVOKED / VOID</div>
                          <div style={{fontSize:'11px',color:'#fecaca'}}>This certificate has been revoked and is no longer valid</div>
                        </div>
                      </div>
                      <div style={{padding:'14px 18px',background:'#fff5f5'}}>
                        <div className="info-kv" style={{gridTemplateColumns:'160px 1fr'}}>
                          <span className="k">Certificate Number</span><span className="v" style={{fontFamily:'monospace'}}>ETLS/2026/00380</span>
                          <span className="k">Original Issue Date</span><span className="v">17 Mar 2026</span>
                          <span className="k">Revocation Date</span><span className="v">28 Mar 2026</span>
                          <span className="k">Revoked By</span><span className="v">NACCIMA Admin</span>
                        </div>
                        <div className="alert alert-danger" style={{marginTop:'10px',marginBottom:0}}><span>⚠️</span><span>Do not accept this certificate. Contact NACCIMA if you believe this is in error: <strong>certificates@naccima.com</strong></span></div>
                      </div>
                    </div>

                    <div style={{textAlign:'center',marginTop:'14px',fontSize:'11px',color:'#9ca3af'}}>
                      For enquiries: <span style={{color:'#3a7bd5'}}>certificates@naccima.com</span> &nbsp;|&nbsp; Powered by NACCIMA E-Certificate Platform
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
