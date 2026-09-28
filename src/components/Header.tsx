import { Building2, Calendar, FileSpreadsheet, Printer, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

interface HeaderProps {
  reportDate: string;
  onDateChange: (newDate: string) => void;
  activeTab: 'pos' | 'kyd' | 'dashboard' | 'tunggakan';
  onTabChange: (tab: 'pos' | 'kyd' | 'dashboard' | 'tunggakan') => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onResetDefault: () => void;
  isCalculating?: boolean;
  periodBlnLalu?: string;
  periodBlnIni?: string;
}

export function Header({
  reportDate,
  onDateChange,
  activeTab,
  onTabChange,
  onExportExcel,
  onPrint,
  onResetDefault,
  isCalculating,
  periodBlnLalu = 'Agustus 2026',
  periodBlnIni = 'September 2026',
}: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-white/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Financial Analytics &amp; Pos-Pos Penting
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Per Cabang
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otomatisasi kalkulasi GLBAL, LLOAN &amp; LHPDU • Format Ribuan Rupiah
              </p>
            </div>
          </div>

          {/* Quick Date and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dynamic Active Period Display & Editor */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 shadow-inner">
                <Calendar className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
                <span className="text-slate-400 mr-1.5 font-medium">Periode Aktif:</span>
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-slate-900/60 font-semibold text-white px-2.5 py-0.5 rounded border border-slate-700 focus:border-blue-400 focus:outline-none text-xs text-center min-w-[130px]"
                  title="Periode otomatis terdeteksi dari berkas GLBAL/LLOAN yang diunggah (atau ketik untuk ubah bebas)"
                />
              </div>
            </div>

            {/* Reset to Default */}
            <button
              id="btn-reset-default"
              onClick={onResetDefault}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Kembalikan ke data standar 20-Sep-26"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 text-slate-400 ${isCalculating ? 'animate-spin' : ''}`} />
              Reset Data
            </button>

            {/* Print */}
            <button
              id="btn-print-laporan"
              onClick={onPrint}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-700/30 transition active:scale-95"
              title="Cetak Laporan / Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              PRINT HASIL
            </button>

            {/* Export Excel */}
            <button
              id="btn-export-excel"
              onClick={onExportExcel}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/25 transition active:scale-95"
              title="Download Excel (.xlsx) dengan sheet HASIL LAPORAN dan KYD SEP"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              DOWNLOAD EXCEL
            </button>
          </div>
        </div>

        {/* Navigation Tabs (matching Excel Sheet Tabs in screenshot) */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 pt-2 pb-1 overflow-x-auto text-xs no-scrollbar">
          <button
            id="tab-hasil-laporan"
            onClick={() => onTabChange('pos')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'pos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            HASIL LAPORAN (POS-POS PENTING)
          </button>

          <button
            id="tab-kyd-sep"
            onClick={() => onTabChange('kyd')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'kyd'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            KYD SEP (LAPORAN KREDIT PER CABANG)
          </button>

          <button
            id="tab-dashboard"
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            DASHBOARD &amp; GRAFIK VISUALISASI
          </button>

          <button
            id="tab-tunggakan"
            onClick={() => onTabChange('tunggakan')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'tunggakan'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            RINCIAN TUNGGAKAN &amp; LAR/NPL
          </button>
        </div>
      </div>
    </header>
  );
}
