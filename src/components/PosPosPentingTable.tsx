import { useState } from 'react';
import { BranchReport } from '../types';
import { getKonsolidasi } from '../utils/excelParser';
import { Search, Eye, ArrowUpDown, HelpCircle } from 'lucide-react';

interface PosPosPentingTableProps {
  reports: BranchReport[];
  reportDate: string;
  onSelectBranch?: (branch: BranchReport) => void;
  onShowFormulaAudit?: () => void;
}

export function PosPosPentingTable({
  reports,
  reportDate,
  onSelectBranch,
  onShowFormulaAudit,
}: PosPosPentingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof BranchReport>('no');
  const [sortAsc, setSortAsc] = useState(true);
  const [showFullRupiah, setShowFullRupiah] = useState(false);

  const konsolidasi = getKonsolidasi(reports);

  const filteredReports = reports.filter((r) =>
    r.kantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.no).includes(searchTerm)
  );

  const sortedReports = [...filteredReports].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof BranchReport) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatNum = (val: number, isCurrency = true) => {
    const finalVal = showFullRupiah && isCurrency ? val * 1000 : val;
    return finalVal.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(finalVal) ? 0 : 2,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden mb-8">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-center md:text-left">
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wider">
              {reportDate}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mt-1">
              LAPORAN POS-POS PENTING PER CABANG
            </h2>
            <p className="text-xs text-slate-500 italic">
              (dalam ribuan rupiah{showFullRupiah ? ' - Mode Konversi Penuh Aktif' : ''})
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44"
            />
          </div>

          {/* Unit Switcher */}
          <button
            onClick={() => setShowFullRupiah(!showFullRupiah)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
            title="Ubah tampilan ribuan rupiah ke rupiah penuh"
          >
            {showFullRupiah ? 'Mode: Rp Penuh' : 'Mode: Ribuan Rp'}
          </button>

          {onShowFormulaAudit && (
            <button
              onClick={onShowFormulaAudit}
              className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 border border-slate-200"
              title="Lihat rumus per kolom"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Replica Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border-slate-200">
          <thead>
            {/* Super Header */}
            <tr className="bg-slate-200/90 text-slate-800 text-[11px] uppercase tracking-wider font-bold border-b border-slate-300 text-center">
              <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 w-12 cursor-pointer hover:bg-slate-300" onClick={() => handleSort('no')}>
                <div className="flex items-center justify-center gap-1">
                  NO <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th rowSpan={2} className="py-2.5 px-3 border border-slate-300 text-left min-w-[130px] cursor-pointer hover:bg-slate-300" onClick={() => handleSort('kantor')}>
                <div className="flex items-center gap-1">
                  KANTOR <ArrowUpDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
              </th>
              <th colSpan={11} className="py-2 px-3 border border-slate-300 bg-slate-300/80 text-slate-900 font-extrabold tracking-widest">
                POS-POS PENTING
              </th>
            </tr>
            {/* Sub Header */}
            <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b-2 border-slate-400 text-right">
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('aset')}>ASET</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('kredit')}>KREDIT</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('tabungan')}>TABUNGAN</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('deposito')}>DEPOSITO</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('lar')} title="LAR: Kol 1 (DPD>0) + Kol 2 (DPD 0-2) + Kol 2 (DPD>2) dari LLOAN">LAR</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200 text-amber-800" onClick={() => handleSort('larPercent')} title="Rumus Revisi %LAR: =H11/E11 (LAR / Kredit)">%LAR</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('npl')}>NPL</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('nplPercent')}>%NPL</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('pendapatan')}>PENDAPATAN</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('biaya')}>BIAYA</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('lr')}>L/R</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
            {sortedReports.map((row, index) => (
              <tr
                key={row.branchCode}
                onClick={() => onSelectBranch && onSelectBranch(row)}
                className={`hover:bg-blue-50/70 transition cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                }`}
              >
                <td className="py-2 px-3 border border-slate-200 text-center font-sans font-semibold text-slate-600">
                  {row.no}
                </td>
                <td className="py-2 px-3 border border-slate-200 font-sans font-bold text-slate-900 text-left whitespace-nowrap">
                  <div className="flex items-center justify-between">
                    <span>{row.kantor}</span>
                    <Eye className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 hover:opacity-100" />
                  </div>
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{formatNum(row.aset)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right font-medium text-blue-900">{formatNum(row.kredit)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{formatNum(row.tabungan)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{formatNum(row.deposito)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right text-amber-900">{formatNum(row.lar)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right font-semibold text-amber-700 bg-amber-50/40">
                  {row.larPercent.toFixed(2)}%
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right text-rose-900">{formatNum(row.npl)}</td>
                <td className={`py-2 px-2.5 border border-slate-200 text-right font-bold ${
                  row.nplPercent > 5 ? 'text-rose-700 bg-rose-50/50' : 'text-emerald-700'
                }`}>
                  {row.nplPercent.toFixed(2)}%
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{formatNum(row.pendapatan)}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{formatNum(row.biaya)}</td>
                <td className={`py-2 px-2.5 border border-slate-200 text-right font-bold ${
                  row.lr >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {formatNum(row.lr)}
                </td>
              </tr>
            ))}

            {/* KONSOLIDASI (Highlighted Footer Row matching screenshot) */}
            <tr className="bg-slate-300/80 text-slate-950 font-extrabold text-[12px] border-t-2 border-b-2 border-slate-500">
              <td className="py-2.5 px-3 border border-slate-400 text-center"></td>
              <td className="py-2.5 px-3 border border-slate-400 font-sans tracking-wide">
                KONSOLIDASI
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{formatNum(konsolidasi.aset)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-blue-950">{formatNum(konsolidasi.kredit)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{formatNum(konsolidasi.tabungan)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{formatNum(konsolidasi.deposito)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-amber-950">{formatNum(konsolidasi.lar)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-amber-950 bg-amber-100/60">
                {konsolidasi.larPercent.toFixed(2)}%
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-rose-950">{formatNum(konsolidasi.npl)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-rose-900 bg-rose-100/60">
                {konsolidasi.nplPercent.toFixed(2)}%
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{formatNum(konsolidasi.pendapatan)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{formatNum(konsolidasi.biaya)}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-emerald-900 bg-emerald-100/40">
                {formatNum(konsolidasi.lr)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-right text-xs text-slate-500 italic">
        Nb. Biaya belum termasuk tafsiran pajak sehingga L/R = sebelum pajak
      </div>
    </div>
  );
}
