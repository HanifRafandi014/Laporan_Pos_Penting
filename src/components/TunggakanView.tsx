import { useState } from 'react';
import { TunggakanItem, BranchReport } from '../types';
import { Search, ShieldAlert, ArrowUpDown, Filter } from 'lucide-react';

interface TunggakanViewProps {
  tunggakanList: TunggakanItem[];
  reports: BranchReport[];
  reportDate: string;
}

export function TunggakanView({ tunggakanList, reports, reportDate }: TunggakanViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKol, setFilterKol] = useState<number | 'all'>('all');

  const filtered = tunggakanList.filter((item) => {
    const matchesSearch = item.kantor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totals = {
    nasabah: tunggakanList.reduce((acc, i) => acc + i.nasabahCount, 0),
    kol1: tunggakanList.reduce((acc, i) => acc + i.kolektibilitas1, 0),
    kol2: tunggakanList.reduce((acc, i) => acc + i.kolektibilitas2, 0),
    kol3: tunggakanList.reduce((acc, i) => acc + i.kolektibilitas3, 0),
    kol4: tunggakanList.reduce((acc, i) => acc + i.kolektibilitas4, 0),
    kol5: tunggakanList.reduce((acc, i) => acc + i.kolektibilitas5, 0),
    duePrinciple: tunggakanList.reduce((acc, i) => acc + i.duePrinciple, 0),
    dueInterest: tunggakanList.reduce((acc, i) => acc + i.dueInterest, 0),
    duePenalty: tunggakanList.reduce((acc, i) => acc + i.duePenalty, 0),
    totalTunggakan: tunggakanList.reduce((acc, i) => acc + i.totalTunggakan, 0),
    totalLar: tunggakanList.reduce((acc, i) => acc + i.totalLar, 0),
    totalNpl: tunggakanList.reduce((acc, i) => acc + i.totalNpl, 0),
  };

  return (
    <div className="space-y-6 mb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tunggakan Pokok</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            Rp {totals.duePrinciple.toLocaleString()} rb
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Kolom Due Principle Amt (Col CM)</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tunggakan Bunga</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            Rp {totals.dueInterest.toLocaleString()} rb
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Kolom Due Interest Amt (Col CQ)</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tunggakan Denda</span>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            Rp {totals.duePenalty.toLocaleString()} rb
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Kolom Due Penalty Amt</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200/90 bg-amber-50/30 shadow-sm">
          <span className="text-xs font-semibold text-amber-800 uppercase">Total Seluruh Tunggakan</span>
          <p className="text-xl font-bold text-amber-900 mt-1 font-mono">
            Rp {totals.totalTunggakan.toLocaleString()} rb
          </p>
          <p className="text-xs text-amber-700 mt-0.5">Pokok + Bunga + Denda Konsolidasi</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 tracking-wider">
              {reportDate}
            </span>
            <h3 className="text-base font-bold text-slate-800 tracking-tight mt-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              RINCIAN TUNGGAKAN &amp; KOLEKTIBILITAS KREDIT PER CABANG
            </h3>
            <p className="text-xs text-slate-500">
              Kolektibilitas 1 (Lancar), 2 (DPK), 3 (Kurang Lancar), 4 (Diragukan), 5 (Macet) sesuai LLOAN &amp; LHPDU
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari cabang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border-slate-200">
            <thead>
              <tr className="bg-slate-200/90 text-slate-800 text-[11px] uppercase tracking-wider font-bold border-b border-slate-300 text-center">
                <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 w-10">NO</th>
                <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 text-left min-w-[130px]">KANTOR</th>
                <th colSpan={5} className="py-2 px-3 border border-slate-300 bg-slate-300/70 text-slate-900 font-extrabold">
                  OUTSTANDING PER KOLEKTIBILITAS (RIB Rp)
                </th>
                <th colSpan={3} className="py-2 px-3 border border-slate-300 bg-amber-100/70 text-amber-950 font-extrabold">
                  RINCIAN TUNGGAKAN
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border border-slate-300 text-right bg-amber-200/60 text-amber-950 font-extrabold">
                  TOTAL TUNGGAKAN
                </th>
                <th rowSpan={2} className="py-2.5 px-2.5 border border-slate-300 text-right bg-rose-200/60 text-rose-950 font-extrabold">
                  TOTAL NPL
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b-2 border-slate-400 text-right">
                <th className="py-2 px-2 border border-slate-300">KOL 1</th>
                <th className="py-2 px-2 border border-slate-300">KOL 2</th>
                <th className="py-2 px-2 border border-slate-300">KOL 3</th>
                <th className="py-2 px-2 border border-slate-300">KOL 4</th>
                <th className="py-2 px-2 border border-slate-300">KOL 5</th>
                <th className="py-2 px-2 border border-slate-300 bg-amber-50/50">POKOK</th>
                <th className="py-2 px-2 border border-slate-300 bg-amber-50/50">BUNGA</th>
                <th className="py-2 px-2 border border-slate-300 bg-amber-50/50">DENDA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
              {filtered.map((row, idx) => (
                <tr key={row.branchCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                  <td className="py-2 px-3 border border-slate-200 text-center font-sans font-semibold text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border border-slate-200 font-sans font-bold text-slate-900 text-left whitespace-nowrap">
                    {row.kantor}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right text-emerald-800">
                    {row.kolektibilitas1.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right text-amber-800">
                    {row.kolektibilitas2.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right text-rose-700">
                    {row.kolektibilitas3.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right text-rose-800">
                    {row.kolektibilitas4.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right text-rose-900 font-bold">
                    {row.kolektibilitas5.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right bg-amber-50/20">
                    {row.duePrinciple.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right bg-amber-50/20">
                    {row.dueInterest.toLocaleString()}
                  </td>
                  <td className="py-2 px-2 border border-slate-200 text-right bg-amber-50/20">
                    {row.duePenalty.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 border border-slate-200 text-right font-bold text-amber-900 bg-amber-100/30">
                    {row.totalTunggakan.toLocaleString()}
                  </td>
                  <td className="py-2 px-2.5 border border-slate-200 text-right font-bold text-rose-900 bg-rose-100/30">
                    {row.totalNpl.toLocaleString()}
                  </td>
                </tr>
              ))}

              {/* Total Konsolidasi Tunggakan */}
              <tr className="bg-slate-300/90 text-slate-950 font-extrabold text-[12px] border-t-2 border-b-2 border-slate-500">
                <td className="py-2.5 px-3 border border-slate-400 text-center"></td>
                <td className="py-2.5 px-3 border border-slate-400 font-sans tracking-wide">
                  TOTAL KONSOLIDASI
                </td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.kol1.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.kol2.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.kol3.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.kol4.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right text-rose-950">{totals.kol5.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.duePrinciple.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.dueInterest.toLocaleString()}</td>
                <td className="py-2.5 px-2 border border-slate-400 text-right">{totals.duePenalty.toLocaleString()}</td>
                <td className="py-2.5 px-2.5 border border-slate-400 text-right text-amber-950 bg-amber-200/50">
                  {totals.totalTunggakan.toLocaleString()}
                </td>
                <td className="py-2.5 px-2.5 border border-slate-400 text-right text-rose-950 bg-rose-200/50">
                  {totals.totalNpl.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
