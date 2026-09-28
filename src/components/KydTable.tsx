import { useState, useRef } from 'react';
import { KydBranchReport, FileUploadInfo, TargetJatimFileInfo } from '../types';
import { getKydKonsolidasi, generateSampleNominatif, generateSampleTargetJatim } from '../utils/excelParser';
import { MONTH_TARGET_LABELS, MONTH_TARGET_NAMES } from '../data/defaultData';
import {
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Target,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  Download,
} from 'lucide-react';

interface KydTableProps {
  reports: KydBranchReport[];
  reportDate: string;
  periodBlnLalu?: string;
  periodBlnIni?: string;
  nominatifFile?: FileUploadInfo | null;
  nominatifLaluFile?: FileUploadInfo | null;
  targetJatimFile?: TargetJatimFileInfo | null;
  targetMonthIndex?: number;
  onFileUpload?: (type: 'nominatif' | 'target_jatim', file: File, targetPeriod?: 'bln_ini' | 'bln_lalu') => void;
  onSelectTargetMonth?: (monthIdx: number) => void;
  onPeriodLaluChange?: (label: string) => void;
  onPeriodIniChange?: (label: string) => void;
}

export function KydTable({
  reports,
  reportDate,
  periodBlnLalu = 'Agustus 2026',
  periodBlnIni = 'September 2026',
  nominatifFile,
  nominatifLaluFile,
  targetJatimFile,
  targetMonthIndex = 8,
  onFileUpload,
  onSelectTargetMonth,
  onPeriodLaluChange,
  onPeriodIniChange,
}: KydTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof KydBranchReport>('no');
  const [sortAsc, setSortAsc] = useState(true);
  const fileInputIniRef = useRef<HTMLInputElement | null>(null);
  const fileInputLaluRef = useRef<HTMLInputElement | null>(null);
  const fileInputTargetRef = useRef<HTMLInputElement | null>(null);

  const konsolidasi = getKydKonsolidasi(reports);

  const filtered = reports.filter((r) =>
    r.kantor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.no).includes(searchTerm)
  );

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const handleSort = (field: keyof KydBranchReport) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Format helper for accounting style:
  // - Positif: font berwarna hijau (text-emerald-600 font-bold)
  // - Minus: harus ada tanda kurung () dan font berwarna merah (text-red-600 font-bold)
  const renderAccounting = (val: number) => {
    if (val < 0) {
      return (
        <span className="text-red-600 font-bold">
          ({Math.abs(val).toLocaleString()})
        </span>
      );
    }
    if (val > 0) {
      return (
        <span className="text-emerald-600 font-bold">
          {val.toLocaleString()}
        </span>
      );
    }
    return <span className="text-slate-500 font-medium">0</span>;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, targetPeriod: 'bln_ini' | 'bln_lalu') => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload('nominatif', e.target.files[0], targetPeriod);
    }
  };

  const handleTargetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileUpload) {
      onFileUpload('target_jatim', e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 overflow-hidden mb-8">
      {/* Header and Controls */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 tracking-wider">
            {reportDate}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight mt-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            LAPORAN KREDIT PER CABANG (KYD)
          </h2>
          <p className="text-xs text-slate-500 italic">
            (dalam ribuan rupiah) • Perbandingan Bulan Lalu ({periodBlnLalu}), Bulan Ini ({periodBlnIni}), Pertumbuhan &amp; Target RKAP ({MONTH_TARGET_NAMES[targetMonthIndex]})
          </p>
        </div>

        {/* Toolbar with Month Selector & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target RKAP Month Selector */}
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
            <label htmlFor="select-kyd-target-month" className="text-xs font-bold text-purple-900 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-600" />
              Target:
            </label>
            <select
              id="select-kyd-target-month"
              value={targetMonthIndex}
              onChange={(e) => onSelectTargetMonth?.(parseInt(e.target.value, 10))}
              className="text-xs font-bold bg-white text-purple-900 border border-purple-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-xs"
            >
              {MONTH_TARGET_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name.toUpperCase()} ({MONTH_TARGET_LABELS[idx]})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-40"
            />
          </div>
        </div>
      </div>

      {/* Pivot Nominatif & Target Jatim Information Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 border-b border-emerald-200/80 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-xs">
                Integrasi Nominatif &amp; Target Jatim RKAP:
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                KOL 1-5 BDEBET • KOL E Dieliminasi
              </span>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Target Bulan: {MONTH_TARGET_NAMES[targetMonthIndex].toUpperCase()} ({MONTH_TARGET_LABELS[targetMonthIndex]})
              </span>
              {targetJatimFile ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-purple-700" />
                  Target: {targetJatimFile.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  Target RKAP Default Sistem
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              <strong>Aturan Pembulatan Target:</strong> 2 digit desimal: jika &ge; 50 dibulatkan ke atas (contoh: 54,097,521.98 &rarr; 54,097,522). Jika &lt; 50 dihilangkan (contoh: 54,097,521.08 &rarr; 54,097,521).
            </p>
            <p className="text-[11px] text-slate-700 font-mono mt-0.5">
              Rumus: <strong>Growth NSB = E6 - C6</strong> | <strong>Growth Nominal = F6 - D6</strong> | <strong>Deviasi = F6 - I6</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center flex-shrink-0">
          {/* Upload Bulan Lalu */}
          <input
            ref={fileInputLaluRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange(e, 'bln_lalu')}
            className="hidden"
          />
          <button
            type="button"
            id="btn-kyd-upload-nominatif-lalu"
            onClick={() => fileInputLaluRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            title="Upload Nominatif untuk mengisi kolom BULAN LALU"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Bln Lalu
          </button>

          {/* Upload Bulan Ini */}
          <input
            ref={fileInputIniRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange(e, 'bln_ini')}
            className="hidden"
          />
          <button
            type="button"
            id="btn-kyd-upload-nominatif-ini"
            onClick={() => fileInputIniRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
            title="Upload Nominatif untuk mengisi kolom BULAN INI & otomatis selaraskan bulan Target"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Bln Ini
          </button>

          {/* Upload Target Jatim */}
          <input
            ref={fileInputTargetRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleTargetFileChange}
            className="hidden"
          />
          <button
            type="button"
            id="btn-kyd-upload-target"
            onClick={() => fileInputTargetRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition active:scale-95 cursor-pointer"
            title="Upload file Target Jatim RKAP untuk memperbarui target kredit kantor 1-10"
          >
            <Target className="w-3.5 h-3.5" />
            Upload Target Jatim
          </button>

          <button
            type="button"
            id="btn-kyd-download-sample"
            onClick={generateSampleNominatif}
            title="Unduh format contoh Nominatif Pinjaman kolom A-AE (.xlsx)"
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Format Nominatif</span>
          </button>

          <button
            type="button"
            id="btn-kyd-download-sample-target"
            onClick={generateSampleTargetJatim}
            title="Unduh format contoh Target Jatim RKAP 10 Cabang Jan-Des (.xlsx)"
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Format Target</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border-slate-200">
          <thead>
            {/* Top Multi-Header with Dynamic Month Titles */}
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
              <th colSpan={2} className="py-2 px-3 border border-slate-300 bg-amber-100/70 text-amber-950 font-extrabold">
                BLN LALU ({periodBlnLalu.toUpperCase()})
              </th>
              <th colSpan={2} className="py-2 px-3 border border-slate-300 bg-blue-100/70 text-blue-950 font-extrabold">
                BLN INI ({periodBlnIni.toUpperCase()})
              </th>
              <th colSpan={2} className="py-2 px-3 border border-slate-300 bg-emerald-100/70 text-emerald-950 font-extrabold">
                GROWTH
              </th>
              <th colSpan={2} className="py-2 px-3 border border-slate-300 bg-purple-100/70 text-purple-950 font-extrabold">
                TARGET BLN INI ({MONTH_TARGET_LABELS[targetMonthIndex]})
              </th>
            </tr>
            {/* Bottom Sub-Header */}
            <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b-2 border-slate-400 text-right">
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('blnLaluNsb')}>NSB</th>
              <th className="py-2 px-2.5 border border-slate-300 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('blnLaluOuts')}>OUTS</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-blue-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('blnIniNsb')}>NSB</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-blue-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('blnIniOuts')}>OUTS</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-emerald-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('growthNsb')}>NSB</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-emerald-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('growthNominal')}>NOMINAL</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-purple-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('targetNominal')}>NOMINAL</th>
              <th className="py-2 px-2.5 border border-slate-300 bg-purple-50/50 cursor-pointer hover:bg-slate-200" onClick={() => handleSort('deviasi')}>DEVIASI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono">
            {sorted.map((row, index) => (
              <tr
                key={row.branchCode}
                className={`hover:bg-indigo-50/50 transition ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                }`}
              >
                <td className="py-2 px-3 border border-slate-200 text-center font-sans font-semibold text-slate-600">
                  {row.no}
                </td>
                <td className="py-2 px-3 border border-slate-200 font-sans font-bold text-slate-900 text-left whitespace-nowrap">
                  {row.kantor}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{row.blnLaluNsb.toLocaleString()}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right">{row.blnLaluOuts.toLocaleString()}</td>
                <td className="py-2 px-2.5 border border-slate-200 text-right font-semibold text-blue-900 bg-blue-50/20">
                  {row.blnIniNsb.toLocaleString()}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right font-semibold text-blue-900 bg-blue-50/20">
                  {row.blnIniOuts.toLocaleString()}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right bg-emerald-50/20">
                  {renderAccounting(row.growthNsb)}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right bg-emerald-50/20">
                  {renderAccounting(row.growthNominal)}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right bg-purple-50/20 font-medium text-purple-950" title={`Target ${row.kantor} Bulan ${MONTH_TARGET_NAMES[targetMonthIndex]}`}>
                  {row.targetNominal.toLocaleString()}
                </td>
                <td className="py-2 px-2.5 border border-slate-200 text-right bg-purple-50/20">
                  {renderAccounting(row.deviasi)}
                </td>
              </tr>
            ))}

            {/* TOTAL KONSOLIDASI (Highlighted Footer Row matching Screenshot 2) */}
            <tr className="bg-slate-300/90 text-slate-950 font-extrabold text-[12px] border-t-2 border-b-2 border-slate-500">
              <td className="py-2.5 px-3 border border-slate-400 text-center"></td>
              <td className="py-2.5 px-3 border border-slate-400 font-sans tracking-wide">
                TOTAL KONSOLIDASI
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{konsolidasi.blnLaluNsb.toLocaleString()}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">{konsolidasi.blnLaluOuts.toLocaleString()}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-blue-950">{konsolidasi.blnIniNsb.toLocaleString()}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-blue-950">{konsolidasi.blnIniOuts.toLocaleString()}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">
                {renderAccounting(konsolidasi.growthNsb)}
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">
                {renderAccounting(konsolidasi.growthNominal)}
              </td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right text-purple-950">{konsolidasi.targetNominal.toLocaleString()}</td>
              <td className="py-2.5 px-2.5 border border-slate-400 text-right">
                {renderAccounting(konsolidasi.deviasi)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary KPI Pills */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Pertumbuhan Kredit Konsolidasi:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
            <TrendingUp className="w-3.5 h-3.5" />
            +Rp {konsolidasi.growthNominal.toLocaleString()} rb
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">Deviasi Target Konsolidasi ({MONTH_TARGET_LABELS[targetMonthIndex]}):</span>
          <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded">
            <TrendingDown className="w-3.5 h-3.5" />
            {konsolidasi.deviasi < 0 ? `(${Math.abs(konsolidasi.deviasi).toLocaleString()} rb)` : `Rp ${konsolidasi.deviasi.toLocaleString()} rb`}
          </span>
        </div>
      </div>
    </div>
  );
}
