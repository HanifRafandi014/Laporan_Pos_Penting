import { useState, useRef } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { PosPosPentingTable } from './components/PosPosPentingTable';
import { KydTable } from './components/KydTable';
import { DashboardCharts } from './components/DashboardCharts';
import { TunggakanView } from './components/TunggakanView';
import { FormulaAuditModal } from './components/FormulaAuditModal';
import { BranchDetailModal } from './components/BranchDetailModal';
import {
  BranchReport,
  KydBranchReport,
  FileUploadInfo,
  TunggakanItem,
  RawRowNominatif,
  TargetJatimFileInfo,
  TargetJatimMatrix,
} from './types';
import {
  INITIAL_BRANCH_REPORTS,
  SEPTEMBER_BRANCH_REPORTS,
  AGUSTUS_BRANCH_REPORTS,
  JULI_BRANCH_REPORTS,
  MONTHLY_BRANCH_DATA,
  INITIAL_KYD_REPORTS,
  INITIAL_TUNGGAKAN_DATA,
  BULAN_LALU_LAR_DATA,
  DEFAULT_TARGET_JATIM_MATRIX,
  MONTH_TARGET_LABELS,
  MONTH_TARGET_NAMES,
} from './data/defaultData';
import {
  parseExcelFile,
  parseTargetJatimFile,
  normalizeGLBAL,
  normalizeLLOAN,
  normalizeLHPDU,
  normalizeNominatif,
  calculatePosPosPenting,
  calculateKydFromNominatif,
  recalculateAllKyd,
  detectPeriodFromFile,
  exportReportToExcel,
  RawRowGLBAL,
  RawRowLLOAN,
  RawRowLHPDU,
} from './utils/excelParser';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function App() {
  const [reportDate, setReportDate] = useState('23-Sep-2026');
  const [activeTab, setActiveTab] = useState<'pos' | 'kyd' | 'dashboard' | 'tunggakan'>('pos');
  const [periodBlnLalu, setPeriodBlnLalu] = useState('Agustus 2026');
  const [periodBlnIni, setPeriodBlnIni] = useState('September 2026');
  const [nominatifLaluFile, setNominatifLaluFile] = useState<FileUploadInfo | null>(null);

  // Target Jatim RKAP state
  const [targetJatimMatrix, setTargetJatimMatrix] = useState<TargetJatimMatrix>(DEFAULT_TARGET_JATIM_MATRIX);
  const [targetJatimFile, setTargetJatimFile] = useState<TargetJatimFileInfo | null>(null);
  const [targetMonthIndex, setTargetMonthIndex] = useState<number>(8); // default to 8 (September)

  const targetMatrixRef = useRef<TargetJatimMatrix>(DEFAULT_TARGET_JATIM_MATRIX);
  const targetMonthRef = useRef<number>(8);

  // File Upload states
  const [files, setFiles] = useState<{
    glbal: FileUploadInfo | null;
    lloan: FileUploadInfo | null;
    lhpdu: FileUploadInfo | null;
    nominatif: FileUploadInfo | null;
  }>({
    glbal: null,
    lloan: null,
    lhpdu: null,
    nominatif: null,
  });

  // Raw rows stored in memory
  const [rawGlbal, setRawGlbal] = useState<RawRowGLBAL[]>([]);
  const [rawLloan, setRawLloan] = useState<RawRowLLOAN[]>([]);
  const [rawLhpdu, setRawLhpdu] = useState<RawRowLHPDU[]>([]);
  const [rawNominatif, setRawNominatif] = useState<RawRowNominatif[]>([]);
  const [rawNominatifLalu, setRawNominatifLalu] = useState<RawRowNominatif[]>([]);

  const rawGlbalRef = useRef<RawRowGLBAL[]>([]);
  const rawLloanRef = useRef<RawRowLLOAN[]>([]);
  const rawLhpduRef = useRef<RawRowLHPDU[]>([]);
  const rawNominatifRef = useRef<RawRowNominatif[]>([]);
  const rawNominatifLaluRef = useRef<RawRowNominatif[]>([]);

  // Reports
  const [branchReports, setBranchReports] = useState<BranchReport[]>(INITIAL_BRANCH_REPORTS);
  const [kydReports, setKydReports] = useState<KydBranchReport[]>(INITIAL_KYD_REPORTS);
  const [tunggakanList, setTunggakanList] = useState<TunggakanItem[]>(INITIAL_TUNGGAKAN_DATA);

  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchReport | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>({
    message: 'Data Pos-Pos Penting & LAR resmi 23-Sep-2026 termuat. Unggah berkas baru kapan pun untuk kalkulasi dinamis.',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Handle Target Month selection
  const handleSelectTargetMonth = (monthIdx: number) => {
    setTargetMonthIndex(monthIdx);
    targetMonthRef.current = monthIdx;
    const currentMatrix = targetMatrixRef.current;
    setKydReports((prev) =>
      prev.map((b) => {
        const branchTargets = currentMatrix[b.branchCode];
        const targetNominal = branchTargets && branchTargets[monthIdx] !== undefined
          ? branchTargets[monthIdx]
          : b.targetNominal;
        const deviasi = b.blnIniOuts - targetNominal;
        return {
          ...b,
          targetNominal,
          deviasi,
        };
      })
    );
    showToast(
      `Target RKAP KYD dialihkan ke bulan ${MONTH_TARGET_NAMES[monthIdx].toUpperCase()} (${MONTH_TARGET_LABELS[monthIdx]}). Target kantor & deviasi diperbarui.`,
      'info'
    );
  };

  // Handle uploaded file
  const handleFileUpload = async (
    type: 'glbal' | 'lloan' | 'lhpdu' | 'nominatif' | 'target_jatim',
    file: File,
    forcedTarget?: 'bln_ini' | 'bln_lalu'
  ) => {
    try {
      setIsCalculating(true);

      // Handle Target Jatim Upload
      if (type === 'target_jatim') {
        const { targets, branchNamesFound } = await parseTargetJatimFile(file);
        targetMatrixRef.current = targets;
        setTargetJatimMatrix(targets);
        setTargetJatimFile({
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toLocaleTimeString(),
          targets,
          branchNamesFound,
        });

        // Update target nominal in KYD reports using current target month
        setKydReports((prev) =>
          prev.map((b) => {
            const branchTargets = targets[b.branchCode];
            const targetNominal = branchTargets && branchTargets[targetMonthRef.current] !== undefined
              ? branchTargets[targetMonthRef.current]
              : b.targetNominal;
            const deviasi = b.blnIniOuts - targetNominal;
            return {
              ...b,
              targetNominal,
              deviasi,
            };
          })
        );
        setActiveTab('kyd');
        showToast(
          `Berkas Target Jatim RKAP "${file.name}" (${branchNamesFound.length} cabang) berhasil dimuat! Target kredit kantor 1-10 telah diselaraskan dengan aturan pembulatan desimal >= 50.`,
          'success'
        );
        setIsCalculating(false);
        return;
      }

      const rawMatrix = await parseExcelFile(file, type);
      const detected = detectPeriodFromFile(file.name, rawMatrix);

      let rowCount = 0;
      if (type === 'glbal') {
        const normalized = normalizeGLBAL(rawMatrix);
        rawGlbalRef.current = normalized;
        setRawGlbal(normalized);
        rowCount = normalized.length;
        setFiles((prev) => ({
          ...prev,
          glbal: {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            rowCount,
            uploadedAt: new Date().toLocaleTimeString(),
            status: 'ready',
          },
        }));

        if (detected) {
          setReportDate(detected.label);
          if (detected.suggestedTarget === 'bln_lalu') {
            setPeriodBlnLalu(detected.label);
          } else {
            setPeriodBlnIni(detected.label);
          }
        }
        showToast(
          `Berkas GLBAL "${file.name}" (${rowCount.toLocaleString()} baris) berhasil diurai! ${
            detected ? `Terdeteksi periode: ${detected.label}` : ''
          }`,
          'success'
        );
      } else if (type === 'lloan') {
        const normalized = normalizeLLOAN(rawMatrix);
        rawLloanRef.current = normalized;
        setRawLloan(normalized);
        rowCount = normalized.length;
        setFiles((prev) => ({
          ...prev,
          lloan: {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            rowCount,
            uploadedAt: new Date().toLocaleTimeString(),
            status: 'ready',
          },
        }));
        showToast(`Berkas LLOAN "${file.name}" (${rowCount.toLocaleString()} baris) berhasil diurai!`, 'success');
      } else if (type === 'lhpdu') {
        const normalized = normalizeLHPDU(rawMatrix);
        rawLhpduRef.current = normalized;
        setRawLhpdu(normalized);
        rowCount = normalized.length;
        setFiles((prev) => ({
          ...prev,
          lhpdu: {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            rowCount,
            uploadedAt: new Date().toLocaleTimeString(),
            status: 'ready',
          },
        }));
        showToast(`Berkas LHPDU "${file.name}" (${rowCount.toLocaleString()} baris) berhasil diurai!`, 'success');
      } else if (type === 'nominatif') {
        const normalized = normalizeNominatif(rawMatrix);
        rowCount = normalized.length;

        // Tentukan target periode: paksa target jika ada, atau gunakan deteksi otomatis
        const targetPeriod: 'bln_ini' | 'bln_lalu' =
          forcedTarget || detected?.suggestedTarget || 'bln_ini';

        if (targetPeriod === 'bln_lalu') {
          rawNominatifLaluRef.current = normalized;
          setRawNominatifLalu(normalized);
          const monthLabel = detected?.label || 'Bulan Lalu';
          setPeriodBlnLalu(monthLabel);
          setNominatifLaluFile({
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            rowCount,
            uploadedAt: new Date().toLocaleTimeString(),
            status: 'ready',
          });

          // Update KYD report column BLN LALU (NSB & OUTS)
          setKydReports((prev) =>
            calculateKydFromNominatif(
              normalized,
              prev,
              'bln_lalu',
              targetMonthRef.current,
              targetMatrixRef.current
            )
          );
          setActiveTab('kyd');
          showToast(
            `Pivot Nominatif Pinjaman Bulan Lalu (${monthLabel}) "${file.name}" berhasil! (${rowCount.toLocaleString()} debitur valid). Kolom BLN LALU & Growth terisi dinamis.`,
            'success'
          );
        } else {
          rawNominatifRef.current = normalized;
          setRawNominatif(normalized);
          let activeMonthIdx = targetMonthRef.current;
          if (detected && detected.monthIndex !== undefined) {
            activeMonthIdx = detected.monthIndex;
            targetMonthRef.current = detected.monthIndex;
            setTargetMonthIndex(detected.monthIndex);
            setPeriodBlnIni(detected.label);
          } else if (detected) {
            setPeriodBlnIni(detected.label);
          }

          setFiles((prev) => ({
            ...prev,
            nominatif: {
              name: file.name,
              size: file.size,
              lastModified: file.lastModified,
              rowCount,
              uploadedAt: new Date().toLocaleTimeString(),
              status: 'ready',
            },
          }));

          // Update KYD report column BLN INI (NSB & OUTS) and Target Bulan Ini from Target Jatim
          setKydReports((prev) =>
            calculateKydFromNominatif(
              normalized,
              prev,
              'bln_ini',
              activeMonthIdx,
              targetMatrixRef.current
            )
          );
          setActiveTab('kyd');
          const targetMonthName = MONTH_TARGET_NAMES[activeMonthIdx] || 'September';
          showToast(
            `Pivot Nominatif Bulan Ini "${file.name}" berhasil (${rowCount.toLocaleString()} debitur valid)! Target RKAP diselaraskan ke ${targetMonthName.toUpperCase()} (Wlingi, Kepanjen, s.d Ngadiluwih).`,
            'success'
          );
        }
      }

      // Automatically recalculate with latest state from all uploaded files
      executeCalculation(
        rawGlbalRef.current,
        rawLloanRef.current,
        rawLhpduRef.current,
        rawNominatifRef.current,
        type,
        detected?.label
      );
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal membaca berkas ${file.name}: ${err.message || 'Format tidak dikenali'}`, 'error');
      setIsCalculating(false);
    }
  };

  // Core Calculation Executor
  const executeCalculation = (
    glbal: RawRowGLBAL[],
    lloan: RawRowLLOAN[],
    lhpdu: RawRowLHPDU[],
    nominatif: RawRowNominatif[] = rawNominatifRef.current,
    uploadType?: string,
    forcedDate?: string
  ) => {
    setIsCalculating(true);
    try {
      const activeDateStr = forcedDate || reportDate;
      const computedReports = calculatePosPosPenting(glbal, lloan, lhpdu, nominatif, activeDateStr);
      setBranchReports(computedReports);

      // Update KYD report:
      // If Nominatif Pinjaman files (either Bulan Lalu or Bulan Ini) are uploaded, recalculate from them
      if (rawNominatifLaluRef.current.length > 0 || nominatif.length > 0) {
        setKydReports((prev) =>
          recalculateAllKyd(
            rawNominatifLaluRef.current,
            nominatif,
            prev,
            targetMonthRef.current,
            targetMatrixRef.current
          )
        );
      } else {
        // Otherwise, sync from computed credit and current target matrix
        setKydReports((prev) =>
          prev.map((k) => {
            const match = computedReports.find((r) => r.branchCode === k.branchCode);
            if (!match) return k;
            const newBlnIniOuts = match.kredit;
            const branchTargets = targetMatrixRef.current[k.branchCode];
            const targetNominal = branchTargets && branchTargets[targetMonthRef.current] !== undefined
              ? branchTargets[targetMonthRef.current]
              : k.targetNominal;
            const newGrowthNominal = newBlnIniOuts - k.blnLaluOuts;
            const newDeviasi = newBlnIniOuts - targetNominal;
            return {
              ...k,
              blnIniOuts: newBlnIniOuts,
              targetNominal,
              growthNominal: newGrowthNominal,
              deviasi: newDeviasi,
            };
          })
        );
      }

      // Update Tunggakan list based on LLOAN / LHPDU if provided
      if (lloan.length > 0) {
        setTunggakanList((prev) =>
          prev.map((t) => {
            const match = computedReports.find((r) => r.branchCode === t.branchCode);
            if (!match) return t;
            return {
              ...t,
              totalLar: match.lar,
              totalNpl: match.npl,
            };
          })
        );
      }

      showToast('Perhitungan Pos-Pos Penting, LAR, %LAR, NPL & %NPL berhasil diperbarui secara dinamis & presisi!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Kesalahan saat perhitungan: ${err.message}`, 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setReportDate(newDate);

    const lower = newDate.toLowerCase();
    let monthKey: 'september' | 'agustus' | 'juli' = 'september';
    let monthLabel = 'September 2026';
    let detectedMonthIdx = 8;

    if (lower.includes('jul')) {
      monthKey = 'juli';
      monthLabel = 'Juli 2026';
      detectedMonthIdx = 6;
    } else if (lower.includes('agu') || lower.includes('kemarin') || lower.includes('lalu') || lower.includes('prev')) {
      monthKey = 'agustus';
      monthLabel = 'Agustus 2026';
      detectedMonthIdx = 7;
    } else {
      monthKey = 'september';
      monthLabel = 'September 2026';
      detectedMonthIdx = 8;
    }

    setTargetMonthIndex(detectedMonthIdx);
    targetMonthRef.current = detectedMonthIdx;

    if (rawGlbalRef.current.length === 0 && rawLloanRef.current.length === 0) {
      const activeReports = MONTHLY_BRANCH_DATA[monthKey];
      setBranchReports(activeReports);
      setTunggakanList((prev) =>
        prev.map((t) => {
          const match = activeReports.find((r) => r.branchCode === t.branchCode);
          if (!match) return t;
          return {
            ...t,
            totalLar: match.lar,
            totalNpl: match.npl,
          };
        })
      );

      // Sync KYD report targets to selected month
      setKydReports((prev) =>
        prev.map((b) => {
          const branchTargets = targetMatrixRef.current[b.branchCode];
          const targetNominal = branchTargets && branchTargets[detectedMonthIdx] !== undefined
            ? branchTargets[detectedMonthIdx]
            : b.targetNominal;
          const deviasi = b.blnIniOuts - targetNominal;
          return { ...b, targetNominal, deviasi };
        })
      );
      showToast(`Beralih ke data resmi ${newDate} (${monthLabel})!`, 'info');
    } else {
      executeCalculation(
        rawGlbalRef.current,
        rawLloanRef.current,
        rawLhpduRef.current,
        rawNominatifRef.current,
        undefined,
        newDate
      );
    }
  };

  const handleManualCalculate = () => {
    executeCalculation(rawGlbalRef.current, rawLloanRef.current, rawLhpduRef.current, rawNominatifRef.current);
  };

  const handleResetDefault = () => {
    rawGlbalRef.current = [];
    rawLloanRef.current = [];
    rawLhpduRef.current = [];
    rawNominatifRef.current = [];
    rawNominatifLaluRef.current = [];
    targetMatrixRef.current = DEFAULT_TARGET_JATIM_MATRIX;
    targetMonthRef.current = 8;
    setReportDate('23-Sep-2026');
    setBranchReports(INITIAL_BRANCH_REPORTS);
    setKydReports(INITIAL_KYD_REPORTS);
    setTunggakanList(INITIAL_TUNGGAKAN_DATA);
    setTargetJatimMatrix(DEFAULT_TARGET_JATIM_MATRIX);
    setTargetJatimFile(null);
    setTargetMonthIndex(8);
    setRawGlbal([]);
    setRawLloan([]);
    setRawLhpdu([]);
    setRawNominatif([]);
    setRawNominatifLalu([]);
    setNominatifLaluFile(null);
    setPeriodBlnLalu('Agustus 2026');
    setPeriodBlnIni('September 2026');
    setFiles({ glbal: null, lloan: null, lhpdu: null, nominatif: null });
    showToast('Data berhasil di-reset kembali ke nilai awal 23-Sep-2026 & Target RKAP default!', 'info');
  };

  const handleExportExcel = () => {
    exportReportToExcel(branchReports, kydReports, reportDate);
    showToast('Berkas Excel laporan berhasil diunduh!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans">
      {/* Top Application Bar */}
      <Header
        reportDate={reportDate}
        onDateChange={handleDateChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExportExcel={handleExportExcel}
        onPrint={handlePrint}
        onResetDefault={handleResetDefault}
        isCalculating={isCalculating}
        periodBlnLalu={periodBlnLalu}
        periodBlnIni={periodBlnIni}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Floating / Top Toast Notification */}
        {notification && (
          <div
            className={`no-print mb-4 p-3 rounded-xl border flex items-center justify-between shadow-xs transition-all animate-in fade-in duration-200 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* 5-Card File Upload Component (No-Print) */}
        <div className="no-print">
          <FileUploader
            files={files}
            nominatifLaluFile={nominatifLaluFile}
            targetJatimFile={targetJatimFile}
            targetMonthIndex={targetMonthIndex}
            onFileUpload={handleFileUpload}
            onCalculate={handleManualCalculate}
            isCalculating={isCalculating}
            onShowFormulaAudit={() => setShowFormulaModal(true)}
          />
        </div>

        {/* Dynamic Views by Tab */}
        {activeTab === 'pos' && (
          <section id="view-pos-pos-penting">
            <PosPosPentingTable
              reports={branchReports}
              reportDate={reportDate}
              onSelectBranch={(branch) => setSelectedBranch(branch)}
              onShowFormulaAudit={() => setShowFormulaModal(true)}
            />
          </section>
        )}

        {activeTab === 'kyd' && (
          <section id="view-kyd-kredit">
            <KydTable
              reports={kydReports}
              reportDate={reportDate}
              periodBlnLalu={periodBlnLalu}
              periodBlnIni={periodBlnIni}
              nominatifFile={files.nominatif}
              nominatifLaluFile={nominatifLaluFile}
              targetJatimFile={targetJatimFile}
              targetMonthIndex={targetMonthIndex}
              onFileUpload={handleFileUpload}
              onSelectTargetMonth={handleSelectTargetMonth}
              onPeriodLaluChange={setPeriodBlnLalu}
              onPeriodIniChange={setPeriodBlnIni}
            />
          </section>
        )}

        {activeTab === 'dashboard' && (
          <section id="view-dashboard-analytics">
            <DashboardCharts
              reports={branchReports}
              kydReports={kydReports}
              reportDate={reportDate}
            />
          </section>
        )}

        {activeTab === 'tunggakan' && (
          <section id="view-tunggakan">
            <TunggakanView
              tunggakanList={tunggakanList}
              reports={branchReports}
              reportDate={reportDate}
            />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Sistem Otomatisasi Laporan Keuangan &amp; Pos-Pos Penting Cabang</span>
          </div>
          <div>
            Format Ribuan Rupiah • Sesuai Struktur LLOAN (Col A-DW), GLBAL, LHPDU &amp; Target Jatim RKAP
          </div>
        </div>
      </footer>

      {/* Formula Audit Modal */}
      <FormulaAuditModal
        isOpen={showFormulaModal}
        onClose={() => setShowFormulaModal(false)}
      />

      {/* Branch Detail Drilldown Modal */}
      <BranchDetailModal
        branch={selectedBranch}
        kyd={selectedBranch ? kydReports.find((k) => k.branchCode === selectedBranch.branchCode) : undefined}
        tunggakan={selectedBranch ? tunggakanList.find((t) => t.branchCode === selectedBranch.branchCode) : undefined}
        reportDate={reportDate}
        onClose={() => setSelectedBranch(null)}
      />
    </div>
  );
}
