import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  FlaskConical, 
  FileCheck2, 
  IndianRupee, 
  User, 
  Printer, 
  ShieldCheck, 
  QrCode
} from 'lucide-react';
import type { QueueItem, QueueStatus } from '../../types/procurement';
import { MSP_RATES } from '../../types/procurement';

interface WorkflowModalProps {
  item: QueueItem | null;
  onClose: () => void;
  onUpdateItem: (updatedItem: QueueItem) => void;
}

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  item,
  onClose,
  onUpdateItem,
}) => {
  if (!item) return null;

  const [activeTab, setActiveTab] = useState<'farmer' | 'quality' | 'weighment' | 'payout' | 'dbt'>('quality');
  
  // Interactive form state for testing/editing values
  const [moisture, setMoisture] = useState<number>(
    item.qualityCheck?.moisturePct ?? 13.5
  );
  const [foreignMatter, setForeignMatter] = useState<number>(
    item.qualityCheck?.foreignMatterPct ?? 0.6
  );
  const [grade, setGrade] = useState<'Grade A' | 'FAQ' | 'Sub-Standard'>(
    (item.qualityCheck?.grade as any) || 'Grade A'
  );
  
  const [grossWeight, setGrossWeight] = useState<number>(
    item.weighment?.grossWeightKg ?? Math.round(item.estimatedQuantityQuintals * 100 + 1850)
  );
  const [tareWeight, setTareWeight] = useState<number>(
    item.weighment?.tareWeightKg ?? 1850
  );

  const netWeightKg = Math.max(0, grossWeight - tareWeight);
  const netQuintals = Number((netWeightKg / 100).toFixed(2));
  const bagCount = Math.round(netWeightKg / 50);

  // MSP rate
  const cropMsp = MSP_RATES[item.crop]?.msp || 2300;
  const standardMaxMoisture = MSP_RATES[item.crop]?.maxMoisture || 14.0;
  
  // Moisture deduction rule: If moisture > standard, 0.75% value deduction per 1% excess moisture
  const excessMoisture = Math.max(0, Number((moisture - standardMaxMoisture).toFixed(1)));
  const moistureDeductionPct = excessMoisture > 0 ? Number((excessMoisture * 0.75).toFixed(2)) : 0;

  const grossPayable = Math.round(netQuintals * cropMsp);
  const gunnyAllowance = bagCount * 20; // ₹20 incentive per standard gunny bag provided
  const qualityDeductionAmount = Math.round((grossPayable * moistureDeductionPct) / 100);
  const netPayable = grossPayable + gunnyAllowance - qualityDeductionAmount;

  // Handle saving and advancing status
  const handleAdvanceStatus = (newStatus: QueueStatus) => {
    const updated: QueueItem = {
      ...item,
      status: newStatus,
      actualQuantityQuintals: netQuintals,
      qualityCheck: {
        moisturePct: moisture,
        standardMoisturePct: standardMaxMoisture,
        foreignMatterPct: foreignMatter,
        damagedGrainsPct: 0.8,
        immatureGrainsPct: 0.5,
        grade: grade,
        moistureCutDeductionPct: moistureDeductionPct,
        labTechnician: 'Dr. V. K. Yadav (Sr. Quality Inspector)',
        testedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        qcCertificateNo: item.qualityCheck?.qcCertificateNo || `QC-KNL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      },
      weighment: {
        weighbridgeId: 'WB-01 (Electronic 60MT Pitless)',
        grossWeightKg: grossWeight,
        tareWeightKg: tareWeight,
        netWeightKg: netWeightKg,
        netWeightQuintals: netQuintals,
        bagCount: bagCount,
        bagType: '50 kg Standard Jute Gunny (BIS Certified)',
        weighedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        scaleSlipNumber: item.weighment?.scaleSlipNumber || `WS-2026-${Math.floor(4000 + Math.random() * 900)}`,
        operatorName: 'Sunil Kumar (Licensed Weighbridge Operator)',
      },
      paymentDbt: {
        mspRatePerQuintal: cropMsp,
        grossPayable: grossPayable,
        gunnyAllowance: gunnyAllowance,
        qualityDeduction: qualityDeductionAmount,
        netPayable: netPayable,
        dbtStatus: newStatus === 'Completed' ? 'PFMS Cleared' : 'Pending',
        pfmsReferenceNumber: item.paymentDbt?.pfmsReferenceNumber || `PFMS-HR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        utrNumber: item.paymentDbt?.utrNumber || `SBIN260927${Math.floor(10000 + Math.random() * 90000)}`,
        accountValidated: true,
      },
      receiptNumber: item.receiptNumber || `WSR-2026-0${Math.floor(800 + Math.random() * 199)}`,
    };

    onUpdateItem(updated);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div 
        className="bg-white border border-slate-300 rounded-md shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-amber-600 font-bold text-white flex items-center justify-center text-xs border border-amber-400">
              {item.tokenNumber.split('-')[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-bold text-amber-400">
                  {item.tokenNumber}
                </span>
                <span className="text-slate-400">•</span>
                <span className="font-semibold text-slate-100 text-sm">
                  {item.farmer.name}
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                  {item.farmer.id}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>{item.crop} ({item.variety})</span>
                <span>•</span>
                <span>Tractor: {item.vehicleNumber}</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">{item.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={printReceipt}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded flex items-center gap-1 transition"
              title="Print Warehouse Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'farmer', label: '1. Farmer & Land Records', icon: User },
            { id: 'quality', label: '2. Quality & Moisture Lab', icon: FlaskConical },
            { id: 'weighment', label: '3. Weighbridge Scale', icon: Scale },
            { id: 'payout', label: '4. MSP Calculation', icon: IndianRupee },
            { id: 'dbt', label: '5. DBT & WSR Receipt', icon: FileCheck2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-800 text-blue-900 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-800' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: Farmer & Land Records */}
          {activeTab === 'farmer' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-800" />
                  <div>
                    <div className="font-bold text-emerald-900 text-xs">
                      AgriStack & Meri Fasal Mera Byora Verification: CONFIRMED
                    </div>
                    <div className="text-[11px] text-emerald-900">
                      Biometric Aadhaar authentication matched. Sowing registry validated for Rabi/Kharif 2026.
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-300">
                  UIDAI VERIFIED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded p-3 space-y-2">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
                    Farmer Personal Information
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Full Name:</span>
                      <span className="font-semibold text-slate-900">{item.farmer.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Father's Name:</span>
                      <span className="font-medium text-slate-800">{item.farmer.fatherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Aadhaar Masked:</span>
                      <span className="font-mono font-medium text-slate-800">{item.farmer.aadhaarMasked}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Mobile Number:</span>
                      <span className="font-mono font-medium text-slate-800">{item.farmer.mobile}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Village & District:</span>
                      <span className="font-medium text-slate-800">{item.farmer.village}, {item.farmer.panchayat}, {item.farmer.district} ({item.farmer.state})</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3 space-y-2">
                  <div className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
                    Land Revenue & Bank Account
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Khasra / Murabba No:</span>
                      <span className="font-mono font-bold text-blue-900">{item.farmer.khasraNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Registered Land:</span>
                      <span className="font-semibold text-slate-800">{item.farmer.landHoldingAcres} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Kisan Credit Card:</span>
                      <span className="font-mono font-medium text-slate-800">{item.farmer.kisanCreditCard}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Bank Name:</span>
                      <span className="font-medium text-slate-800">{item.farmer.bankName}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">Aadhaar Linked A/c & IFSC:</span>
                      <span className="font-mono font-semibold text-slate-900">{item.farmer.bankAccountMasked} • {item.farmer.ifsc}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Quality & Moisture Lab */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Moisture Slider / Input */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Grain Moisture Test</span>
                    <span className="text-[10px] font-mono text-slate-500">FAQ Limit: &le;{standardMaxMoisture}%</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      min="8"
                      max="24"
                      value={moisture}
                      onChange={(e) => setMoisture(parseFloat(e.target.value) || 0)}
                      className="w-24 text-2xl font-black font-mono px-2 py-1 border border-slate-300 rounded bg-white"
                    />
                    <span className="text-lg font-bold text-slate-600">%</span>
                  </div>

                  <input
                    type="range"
                    min="9"
                    max="22"
                    step="0.1"
                    value={moisture}
                    onChange={(e) => setMoisture(parseFloat(e.target.value))}
                    className="w-full accent-blue-800 cursor-pointer"
                  />

                  {moisture > standardMaxMoisture ? (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-300 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                      <span>Exceeds standard ({standardMaxMoisture}%). Auto-cut deduction: <strong>{moistureDeductionPct}%</strong></span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Moisture within standard specification (No value cut).</span>
                    </div>
                  )}
                </div>

                {/* Foreign Matter & Impurities */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-slate-800 text-xs block">Refraction & Foreign Matter</span>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                        <span>Foreign Matter / Dust:</span>
                        <span className="font-mono font-bold">{foreignMatter}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3.0"
                        step="0.1"
                        value={foreignMatter}
                        onChange={(e) => setForeignMatter(parseFloat(e.target.value))}
                        className="w-full accent-blue-800 cursor-pointer"
                      />
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      Permissible ceiling: 1.0% inorganic, 2.0% organic matter.
                    </div>
                  </div>
                </div>

                {/* Grade Assignment */}
                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2">
                  <span className="font-bold text-slate-800 text-xs block">Assigned Quality Grade</span>
                  <div className="space-y-1.5">
                    {(['Grade A', 'FAQ', 'Sub-Standard'] as const).map((g) => (
                      <label 
                        key={g} 
                        className={`flex items-center space-x-2 p-1.5 rounded border cursor-pointer ${
                          grade === g 
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="qualityGrade"
                          checked={grade === g}
                          onChange={() => setGrade(g)}
                          className="accent-blue-800"
                        />
                        <span>{g === 'Grade A' ? 'Grade A (Premier FAQ)' : g === 'FAQ' ? 'FAQ (Fair Average Quality)' : 'Sub-Standard (Deduction Applies)'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-700">Digital Moisture Meter Spec:</span>
                  <span className="text-slate-500 ml-1">Kett PM-650 Automatic Grain Moisture Tester • Calibrated: 27-Sep-2026</span>
                </div>
                <span className="font-mono text-slate-700 font-bold">
                  QC Slip: {item.qualityCheck?.qcCertificateNo || 'QC-KNL-2026-9041'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: Weighbridge Scale */}
          {activeTab === 'weighment' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Gross Weight */}
                <div className="border border-slate-200 rounded p-3 space-y-1.5 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 block">Gross Weight (Loaded Vehicle)</span>
                  <div className="flex items-baseline space-x-2">
                    <input
                      type="number"
                      step="10"
                      value={grossWeight}
                      onChange={(e) => setGrossWeight(parseInt(e.target.value) || 0)}
                      className="w-full text-xl font-black font-mono px-2.5 py-1 border border-slate-300 rounded bg-white"
                    />
                    <span className="text-slate-500 font-bold">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Captured from Scale WB-01 Loadcell
                  </div>
                </div>

                {/* Tare Weight */}
                <div className="border border-slate-200 rounded p-3 space-y-1.5 bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 block">Tare Weight (Empty Vehicle)</span>
                  <div className="flex items-baseline space-x-2">
                    <input
                      type="number"
                      step="10"
                      value={tareWeight}
                      onChange={(e) => setTareWeight(parseInt(e.target.value) || 0)}
                      className="w-full text-xl font-black font-mono px-2.5 py-1 border border-slate-300 rounded bg-white"
                    />
                    <span className="text-slate-500 font-bold">kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Standard Tractor Trolley Tare
                  </div>
                </div>

                {/* Net Quantity Result */}
                <div className="border border-blue-200 rounded p-3 bg-blue-50/60 space-y-1">
                  <span className="text-xs font-bold text-blue-900 block">Net Grain Procured</span>
                  <div className="text-2xl font-black font-mono text-blue-950">
                    {netQuintals.toFixed(2)} <span className="text-sm font-semibold text-blue-800">Quintals</span>
                  </div>
                  <div className="text-[11px] text-blue-900 font-mono">
                    = {netWeightKg.toLocaleString()} kg • {bagCount} standard 50kg bags
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Scale className="w-5 h-5 text-slate-700" />
                  <div>
                    <div className="font-semibold text-slate-800">Weighbridge Certificate Slip: WS-2026-4401</div>
                    <div className="text-slate-500 text-[11px]">Weights & Measures Dept. Verification Valid upto Dec-2026</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Tolerance: &plusmn;0.05%</div>
                  <div className="text-emerald-700 font-bold">CALIBRATION PASS</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MSP Payout Calculation */}
          {activeTab === 'payout' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Commercial Line Item</th>
                      <th className="py-2 px-3 text-center">Rate / Parameter</th>
                      <th className="py-2 px-3 text-right">Quantity</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.crop} MSP Official Base Rate ({grade})
                      </td>
                      <td className="py-2 px-3 text-center font-mono">₹{cropMsp} / Qtl</td>
                      <td className="py-2 px-3 text-right font-mono">{netQuintals.toFixed(2)} Qtl</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{grossPayable.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-700">
                        Gunny Bag Usage Allowance (Farmer provided 50kg bags)
                      </td>
                      <td className="py-2 px-3 text-center font-mono">₹20 / bag</td>
                      <td className="py-2 px-3 text-right font-mono">{bagCount} Bags</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        +₹{gunnyAllowance.toLocaleString()}
                      </td>
                    </tr>
                    {qualityDeductionAmount > 0 && (
                      <tr className="bg-amber-50/50">
                        <td className="py-2 px-3 text-amber-900 font-medium">
                          Moisture / Quality Adjustment Deduction ({moistureDeductionPct}% of MSP)
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-amber-800">
                          {moistureDeductionPct}% cut
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-800">{netQuintals.toFixed(2)} Qtl</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">
                          -₹{qualityDeductionAmount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td className="py-2.5 px-3 text-sm text-slate-900 uppercase">
                        Net Amount Payable via DBT (PFMS)
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-800">Direct Account Credit</td>
                      <td className="py-2.5 px-3 text-right font-mono">{netQuintals.toFixed(2)} Qtl</td>
                      <td className="py-2.5 px-3 text-right font-mono text-lg text-emerald-900">
                        ₹{netPayable.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded p-3 text-xs text-amber-900">
                <strong>Government Regulation:</strong> As per Haryana Mandi Board statutory regulations, MSP payments must be directly transferred to farmer Aadhaar-linked bank accounts within 48-72 hours of WSR generation.
              </div>
            </div>
          )}

          {/* TAB 5: DBT & WSR Receipt */}
          {activeTab === 'dbt' && (
            <div className="space-y-4">
              <div className="border border-slate-300 rounded p-4 bg-slate-50/60 space-y-3 font-sans">
                {/* Simulated Official Procurement Certificate */}
                <div className="border-b border-slate-300 pb-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    हरियाणा राज्य कृषि विपणन बोर्ड | HARYANA STATE AGRICULTURAL MARKETING BOARD
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    WAREHOUSE SAHI RECEIPT (WSR) / J-FORM PURCHASE RECEIPT
                  </h4>
                  <div className="text-[11px] font-mono text-slate-600 mt-0.5">
                    Receipt No: <strong className="text-slate-900">{item.receiptNumber || 'WSR-2026-0845'}</strong> • Date: 27-Sep-2026
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Farmer & Beneficiary:</span>
                    <span className="font-bold text-slate-900">{item.farmer.name}</span>
                    <div className="text-slate-600 text-[11px] font-mono">FID: {item.farmer.id}</div>
                    <div className="text-slate-600 text-[11px]">Village: {item.farmer.village}, {item.farmer.district}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Procurement Center & Officer:</span>
                    <span className="font-bold text-slate-900">Karnal Central APMC Mandi</span>
                    <div className="text-slate-600 text-[11px]">Inspector: Sh. Rajesh Kumar Sharma (OFF-HR-7821)</div>
                    <div className="text-slate-600 text-[11px]">Commodity: {item.crop} ({item.variety})</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded p-2.5 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <div className="text-slate-500 text-[10px]">Net Weighed</div>
                    <div className="font-mono font-bold text-slate-900">{netQuintals.toFixed(2)} Qtl</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Moisture %</div>
                    <div className="font-mono font-bold text-slate-900">{moisture}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">MSP Rate</div>
                    <div className="font-mono font-bold text-slate-900">₹{cropMsp}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Payable DBT</div>
                    <div className="font-mono font-black text-emerald-800">₹{netPayable.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-8 h-8 text-slate-800" />
                    <div className="text-[10px] font-mono">
                      <div>PFMS Batch: PFMS-HR-2026-90412</div>
                      <div className="text-emerald-700 font-bold">DIGITALLY SIGNED VIA e-SIGN DSC</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">Procurement Inspector Stamp</div>
                    <div className="text-[10px] text-slate-500">Government of Haryana</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 font-medium">Workflow Status:</span>
            <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-300">
              {item.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {item.status === 'Booked' && (
              <button
                onClick={() => handleAdvanceStatus('Checked In')}
                className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded font-semibold shadow-xs"
              >
                Mark Gate Check-In
              </button>
            )}

            {item.status === 'Checked In' && (
              <button
                onClick={() => handleAdvanceStatus('Called')}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded font-semibold shadow-xs"
              >
                Call to Quality Bay
              </button>
            )}

            {(item.status === 'Waiting' || item.status === 'Called') && (
              <button
                onClick={() => handleAdvanceStatus('Processing')}
                className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 text-white rounded font-semibold shadow-xs"
              >
                Start Weighment & Testing
              </button>
            )}

            {item.status === 'Processing' && (
              <button
                onClick={() => handleAdvanceStatus('Completed')}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded font-bold shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Procurement</span>
              </button>
            )}

            {item.status === 'Completed' && (
              <div className="flex items-center space-x-2">
                <span className="text-emerald-800 font-bold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Lot Completed & Transferred to Godown
                </span>
                <button
                  onClick={printReceipt}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded font-semibold"
                >
                  Print J-Form
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
