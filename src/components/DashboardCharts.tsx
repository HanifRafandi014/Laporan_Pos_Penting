import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { BranchReport, KydBranchReport } from '../types';
import { getKonsolidasi } from '../utils/excelParser';
import {
  TrendingUp,
  ShieldAlert,
  Wallet,
  Coins,
  Activity,
  Award
} from 'lucide-react';

interface DashboardChartsProps {
  reports: BranchReport[];
  kydReports: KydBranchReport[];
  reportDate: string;
}

export function DashboardCharts({ reports, kydReports }: DashboardChartsProps) {
  const [metricUnit, setMetricUnit] = useState<'ribuan' | 'miliar'>('miliar');
  const konsolidasi = getKonsolidasi(reports);

  // Convert for charts readability
  const divisor = metricUnit === 'miliar' ? 1000000 : 1;
  const unitLabel = metricUnit === 'miliar' ? 'Miliar Rp' : 'Ribuan Rp';

  const chartData = reports.map((r) => ({
    name: r.kantor.replace('KPO ', ''),
    fullName: r.kantor,
    branchCode: r.branchCode,
    aset: Number((r.aset / divisor).toFixed(2)),
    kredit: Number((r.kredit / divisor).toFixed(2)),
    tabungan: Number((r.tabungan / divisor).toFixed(2)),
    deposito: Number((r.deposito / divisor).toFixed(2)),
    dpkTotal: Number(((r.tabungan + r.deposito) / divisor).toFixed(2)),
    pendapatan: Number((r.pendapatan / divisor).toFixed(2)),
    biaya: Number((r.biaya / divisor).toFixed(2)),
    lr: Number((r.lr / divisor).toFixed(2)),
    larPercent: r.larPercent,
    nplPercent: r.nplPercent,
    larNominal: Number((r.lar / divisor).toFixed(2)),
    nplNominal: Number((r.npl / divisor).toFixed(2)),
  }));

  const kydChartData = kydReports.map((k) => ({
    name: k.kantor.replace('KPO ', ''),
    outs: Number((k.blnIniOuts / divisor).toFixed(2)),
    target: Number((k.targetNominal / divisor).toFixed(2)),
    growth: Number((k.growthNominal / divisor).toFixed(2)),
    deviasi: Number((k.deviasi / divisor).toFixed(2)),
  }));

  // Top performers
  const sortedByLr = [...reports].sort((a, b) => b.lr - a.lr);
  const sortedByNpl = [...reports].sort((a, b) => a.nplPercent - b.nplPercent);

  // DPK Total
  const totalDpk = konsolidasi.tabungan + konsolidasi.deposito;

  return (
    <div className="space-y-6 mb-10">
      {/* 1. Executive Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Aset */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Aset</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Rp {(konsolidasi.aset / 1000000).toFixed(2)} M
          </p>
          <span className="text-[11px] text-slate-400 font-mono">
            {konsolidasi.aset.toLocaleString()} rb
          </span>
          <div className="h-1 w-full bg-blue-500 rounded-full mt-2" />
        </div>

        {/* Total Kredit */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kredit</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Rp {(konsolidasi.kredit / 1000000).toFixed(2)} M
          </p>
          <span className="text-[11px] text-indigo-600 font-semibold font-mono">
            LDR: {((konsolidasi.kredit / totalDpk) * 100).toFixed(1)}%
          </span>
          <div className="h-1 w-full bg-indigo-500 rounded-full mt-2" />
        </div>

        {/* Total DPK */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total DPK</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Rp {(totalDpk / 1000000).toFixed(2)} M
          </p>
          <span className="text-[11px] text-emerald-700 font-mono">
            Tabungan + Deposito
          </span>
          <div className="h-1 w-full bg-emerald-500 rounded-full mt-2" />
        </div>

        {/* NPL Konsolidasi */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NPL Konsolidasi</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-rose-600 mt-2 tracking-tight">
            {konsolidasi.nplPercent.toFixed(2)}%
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            Rp {(konsolidasi.npl / 1000000).toFixed(2)} M
          </span>
          <div className="h-1 w-full bg-rose-500 rounded-full mt-2" />
        </div>

        {/* LAR Konsolidasi */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">LAR Konsolidasi</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-2 tracking-tight">
            {konsolidasi.larPercent.toFixed(2)}%
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            Rp {(konsolidasi.lar / 1000000).toFixed(2)} M
          </span>
          <div className="h-1 w-full bg-amber-500 rounded-full mt-2" />
        </div>

        {/* Laba/Rugi Operasional */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Laba Bersih (L/R)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-2 tracking-tight">
            Rp {(konsolidasi.lr / 1000000).toFixed(2)} M
          </p>
          <span className="text-[11px] text-slate-500 font-mono">
            Sebelum Taksiran Pajak
          </span>
          <div className="h-1 w-full bg-emerald-600 rounded-full mt-2" />
        </div>
      </div>

      {/* Controls Bar for Dashboard */}
      <div className="flex flex-wrap items-center justify-between bg-white rounded-xl p-3 border border-slate-200/90 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Satuan Grafik:</span>
          <button
            onClick={() => setMetricUnit('miliar')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              metricUnit === 'miliar'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Miliar Rupiah (M)
          </button>
          <button
            onClick={() => setMetricUnit('ribuan')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              metricUnit === 'ribuan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ribuan Rupiah (Original)
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Grafik dinamis terhubung langsung dengan hasil kalkulasi 10 cabang
        </div>
      </div>

      {/* Chart Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Perbandingan Aset vs Kredit */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                1. Perbandingan Aset vs Kredit per Cabang
              </h3>
              <p className="text-xs text-slate-500">Satuan: {unitLabel}</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
              Kredit &amp; Aset
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${unitLabel}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="aset" name="Total Aset" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kredit" name="Total Kredit" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Analisis Rasio Risiko: %LAR & %NPL */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                2. Rasio Risiko: %LAR vs %NPL per Cabang
              </h3>
              <p className="text-xs text-slate-500">Garis batas sehat regulasi OJK (5% NPL)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
              Credit Risk
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 40]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toFixed(2)}%`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <ReferenceLine y={5} label={{ value: 'Batas Sehat NPL (5%)', fill: '#ef4444', fontSize: 10 }} stroke="#ef4444" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="larPercent" name="%LAR (Loan at Risk)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="nplPercent" name="%NPL (Non-Performing Loan)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Komposisi DPK (Tabungan vs Deposito) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                3. Komposisi Dana Pihak Ketiga (DPK)
              </h3>
              <p className="text-xs text-slate-500">Tabungan (CASA) vs Deposito Berjangka</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
              Dana Nasabah
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${unitLabel}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="tabungan" name="Tabungan" stackId="dpk" fill="#10b981" />
                <Bar dataKey="deposito" name="Deposito" stackId="dpk" fill="#065f46" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Profitabilitas: Pendapatan vs Biaya vs L/R */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                4. Performa Laba/Rugi Bersih per Cabang
              </h3>
              <p className="text-xs text-slate-500">Hasil selisih Pendapatan (COA 40000) - Biaya (COA 50000)</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
              Profitabilitas
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${unitLabel}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="lr" name="L/R Bersih" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.lr >= 1 ? '#059669' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Capaian Kredit vs Target (KYD) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                5. Realisasi Kredit vs Target (KYD)
              </h3>
              <p className="text-xs text-slate-500">Perbandingan Outstanding Bulan Ini vs Target Nominal</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
              Target vs Aktual
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kydChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${Number(val).toLocaleString()} ${unitLabel}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="outs" name="Realisasi Outs" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target Bulan Ini" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboards & Branch Highlights */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  6. Peringkat Kinerja Cabang
                </h3>
                <p className="text-xs text-slate-500">Top Laba/Rugi &amp; Kualitas Kredit</p>
              </div>
              <span className="p-1 rounded bg-amber-50 text-amber-600">
                <Award className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {/* Top Profit Branches */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Top 3 Laba Tertinggi
                </h4>
                <div className="space-y-2">
                  {sortedByLr.slice(0, 3).map((r, i) => (
                    <div key={r.branchCode} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium truncate">
                        {i + 1}. {r.kantor}
                      </span>
                      <span className="font-bold text-emerald-700 font-mono">
                        Rp {(r.lr / 1000).toFixed(1)} jt
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Credit Quality (Lowest NPL) */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Top 3 NPL Terendah
                </h4>
                <div className="space-y-2">
                  {sortedByNpl.slice(0, 3).map((r, i) => (
                    <div key={r.branchCode} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium truncate">
                        {i + 1}. {r.kantor}
                      </span>
                      <span className="font-bold text-blue-700 font-mono">
                        {r.nplPercent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
            <span>Kontributor Aset Terbesar: <strong>KPO WLINGI</strong> (24.6% Total Konsolidasi)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
