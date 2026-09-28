import { X, Building2, TrendingUp, ShieldAlert, Wallet, Coins } from 'lucide-react';
import { BranchReport, KydBranchReport, TunggakanItem } from '../types';

interface BranchDetailModalProps {
  branch: BranchReport | null;
  kyd?: KydBranchReport;
  tunggakan?: TunggakanItem;
  reportDate: string;
  onClose: () => void;
}

export function BranchDetailModal({
  branch,
  kyd,
  tunggakan,
  reportDate,
  onClose,
}: BranchDetailModalProps) {
  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{branch.kantor}</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Cabang #{branch.branchCode}
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Posisi Per {reportDate} • Satuan Ribuan Rupiah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white rounded-lg p-1.5 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Pos-Pos Utama Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Aset
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                Rp {branch.aset.toLocaleString()} rb
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[11px] font-semibold text-indigo-800 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> Kredit
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                Rp {branch.kredit.toLocaleString()} rb
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> DPK (Tab + Dep)
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-mono">
                Rp {(branch.tabungan + branch.deposito).toLocaleString()} rb
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Laba Bersih (L/R)
              </span>
              <p className="text-sm font-bold text-emerald-700 mt-1 font-mono">
                Rp {branch.lr.toLocaleString()} rb
              </p>
            </div>
          </div>

          {/* Rincian Pos-Pos Penting */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>Rincian Nilai Pos-Pos Penting</span>
              <span className="text-[11px] text-slate-500">File: GLBAL &amp; LLOAN</span>
            </div>
            <div className="divide-y divide-slate-100 p-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 px-2">
                <span className="font-sans text-slate-600">Tabungan (COA 22100)</span>
                <span className="font-bold text-slate-900">Rp {branch.tabungan.toLocaleString()} rb</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="font-sans text-slate-600">Deposito (COA 22200 + 22250)</span>
                <span className="font-bold text-slate-900">Rp {branch.deposito.toLocaleString()} rb</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="font-sans text-slate-600">Pendapatan (COA 40000)</span>
                <span className="font-bold text-slate-900">Rp {branch.pendapatan.toLocaleString()} rb</span>
              </div>
              <div className="flex justify-between py-1.5 px-2">
                <span className="font-sans text-slate-600">Biaya (COA 50000 - 24100)</span>
                <span className="font-bold text-slate-900">Rp {branch.biaya.toLocaleString()} rb</span>
              </div>
              <div className="flex justify-between py-1.5 px-2 bg-emerald-50/50">
                <span className="font-sans font-semibold text-emerald-900">Laba / Rugi Sebelum Pajak</span>
                <span className="font-bold text-emerald-800">Rp {branch.lr.toLocaleString()} rb</span>
              </div>
            </div>
          </div>

          {/* Rasio Risiko LAR & NPL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Loan at Risk (LAR)
                </span>
                <span className="text-xs font-bold text-amber-800 px-2 py-0.5 rounded-full bg-amber-100">
                  {branch.larPercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-base font-bold font-mono text-slate-900 mt-2">
                Rp {branch.lar.toLocaleString()} rb
              </p>
              <p className="font-sans text-[11px] text-slate-500 mt-1">
                Kolektibilitas 1 ber-DPD &amp; Kolektibilitas 2 (DPK)
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Non-Performing Loan (NPL)
                </span>
                <span className="text-xs font-bold text-rose-800 px-2 py-0.5 rounded-full bg-rose-100">
                  {branch.nplPercent.toFixed(2)}%
                </span>
              </div>
              <p className="text-base font-bold font-mono text-slate-900 mt-2">
                Rp {branch.npl.toLocaleString()} rb
              </p>
              <p className="font-sans text-[11px] text-slate-500 mt-1">
                Kolektibilitas 3, 4, dan 5 (Bermasalah &amp; Macet)
              </p>
            </div>
          </div>

          {/* KYD & Tunggakan info if available */}
          {kyd && (
            <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/30">
              <h4 className="font-bold text-indigo-950 mb-2 font-sans">
                Status Pertumbuhan Kredit (KYD)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] font-sans">Bln Lalu Outs:</span>
                  <p className="font-semibold text-slate-900">Rp {kyd.blnLaluOuts.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-sans">Bln Ini Outs:</span>
                  <p className="font-semibold text-slate-900">Rp {kyd.blnIniOuts.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-sans">Target Bulan Ini:</span>
                  <p className="font-semibold text-slate-900">Rp {kyd.targetNominal.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-sans">Deviasi Target:</span>
                  <p className={`font-semibold ${kyd.deviasi < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {kyd.deviasi < 0 ? `(${Math.abs(kyd.deviasi).toLocaleString()})` : kyd.deviasi.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
