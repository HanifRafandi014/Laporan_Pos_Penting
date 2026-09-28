import { useRef, useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  Calculator,
  Download,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  Target,
} from 'lucide-react';
import { FileUploadInfo, TargetJatimFileInfo } from '../types';
import {
  generateSampleGLBAL,
  generateSampleLLOAN,
  generateSampleLHPDU,
  generateSampleNominatif,
  generateSampleTargetJatim,
} from '../utils/excelParser';
import { MONTH_TARGET_LABELS, MONTH_TARGET_NAMES } from '../data/defaultData';

interface FileUploaderProps {
  files: {
    glbal: FileUploadInfo | null;
    lloan: FileUploadInfo | null;
    lhpdu: FileUploadInfo | null;
    nominatif?: FileUploadInfo | null;
  };
  nominatifLaluFile?: FileUploadInfo | null;
  targetJatimFile?: TargetJatimFileInfo | null;
  targetMonthIndex?: number;
  onFileUpload: (
    type: 'glbal' | 'lloan' | 'lhpdu' | 'nominatif' | 'target_jatim',
    file: File,
    targetPeriod?: 'bln_ini' | 'bln_lalu'
  ) => void;
  onSelectTargetMonth?: (monthIdx: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  onShowFormulaAudit: () => void;
}

export function FileUploader({
  files,
  nominatifLaluFile,
  targetJatimFile,
  targetMonthIndex = 8,
  onFileUpload,
  onSelectTargetMonth,
  onCalculate,
  isCalculating,
  onShowFormulaAudit,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState<'glbal' | 'lloan' | 'lhpdu' | 'nominatif' | 'target_jatim' | null>(null);

  const glbalInputRef = useRef<HTMLInputElement | null>(null);
  const lloanInputRef = useRef<HTMLInputElement | null>(null);
  const lhpduInputRef = useRef<HTMLInputElement | null>(null);
  const nominatifIniInputRef = useRef<HTMLInputElement | null>(null);
  const nominatifLaluInputRef = useRef<HTMLInputElement | null>(null);
  const targetJatimInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (
    type: 'glbal' | 'lloan' | 'lhpdu' | 'nominatif' | 'target_jatim',
    e: React.ChangeEvent<HTMLInputElement>,
    targetPeriod?: 'bln_ini' | 'bln_lalu'
  ) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(type, e.target.files[0], targetPeriod);
    }
  };

  const handleDrop = (type: 'glbal' | 'lloan' | 'lhpdu' | 'nominatif' | 'target_jatim', e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(type, e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/90 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Unggah Berkas Data Sumber (3 File Excel)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah berkas <strong className="text-slate-700">GLBAL</strong> (Aset, Kredit, DPK, L/R),{' '}
            <strong className="text-slate-700">LLOAN</strong> (LAR &amp; NPL kolom A-DW/DX), dan{' '}
            <strong className="text-slate-700">LHPDU</strong> (Hari Pembayaran &amp; Tunggakan).
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-hitung-tunggakan"
            onClick={onCalculate}
            disabled={isCalculating}
            className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            <Calculator className={`w-4 h-4 mr-1.5 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Menghitung Data...' : 'HITUNG TUNGGAKAN'}
          </button>

          <button
            id="btn-audit-formula"
            onClick={onShowFormulaAudit}
            className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Lihat Rumus Excel
          </button>

          <div className="relative group">
            <button
              id="btn-download-templates"
              className="inline-flex items-center px-3 py-2 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Unduh Format Contoh
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-30 hidden group-hover:block transition-all">
              <button
                onClick={generateSampleGLBAL}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Contoh File GLBAL (.xlsx)</span>
              </button>
              <button
                onClick={generateSampleLLOAN}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Contoh File LLOAN (.xlsx)</span>
              </button>
              <button
                onClick={generateSampleLHPDU}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Contoh File LHPDU (.xlsx)</span>
              </button>
              <button
                onClick={generateSampleNominatif}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 border-t border-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Contoh Nominatif Pinjaman (.xlsx)</span>
              </button>
              <button
                onClick={generateSampleTargetJatim}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 border-t border-slate-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Contoh Target Jatim RKAP (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Upload Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mt-4">
        {/* 1. GLBAL Box */}
        <div
          id="upload-zone-glbal"
          onDragOver={(e) => { e.preventDefault(); setDragActive('glbal'); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={(e) => handleDrop('glbal', e)}
          className={`relative rounded-xl border-2 border-dashed p-3.5 transition-all flex flex-col justify-between ${
            dragActive === 'glbal'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
              : files.glbal
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={glbalInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange('glbal', e)}
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                1
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                  UPLOAD GLBAL
                </h3>
                <span className="text-[11px] text-slate-500">General Ledger Balance</span>
              </div>
            </div>
            {files.glbal ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Data Default
              </span>
            )}
          </div>

          <div className="my-2.5 bg-white/80 rounded-lg p-2 border border-slate-200/60 text-xs">
            {files.glbal ? (
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800 truncate" title={files.glbal.name}>
                  {files.glbal.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{files.glbal.rowCount.toLocaleString()} baris data</span>
                  <span>{formatFileSize(files.glbal.size)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Memuat data saldo COA 10000, 14100, 17000, 22100, 22200, 40000, 50000
              </p>
            )}
          </div>

          <button
            type="button"
            id="btn-browse-glbal"
            onClick={() => glbalInputRef.current?.click()}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm cursor-pointer"
          >
            {files.glbal ? 'Ganti Berkas GLBAL' : 'Pilih File GLBAL'}
          </button>
        </div>

        {/* 2. LLOAN Box */}
        <div
          id="upload-zone-lloan"
          onDragOver={(e) => { e.preventDefault(); setDragActive('lloan'); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={(e) => handleDrop('lloan', e)}
          className={`relative rounded-xl border-2 border-dashed p-3.5 transition-all flex flex-col justify-between ${
            dragActive === 'lloan'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
              : files.lloan
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={lloanInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange('lloan', e)}
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                2
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                  UPLOAD LLOAN
                </h3>
                <span className="text-[11px] text-slate-500">Nominatif Pinjaman (Col A-DW)</span>
              </div>
            </div>
            {files.lloan ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Data Default
              </span>
            )}
          </div>

          <div className="my-2.5 bg-white/80 rounded-lg p-2 border border-slate-200/60 text-xs">
            {files.lloan ? (
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800 truncate" title={files.lloan.name}>
                  {files.lloan.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{files.lloan.rowCount.toLocaleString()} baris pinjaman</span>
                  <span>{formatFileSize(files.lloan.size)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Data fasilitas kredit, Kol 1-5 (Col Z), Saldo (BU, CM, CQ), DPD (Col DX)
              </p>
            )}
          </div>

          <button
            type="button"
            id="btn-browse-lloan"
            onClick={() => lloanInputRef.current?.click()}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm cursor-pointer"
          >
            {files.lloan ? 'Ganti Berkas LLOAN' : 'Pilih File LLOAN'}
          </button>
        </div>

        {/* 3. LHPDU Box */}
        <div
          id="upload-zone-lhpdu"
          onDragOver={(e) => { e.preventDefault(); setDragActive('lhpdu'); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={(e) => handleDrop('lhpdu', e)}
          className={`relative rounded-xl border-2 border-dashed p-3.5 transition-all flex flex-col justify-between ${
            dragActive === 'lhpdu'
              ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
              : files.lhpdu
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={lhpduInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange('lhpdu', e)}
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                3
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                  UPLOAD LHPDU
                </h3>
                <span className="text-[11px] text-slate-500">Hari Pembayaran &amp; Tunggakan</span>
              </div>
            </div>
            {files.lhpdu ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Data Default
              </span>
            )}
          </div>

          <div className="my-2.5 bg-white/80 rounded-lg p-2 border border-slate-200/60 text-xs">
            {files.lhpdu ? (
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800 truncate" title={files.lhpdu.name}>
                  {files.lhpdu.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{files.lhpdu.rowCount.toLocaleString()} baris tunggakan</span>
                  <span>{formatFileSize(files.lhpdu.size)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Data rincian tunggakan pokok, bunga, denda &amp; jatuh tempo (Col A-X)
              </p>
            )}
          </div>

          <button
            type="button"
            id="btn-browse-lhpdu"
            onClick={() => lhpduInputRef.current?.click()}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition shadow-sm cursor-pointer"
          >
            {files.lhpdu ? 'Ganti Berkas LHPDU' : 'Pilih File LHPDU'}
          </button>
        </div>

        {/* 4. NOMINATIF PINJAMAN Box */}
        <div
          id="upload-zone-nominatif"
          onDragOver={(e) => { e.preventDefault(); setDragActive('nominatif'); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={(e) => handleDrop('nominatif', e)}
          className={`relative rounded-xl border-2 border-dashed p-3.5 transition-all flex flex-col justify-between ${
            dragActive === 'nominatif'
              ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
              : files.nominatif || nominatifLaluFile
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
          }`}
        >
          {/* Input file Bulan Ini */}
          <input
            ref={nominatifIniInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange('nominatif', e, 'bln_ini')}
            className="hidden"
          />
          {/* Input file Bulan Lalu */}
          <input
            ref={nominatifLaluInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt"
            onChange={(e) => handleFileChange('nominatif', e, 'bln_lalu')}
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                4
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                  UPLOAD NOMINATIF
                </h3>
                <span className="text-[11px] text-slate-500">Bulan Lalu &amp; Bulan Ini (Col A-AE)</span>
              </div>
            </div>
            {files.nominatif || nominatifLaluFile ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" />
                Terunggah
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Data Default
              </span>
            )}
          </div>

          <div className="my-2.5 bg-white/80 rounded-lg p-2 border border-slate-200/60 text-xs space-y-1.5">
            {/* Status Bulan Ini */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Bln Ini:
              </span>
              {files.nominatif ? (
                <span className="text-slate-700 truncate max-w-[130px]" title={files.nominatif.name}>
                  {files.nominatif.rowCount.toLocaleString()} dbt
                </span>
              ) : (
                <span className="text-slate-400 italic">Default</span>
              )}
            </div>

            {/* Status Bulan Lalu */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-amber-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Bln Lalu:
              </span>
              {nominatifLaluFile ? (
                <span className="text-slate-700 truncate max-w-[130px]" title={nominatifLaluFile.name}>
                  {nominatifLaluFile.rowCount.toLocaleString()} dbt
                </span>
              ) : (
                <span className="text-slate-400 italic">Default</span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
              Count row BDEBET &amp; Sum BDEBET (KOL 1-5, KOL E dieliminasi). Target Nominal tetap.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              id="btn-browse-nominatif-ini"
              onClick={() => nominatifIniInputRef.current?.click()}
              className="py-1.5 px-2 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs text-center cursor-pointer truncate"
              title="Upload berkas Nominatif Pinjaman untuk kolom Bulan Ini"
            >
              Upload Bln Ini
            </button>
            <button
              type="button"
              id="btn-browse-nominatif-lalu"
              onClick={() => nominatifLaluInputRef.current?.click()}
              className="py-1.5 px-2 text-[11px] font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs text-center cursor-pointer truncate"
              title="Upload berkas Nominatif Pinjaman untuk kolom Bulan Lalu"
            >
              Upload Bln Lalu
            </button>
          </div>
        </div>

        {/* 5. TARGET JATIM Box */}
        <div
          id="upload-zone-target-jatim"
          onDragOver={(e) => { e.preventDefault(); setDragActive('target_jatim'); }}
          onDragLeave={() => setDragActive(null)}
          onDrop={(e) => handleDrop('target_jatim', e)}
          className={`relative rounded-xl border-2 border-dashed p-3.5 transition-all flex flex-col justify-between ${
            dragActive === 'target_jatim'
              ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20'
              : targetJatimFile
              ? 'border-purple-300 bg-purple-50/30'
              : 'border-slate-300 hover:border-purple-400 bg-slate-50/60'
          }`}
        >
          <input
            ref={targetJatimInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileChange('target_jatim', e)}
            className="hidden"
          />

          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                5
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-wide flex items-center gap-1">
                  TARGET JATIM
                </h3>
                <span className="text-[11px] text-slate-500">RKAP Kredit Jan-Des</span>
              </div>
            </div>
            {targetJatimFile ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                <FileCheck2 className="w-3 h-3" />
                Custom
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                RKAP Jatim
              </span>
            )}
          </div>

          <div className="my-2.5 bg-white/80 rounded-lg p-2 border border-slate-200/60 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-purple-900 flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-600" /> Target Aktif:
              </span>
              <span className="font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded text-[10px]">
                {MONTH_TARGET_LABELS[targetMonthIndex] || 'AGTS/SEP'}
              </span>
            </div>
            {targetJatimFile ? (
              <div className="text-[11px] text-slate-600 truncate" title={targetJatimFile.name}>
                <p className="font-medium text-slate-800 truncate">{targetJatimFile.name}</p>
                <p className="text-[10px] text-purple-700 font-semibold">{targetJatimFile.branchNamesFound.length} cabang terpetakan</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500">
                Otomatis ambil bulan sesuai upload Bulan Ini (contoh: normatif_agustus &rarr; Agts).
              </p>
            )}
            <p className="text-[9px] text-slate-400 border-t border-slate-100 pt-0.5">
              Aturan: desimal &ge; 50 dibulatkan ke atas, &lt; 50 dihilangkan.
            </p>
          </div>

          <button
            type="button"
            id="btn-browse-target-jatim"
            onClick={() => targetJatimInputRef.current?.click()}
            className="w-full py-1.5 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition shadow-sm cursor-pointer"
          >
            {targetJatimFile ? 'Ganti Target Jatim' : 'Pilih File Target Jatim'}
          </button>
        </div>
      </div>

      {/* Notification / Info banner */}
      <div className="mt-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Siap Dihitung:</strong> Unggah berkas data sumber kapan saja. Sistem secara otomatis membaca struktur kolom A-AE, memfilter KOL 1-5 (KOL E dieliminasi), dan menghitung Growth &amp; Deviasi.
          </span>
        </div>
        <span className="text-[11px] font-medium text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded hidden sm:inline-block">
          Sesuai Gambar Excel
        </span>
      </div>
    </div>
  );
}
