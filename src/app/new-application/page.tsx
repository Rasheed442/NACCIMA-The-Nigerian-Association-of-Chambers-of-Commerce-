'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewApplication() {
  const router = useRouter();
  const [selectedCert, setSelectedCert] = useState(0);
  const [step, setStep] = useState(1);
  const [transportMode, setTransportMode] = useState('sea');

  return (
    <div className="h-screen flex flex-col">
      <div className="h-full flex flex-col bg-white overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.1)]">
        <div className="h-[50px] bg-[#1a3a5c] flex items-center px-[20px] gap-3 flex-shrink-0">
          <div className="text-[15px] font-extrabold text-white tracking-[0.3px]">NACCIMA <span className="text-[#7ec8e3] text-[11px] font-normal ml-1">E-Certificate Platform</span></div>
          <div className="ml-auto flex items-center gap-[14px]">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-[30px] h-[30px] rounded-full bg-[#2c6ea3] flex items-center justify-center text-[11px] font-bold text-white">LT</div>
              <span className="text-[12px] text-[#c8ddf0] font-medium">Lagos Traders Ltd</span>
            </div>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden min-h-[560px]">
          <nav className="w-[200px] bg-[#f8fafd] border-r border-[#dde3ee] flex-shrink-0 py-[18px] overflow-hidden">
            <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all hover:bg-[#edf2ff] hover:text-[#2c4a7a]" onClick={() => router.push('/exporter-dashboard')}>
              <span className=" w-[15px] text-center">🏠</span> Dashboard
            </div>
            <div className="px-[16px] py-[10px] flex items-center gap-2 text-[13px] text-[#4a5a7a] cursor-pointer border-l-3 border-transparent transition-all bg-[#e8f0fe] text-[#1a4a8a] border-l-[#3a7bd5] font-semibold">
              <span className=" w-[15px] text-center">➕</span> New Application
            </div>
          </nav>
          <div className="flex-1 px-[22px] py-[20px] overflow-x-hidden overflow-auto">
            {step === 1 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">New Certificate Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 1 of 4 — Select the certificate type</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <span className="text-[13px] font-semibold text-[#1a4a8a]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#3a7bd5]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#1a4a8a]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#1a4a8a]"></div>
                  <div className="flex  items-center gap-2">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#1a4a8a] bg-[#1a4a8a] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[13px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>
                <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                  ★ NACCIMA Member — member rates apply to your application
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    {icon:'📜',name:'NACCIMA Certificate of Origin',desc:'Confirms Nigerian origin of exported goods. FOB entered in USD and converted to NGN for fee calculation.',tag:'Most Common · Member: 0.11% FOB'},
                    {icon:'🌍',name:'GSP Certificate',desc:'Enables preferential tariff rates under the Generalised System of Preferences scheme.',tag:'Member: ₦25,000'},
                    {icon:'🤝',name:'ECOWAS Free Trade Certificate',desc:'Facilitates tariff-free movement under ETLS. Requires ECOWAS Number and Criteria fields.',tag:'Needs ECOWAS No. · Member: ₦40,000'},
                    {icon:'🚚',name:'Movement Certificate',desc:'Accompanies goods in transit. HS Code classification not required for this type.',tag:'No HS Code · Member: ₦40,000'},
                    {icon:'⛏️',name:'Solid Mineral Certificate',desc:'For solid mineral exports. Includes Unit of Measurement, ECOWAS Number, and Criteria fields.',tag:'Minerals Only · Member: ₦150,000'},
                  ].map((cert, index) => (
                    <div key={index} className={`p-4 rounded-[8px] border cursor-pointer transition-all ${selectedCert === index ? 'border-[#3a7bd5] bg-[#e8f0fe]' : 'border-[#dde3ee] hover:border-[#3a7bd5]'}`} onClick={() => setSelectedCert(index)}>
                      <div className="text-[24px] mb-2">{cert.icon}</div>
                      <div className="text-[13px] font-bold text-[#1a2236] mb-1">{cert.name}</div>
                      <div className="text-[11px] text-[#6a7a9a] mb-2">{cert.desc}</div>
                      <div className="text-[10px] text-[#3a7bd5] font-semibold">{cert.tag}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => router.push('/exporter-dashboard')}>Cancel</button>
                  <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => setStep(2)}>Continue with Certificate of Origin →</button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">New Certificate Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 2 of 4 — Enter shipment details</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <span className="text-[10px] font-semibold text-[#3a7bd5]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>
                <div className="flex items-center gap-[10px] px-[12px] py-[8px] rounded-[7px] mb-4 text-[12px] font-semibold bg-[#d1fae5] text-[#065f46] border border-[#86efac]">
                  ★ NACCIMA Member — member rates apply to your application
                </div>

                {/* Section 1: Shipper/Exporter Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Shipper / Exporter Details</div>
                    <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">NRS-Verified · Read-Only</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">TIN <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6] font-mono tracking-widest" value="12345678901" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 From your company profile — cannot be changed</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Importer Email</label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="importer@overseas.com" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Shipper's Name <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6]" value="Lagos Traders Ltd" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 NRS-verified name — contact Admin to correct</div>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-semibold text-[#374151]">Shipper's Address <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-[#f3f4f6]" value="14 Commerce Road, Apapa, Lagos State, Nigeria" readOnly />
                      <div className="text-[10px] text-[#6b7280]">🔒 NRS-verified address — contact Admin to correct</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Mode of Transport */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Mode of Transport <span className="text-[#e53e3e]">*</span></div>
                    <span className="text-[10px] bg-[#dbeafe] text-[#1e40af] px-2 py-[2px] rounded-[10px] font-semibold">New in v2.2</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      {mode:'land',icon:'🚛',name:'Land',docs:'Required docs: Invoice + Packing List'},
                      {mode:'air',icon:'✈️',name:'Air',docs:'Required docs: Airway Bill + Invoice + Packing List'},
                      {mode:'sea',icon:'🚢',name:'Sea',docs:'Required docs: Bill of Lading + Invoice + Packing List'},
                    ].map((t) => (
                      <div key={t.mode} className={`p-4 rounded-[8px] border cursor-pointer transition-all text-center ${transportMode === t.mode ? 'border-[#3a7bd5] bg-[#e8f0fe]' : 'border-[#dde3ee] hover:border-[#3a7bd5]'}`} onClick={() => setTransportMode(t.mode)}>
                        <div className="text-[24px] mb-2">{t.icon}</div>
                        <div className="text-[12px] font-bold text-[#1a2236] mb-1">{t.name}</div>
                        <div className="text-[10px] text-[#6a7a9a]">{t.docs}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#dbeafe] text-[#11px] text-[#1e40af]">
                    <span>ℹ️</span>
                    <span><strong>Sea selected:</strong> You must upload Bill of Lading, Commercial Invoice, and Packing List before submitting.</span>
                  </div>
                </div>

                {/* Section 3: Consignee & Shipment Details */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Consignee & Shipment Details</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Consignee Name <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Receiving company or person" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Carrier <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="e.g. Maersk Line" />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-semibold text-[#374151]">Consignee Address <span className="text-[#e53e3e]">*</span></label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Full address of consignee at destination" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Destination Country <span className="text-[#e53e3e]">*</span></label>
                      <select className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]">
                        <option>-- Select Country --</option>
                        <option selected>United Kingdom</option>
                        <option>Germany</option>
                        <option>United States</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Country of Manufacturing <span className="text-[#e53e3e]">*</span></label>
                      <select className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]">
                        <option selected>Nigeria</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Total Value (FOB) in USD <span className="text-[#e53e3e]">*</span> <span className="text-[10px] bg-[#fef3c7] text-[#92400e] px-2 py-[2px] rounded-[10px] font-semibold">USD for CoO</span></label>
                      <div className="flex items-center gap-1">
                        <span className="text-[13px] font-bold text-[#92400e]">$</span>
                        <input className="flex-1 px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="0.00" value="5,000.00" />
                      </div>
                      <div className="text-[10px] text-[#6b7280]">FOB value in US Dollars. Converted to NGN at prevailing rate for fee calculation.</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-[#374151]">Bulk Product Qty (MT)</label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Metric tonnes" />
                    </div>
                    <div className="flex flex-col gap-1 col-span-2">
                      <label className="text-[11px] font-semibold text-[#374151]">Marks / No.</label>
                      <input className="px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="Shipping marks & package numbers" />
                    </div>
                  </div>
                </div>

                {/* Section 4: HS Code Lookup */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">HS Code Lookup</div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-[6px] bg-[#e8f0fe] border border-[#3a7bd5] mb-3">
                    <div><span className="text-[12px] font-bold text-[#1a4a8a]">0901.11</span>&nbsp;&nbsp;<span className="text-[11px] text-[#374151]">Coffee, not roasted, not decaffeinated</span></div>
                    <span className="text-[10px] text-[#3a7bd5] cursor-pointer font-semibold">Change</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input className="flex-1 px-[10px] py-[7px] border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="🔍 Search by HS code or description…" />
                    <button className="px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]">Search</button>
                  </div>
                  <div className="space-y-1">
                    {[
                      {code:'0901.11',desc:'Coffee, not roasted, not decaffeinated'},
                      {code:'0901.12',desc:'Coffee, not roasted, decaffeinated'},
                      {code:'0901.21',desc:'Coffee, roasted, not decaffeinated'},
                    ].map((hs, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 rounded-[6px] hover:bg-[#edf2ff] cursor-pointer">
                        <span className="text-[12px] font-bold text-[#1a4a8a]">{hs.code}</span>
                        <span className="text-[11px] text-[#374151]">{hs.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5: Goods Line Items */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">5</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Goods Line Items</div>
                  </div>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Description <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Marks/No.</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">QTY <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Gross Wt.</th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Nomenclature <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD) <span className="text-[#e53e3e]">*</span></th>
                          <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-[#f8faff]">
                          <td className="px-2 py-2 border-b border-[#edf0f5] text-[#9ca3af] text-[11px]">1</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" value="0901.11" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[140px]" value="Arabica Coffee Beans" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" value="PKG-001" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[60px]" value="500 KG" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" value="520.5" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[120px]" value="Coffee, not roasted" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[85px]" value="5,000.00" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5] text-center cursor-pointer text-[#e53e3e]">✕</td>
                        </tr>
                        <tr className="hover:bg-[#f8faff]">
                          <td className="px-2 py-2 border-b border-[#edf0f5] text-[#9ca3af] text-[11px]">2</td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" placeholder="Code" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[140px]" placeholder="Description" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" placeholder="Marks" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[60px]" placeholder="QTY" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[65px]" placeholder="KG" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[120px]" placeholder="Nomenclature" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5]"><input className="px-2 py-1 border border-[#d1d5db] rounded-[4px] text-[11px] w-[85px]" placeholder="0.00" /></td>
                          <td className="px-2 py-2 border-b border-[#edf0f5] text-center cursor-pointer text-[#e53e3e]">✕</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">➕ Add Line Item</button>
                </div>

                {/* Section 6: Supporting Documents */}
                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-5 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-[20px] h-[20px] rounded-full bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">6</div>
                    <div className="text-[13px] font-bold text-[#1a2236]">Supporting Documents</div>
                    <span className="text-[10px] text-[#9ca3af]">Sea transport — 3 documents required</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="border-[1.5px] border-dashed border-[#3a7bd5] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#3a7bd5] bg-[#f0f7ff] text-center min-w-[140px]">
                      ✅ Bill of Lading<br /><span className="text-[10px] text-[#6a7a9a]">BOL_2026.pdf — 1.2MB</span>
                    </div>
                    <div className="border-[1.5px] border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                      📎 Commercial Invoice<br /><span className="text-[10px] text-[#e53e3e]">Required ✕</span>
                    </div>
                    <div className="border-[1.5px] border-dashed border-[#d1d5db] rounded-[6px] px-[14px] py-[10px] text-[11px] text-[#6a7a9a] cursor-pointer text-center min-w-[140px] hover:border-[#3a7bd5] hover:text-[#3a7bd5]">
                      📎 Packing List<br /><span className="text-[10px] text-[#e53e3e]">Required ✕</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-[6px] bg-[#fef3c7] text-[11px] text-[#92400e]">
                    <span>⚠️</span>
                    <span>Commercial Invoice and Packing List are required for Sea transport. Upload before submitting.</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => setStep(1)}>← Back</button>
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]">💾 Save Draft</button>
                  <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => setStep(3)}>Continue →</button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <div className="text-[16px] font-bold text-[#1a2236] mb-[3px]">Review Your Application</div>
                <div className="text-[11.5px] text-[#6a7a9a] mb-5">Step 3 of 4 — Confirm all details before submitting</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                    <span className="text-[10px] font-semibold text-[#059669]">Application Details</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#059669]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">3</div>
                    <span className="text-[10px] font-semibold text-[#3a7bd5]">Review & Submit</span>
                  </div>
                  <div className="h-[2px] flex-1 bg-[#e2e8f0]"></div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-[24px] h-[24px] rounded-full border-2 border-[#e2e8f0] bg-[#e2e8f0] text-[#64748b] text-[11px] font-bold flex items-center justify-center">4</div>
                    <span className="text-[10px] font-semibold text-[#64748b]">Payment</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                    <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Certificate Type</div>
                    <div className="text-[13.5px] font-bold text-[#1a2236]">📜 NACCIMA Certificate of Origin</div>
                  </div>
                  <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                    <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Exporter</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Company</span><span className="text-[#1a2236]">Lagos Traders Ltd</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">TIN</span><span className="text-[#1a2236] font-mono">12345678901</span></div>
                      <div className="flex justify-between text-[11px]"><span className="text-[#6a7a9a]">Membership</span><span className="text-[10px] font-bold px-2 py-[2px] rounded-[10px] bg-[#d1fae5] text-[#065f46]">★ MEMBER</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4 mb-3">
                  <div className="text-[10.5px] font-bold text-[#6a7a9a] mb-2">Shipment Details</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Consignee</span><br/><span className="text-[#1a2236]">UK Commodities PLC</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Destination</span><br/><span className="text-[#1a2236]">United Kingdom</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Mode of Transport</span><br/><span className="text-[#1a2236]">🚢 Sea</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Carrier</span><br/><span className="text-[#1a2236]">Maersk Line</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Country of Mfg</span><br/><span className="text-[#1a2236]">Nigeria</span></div>
                    <div className="text-[11px]"><span className="text-[#6a7a9a]">Bulk Qty (MT)</span><br/><span className="text-[#1a2236]">500 MT</span></div>
                  </div>
                </div>

                <div className="text-[12.5px] font-bold text-[#1a2236] mb-2">Goods Line Items</div>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f1f4f9] text-[#4a5a7a] font-semibold">
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">#</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">HS Code</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Description</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">QTY</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Gross Wt.</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Nomenclature</th>
                        <th className="px-2 py-2 text-left border-b-2 border-[#dde3ee]">Value (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-[#f8faff]">
                        <td className="px-2 py-2 border-b border-[#edf0f5]">1</td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]"><span className="font-mono font-bold text-[#1a4a8a]">0901.11</span></td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]">Arabica Coffee Beans</td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]">500 KG</td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]">520.5 KG</td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]">Coffee, not roasted</td>
                        <td className="px-2 py-2 border-b border-[#edf0f5]">$5,000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-[12.5px] font-bold text-[#1a2236] mb-2">Supporting Documents</div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-[11.5px] text-[#065f46]">✅ Bill of Lading — BOL_2026.pdf</div>
                      <div className="flex items-center gap-2 text-[11.5px] text-[#e53e3e]">⚠️ Commercial Invoice — Not uploaded</div>
                      <div className="flex items-center gap-2 text-[11.5px] text-[#e53e3e]">⚠️ Packing List — Not uploaded</div>
                    </div>
                  </div>
                  <div>
                    <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-[8px] p-4 mb-3">
                      <div className="text-[11px] font-bold text-[#92400e] mb-2">💱 FOB Value Conversion (Certificate of Origin)</div>
                      <div className="flex justify-between text-[11px] mb-1"><span>FOB Value (USD)</span><span className="font-bold text-[#1a2236]">$5,000.00</span></div>
                      <div className="flex justify-between text-[11px] mb-1"><span>Exchange Rate (USD/NGN)</span><span className="font-bold text-[#1a2236]">₦1,580.00</span></div>
                      <div className="flex justify-between text-[10px] text-[#9ca3af] mb-1"><span>Rate retrieved</span><span>30 Jun 2026, 09:15 AM (cached ≤1hr)</span></div>
                      <div className="flex justify-between text-[11px] font-bold border-t border-[#fbbf24] pt-2 mt-1"><span>FOB Value (NGN)</span><span className="font-bold text-[#1a2236]">₦7,900,000.00</span></div>
                    </div>
                    <div className="bg-[#f8fafd] border border-[#dde3ee] rounded-[8px] p-4">
                      <div className="flex justify-between text-[11px] mb-1"><span className="text-[#065f46] font-semibold">★ Member Rate Applied</span><span className="text-[#065f46] text-[10.5px] font-semibold">0.11% of FOB</span></div>
                      <div className="flex justify-between text-[11px] mb-1"><span>Certificate Fee (0.11% × ₦7,900,000)</span><span className="font-semibold text-[#1a2236]">₦8,690.00</span></div>
                      <div className="flex justify-between text-[11px] mb-1"><span>Processing Fee</span><span className="font-semibold text-[#1a2236]">₦2,500.00</span></div>
                      <div className="flex justify-between text-[11px] mb-1"><span>VAT (7.5%)</span><span className="font-semibold text-[#1a2236]">₦841.88</span></div>
                      <div className="flex justify-between text-[11px] font-bold border-t border-[#dde3ee] pt-2 mt-1"><span>Total Payable</span><span className="font-bold text-[#1a2236]">₦12,031.88</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#edf0f5]">
                  <button className="inline-flex items-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-white text-[#2a3a56] border border-[#ccd3e0] hover:bg-[#f1f4f9]" onClick={() => setStep(2)}>← Back to Edit</button>
                  <button className="inline-flex items-center justify-center gap-1 px-[14px] py-[7px] rounded-[6px] text-[12px] font-semibold cursor-pointer border-none transition-all bg-[#1a4a8a] text-white hover:bg-[#153c70]" onClick={() => setStep(4)}>Submit & Proceed to Payment →</button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="flex flex-col items-center pt-6">
                  <div className="text-[16px] font-bold text-[#1a2236] mb-1 text-center">Secure Payment</div>
                  <div className="text-[11.5px] text-[#6a7a9a] mb-5 text-center">Step 4 of 4 — Application NACC-2026-00422 submitted. Complete payment to begin processing.</div>
                  <div className="flex items-center gap-2 mb-3 max-w-[620px] w-full">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                      <span className="text-[10px] font-semibold text-[#059669]">Select Type</span>
                    </div>
                    <div className="h-[2px] flex-1 bg-[#059669]"></div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                      <span className="text-[10px] font-semibold text-[#059669]">Application Details</span>
                    </div>
                    <div className="h-[2px] flex-1 bg-[#059669]"></div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-[24px] h-[24px] rounded-full border-2 border-[#059669] bg-[#059669] text-white text-[11px] font-bold flex items-center justify-center">✓</div>
                      <span className="text-[10px] font-semibold text-[#059669]">Review & Submit</span>
                    </div>
                    <div className="h-[2px] flex-1 bg-[#059669]"></div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-[24px] h-[24px] rounded-full border-2 border-[#3a7bd5] bg-[#3a7bd5] text-white text-[11px] font-bold flex items-center justify-center">4</div>
                      <span className="text-[10px] font-semibold text-[#3a7bd5]">Payment</span>
                    </div>
                  </div>
                  <div className="bg-white border border-[#dde3ee] rounded-[10px] shadow-[0_2px_16px_rgba(0,0,0,0.1)] w-full max-w-[400px]">
                    <div className="px-5 py-4 border-b border-[#edf0f5]">
                      <div className="text-[14px] font-bold text-[#0ba4db] mb-1">Paystack</div>
                      <div className="text-[10.5px] text-[#6a7a9a] opacity-80">Lagos Traders Ltd — lagos@traders.ng</div>
                      <div className="text-[24px] font-bold text-[#1a2236] mt-2">₦ 12,031.88</div>
                      <div className="text-[10.5px] text-[#6a7a9a]">Ref: NACC-PAY-2026-00422 &nbsp;|&nbsp; NACCIMA Certificate Fee</div>
                    </div>
                    <div className="p-5">
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#0ba4db] text-white text-center">💳 Card</div>
                        <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#f8fafd] text-[#6a7a9a] text-center hover:bg-[#edf2ff]">🏦 Bank Transfer</div>
                        <div className="flex-1 px-3 py-2 rounded-[6px] text-[11px] font-semibold cursor-pointer bg-[#f8fafd] text-[#6a7a9a] text-center hover:bg-[#edf2ff]">📱 USSD</div>
                      </div>
                      <div className="flex flex-col gap-3 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-[#374151]">Card Number</label>
                          <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="0000  0000  0000  0000" />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-[#374151]">Expiry Date</label>
                            <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="MM / YY" />
                          </div>
                          <div className="flex-1 flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-[#374151]">CVV</label>
                            <input className="px-3 py-2 border border-[#d1d5db] rounded-[5px] text-[12px] text-[#1a2236] bg-white focus:outline-none focus:border-[#3a7bd5]" placeholder="•••" />
                          </div>
                        </div>
                      </div>
                      <button className="w-full px-4 py-3 rounded-[6px] text-[13px] font-semibold cursor-pointer border-none transition-all bg-[#0ba4db] text-white hover:bg-[#0984b8]">Pay ₦12,031.88</button>
                      <div className="text-[10.5px] text-[#6a7a9a] text-center mt-3">🔒 Secured by Paystack — PCI DSS Compliant</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#9ca3af] text-center mt-3">
                    Having trouble? <span className="text-[#3a7bd5] cursor-pointer">Return to application</span> — your data is saved as PAYMENT PENDING.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
