import * as XLSX from 'xlsx';
import { BranchReport, KydBranchReport, TunggakanItem, RawRowNominatif } from '../types';
import {
  BRANCH_LIST,
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
} from '../data/defaultData';

export interface RawRowGLBAL {
  colA: string | number; // 1: Status
  colB: string | number; // 2: Group
  colC: number;          // 3: Branch Code (1-10)
  colD: number;          // 4: Account COA (10000, 14100, 17000, 22100, 22200, 22250, 24100, 40000, 50000)
  colE: string;          // 5: Currency (IDR)
  colG?: number;         // 7: Day of month (e.g. 31, 30)
  colH?: string | number;// 8: Period YYYYMM (e.g. 202608 -> Agustus 2026, 202607 -> Juli 2026)
  colI: number;          // 9: Balance Amount
  [key: string]: any;
}

export interface RawRowLLOAN {
  statusRecord: string; // Col A
  branch: number;       // Col D
  custCode?: string;    // Col E (4)
  loanNumber?: string;  // Col M (12)
  collectibility: number; // Col Z (25)
  amountBU: number;     // Col BU (72)
  amountCM: number;     // Col CM (90)
  amountCQ: number;     // Col CQ (94)
  dpdIndicator: number; // Col DX (127) / DV (125)
  duePrinciple?: number; // Col CJ (87)
  dueInterest?: number;  // Col CK (88)
  duePenalty?: number;   // Col CL (89)
  [key: string]: any;
}

export interface RawRowLHPDU {
  colA: string;
  colB: string;
  colC: number;
  colD: number; // branch
  colE: string | number; // cust code / loan no
  loanNumber?: string;
  dpd?: number;
  amountN: number; // Col 14 - pokok tertunggak
  amountO: number; // Col 15 - bunga tertunggak
  [key: string]: any;
}

export interface ParsedFilesData {
  glbalRows: RawRowGLBAL[];
  lloanRows: RawRowLLOAN[];
  lhpduRows: RawRowLHPDU[];
}

/**
 * Parses an uploaded Excel/CSV file into raw rows with optional preferred sheet hint
 */
export async function parseExcelFile(file: File, sheetHint?: string): Promise<any[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true, cellDates: true });
  let targetSheetName = workbook.SheetNames[0];
  if (sheetHint && workbook.SheetNames.length > 1) {
    const hintLower = sheetHint.toLowerCase();
    const matched = workbook.SheetNames.find(name => name.toLowerCase().includes(hintLower));
    if (matched) targetSheetName = matched;
  }
  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) return [];

  // Pastikan rentang !ref mencakup hingga kolom DX (kolom 128 / indeks 127) dan sel terjauh
  // agar SheetJS tidak memotong kolom di tengah jalan
  let maxC = 135;
  let maxR = 0;
  if (worksheet['!ref']) {
    const decoded = XLSX.utils.decode_range(worksheet['!ref']);
    maxC = Math.max(maxC, decoded.e.c);
    maxR = Math.max(maxR, decoded.e.r);
  }
  for (const cell in worksheet) {
    if (cell.charCodeAt(0) === 33) continue; // lewati !ref, !margins, dsb
    const decoded = XLSX.utils.decode_cell(cell);
    if (decoded.c > maxC) maxC = decoded.c;
    if (decoded.r > maxR) maxR = decoded.r;
  }
  worksheet['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: maxC, r: maxR } });

  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  return rows;
}

/**
 * Membaca dan memparsing berkas TARGET JATIM RKAP (semua sheet)
 */
export async function parseTargetJatimFile(file: File): Promise<{
  targets: Record<number, number[]>;
  branchNamesFound: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true, cellDates: true });
  return parseTargetJatimWorkbook(workbook);
}

/**
 * Ekstrak tanggal dan periode langsung dari baris berkas GLBAL:
 * Kolom G (index 6): Hari (contoh: 31, 30, 20)
 * Kolom H (index 7): YYYYMM (contoh: 202608 -> Agustus 2026, 202607 -> Juli 2026)
 */
export function extractPeriodFromGLBAL(rows: any[][]): {
  day: number;
  monthIndex: number;
  monthName: string;
  year: number;
  label: string;
  periodKey: string;
} | null {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  for (let i = 0; i < Math.min(rows.length, 100); i++) {
    const r = rows[i];
    if (!r || r.length < 8) continue;
    const rawG = String(r[6] || '').trim();
    const rawH = String(r[7] || '').trim();

    const match = rawH.match(/^(20\d{2})(0[1-9]|1[0-2])$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const monthNum = parseInt(match[2], 10);
      const monthIndex = monthNum - 1;
      const monthName = monthNames[monthIndex];
      const day = parseInt(rawG, 10) || 31;
      const label = `${day} ${monthName} ${year}`;
      const periodKey = monthName.toLowerCase();
      return {
        day,
        monthIndex,
        monthName,
        year,
        label,
        periodKey,
      };
    }
  }
  return null;
}

/**
 * Normalisasi data sel sesuai aturan:
 * - Kolom abjad / teks: jika sel kosong / null / undefined / spasi kosong diisi "-"
 * - Kolom angka: jika sel kosong / null / undefined / "-" diisi 0
 *   Mendukung format akuntansi minus: (123.45) -> -123.45 atau 123.45- -> -123.45
 */
export function cleanText(val: any): string {
  if (val === null || val === undefined) return '-';
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '-';
  return s;
}

export function cleanNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim();
  if (s === '' || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return 0;

  // Format akuntansi dalam kurung: (1,234.56) -> -1234.56
  if (s.startsWith('(') && s.endsWith(')')) {
    s = '-' + s.slice(1, -1).trim();
  }
  // Format minus di belakang: 1,234.56- -> -1234.56
  if (s.endsWith('-')) {
    s = '-' + s.slice(0, -1).trim();
  }
  // Bersihkan koma pemisah ribuan dan karakter non-angka kecuali minus dan titik desimal
  s = s.replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes GLBAL rows from raw 2D array
 * Aturan:
 * - Kolom teks/abjad kosong diisi "-"
 * - Kolom angka kosong diisi 0
 */
export function normalizeGLBAL(rows: any[][]): RawRowGLBAL[] {
  const result: RawRowGLBAL[] = [];
  if (!rows || rows.length === 0) return result;

  // Detect if first row is header
  const startIndex = (rows.length > 0 && isNaN(Number(rows[0][2]))) ? 1 : 0;

  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 4) continue;

    // Col C: Branch Code (1-10)
    let branch = cleanNum(r[2]);
    if (branch === 0) {
      const s = String(r[2] || '').trim().toUpperCase();
      const found = BRANCH_LIST.find((b) => s.includes(b.name) || b.name.includes(s));
      if (found) branch = found.code;
    }

    // Col D: COA (10000, 14100, 17000, dst)
    const coa = cleanNum(r[3]);
    if (branch <= 0 || coa <= 0) continue;

    // Col A & B: Status/Group (abjad) -> jika kosong diisi "-"
    const colA = cleanText(r[0]);
    const colB = cleanText(r[1]);

    // Col E: Currency (abjad) -> jika kosong diisi "IDR"
    const rawCcy = cleanText(r[4]);
    const colE = rawCcy === '-' ? 'IDR' : rawCcy;

    // Col G (index 6): Day of month (angka) -> jika kosong diisi 0
    const valG = cleanNum(r[6]);

    // Col H (index 7): Period YYYYMM (abjad/angka) -> jika kosong diisi "-"
    const valH = cleanText(r[7]);

    // Col I (index 8): Amount_I (angka) -> jika kosong diisi 0
    const valI = cleanNum(r[8]);

    result.push({
      colA,
      colB,
      colC: branch,
      colD: coa,
      colE,
      colG: valG,
      colH: valH,
      colI: valI,
    });
  }
  return result;
}

/**
 * Normalizes LLOAN rows from raw 2D array
 * Strictly following the user's exact core-banking Excel layout:
 * - Col A (index 0): Status Record ("A")
 * - Col D (index 3): Branch (1-10)
 * - Col E (index 4): Customer Code
 * - Col M (index 12): Loan Number
 * - Col Z (index 25): Collectibility (1-5)
 * - Col BU (index 72): Principle Amount Orig
 * - Col CM (index 90): Due Principle Amt
 * - Col CQ (index 94): Due Penalty / Interest Amt
 * - Col DX (index 127): DPD Indicator
 */
export function normalizeLLOAN(rows: any[][]): RawRowLLOAN[] {
  const result: RawRowLLOAN[] = [];
  if (!rows || rows.length === 0) return result;

  // Indeks kolom presisi sesuai rumus Excel:
  // Col A  (index 0)   : Status Record
  // Col D  (index 3)   : Branch
  // Col E  (index 4)   : Customer Code
  // Col M  (index 12)  : Loan Number / No Rekening
  // Col Z  (index 25)  : Collectibility System (Kol)
  // Col BU (index 72)  : Principle Amount Orig
  // Col CM (index 90)  : Due Principle Amt
  // Col CQ (index 94)  : Due Penalty Amt
  // Col DX (index 127) : DPD Indicator
  const colA = 0;
  const colD = 3;
  const colE = 4;
  const colM = 12;
  const colZ = 25;
  const colBU = 72;
  const colCM = 90;
  const colCQ = 94;
  let colDX = 127;

  // Deteksi jika ada baris header yang memuat nama kolom DPD / Hari Tunggakan secara eksplisit
  for (let rIdx = 0; rIdx < Math.min(5, rows.length); rIdx++) {
    const r = rows[rIdx];
    if (!r || !Array.isArray(r)) continue;
    let found = false;
    r.forEach((cell, idx) => {
      const s = String(cell || '').trim().toLowerCase().replace(/[\s_]+/g, '');
      if (s === 'dpd' || s === 'dpdindicator' || s === 'haritunggakan' || s === 'haritgk' || s === 'tunggakanhari') {
        colDX = idx;
        found = true;
      }
    });
    if (found) break;
  }

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 4) continue;

    // Excel formula: (LLOAN!$A1:$A70000="A")
    const statusRecord = cleanText(r[colA] !== undefined ? r[colA] : r[0]).toUpperCase();
    if (statusRecord !== 'A') continue;

    // Excel formula: (LLOAN!$D1:$D70000=branch)
    const branchVal = r[colD] !== undefined ? r[colD] : r[3];
    let branch = cleanNum(branchVal);
    if (branch <= 0) {
      const s = String(branchVal || '').trim().toUpperCase();
      const match = s.match(/\d+/);
      if (match) {
        branch = parseInt(match[0], 10);
      } else {
        const found = BRANCH_LIST.find(b => b.name === s || s.includes(b.name) || b.name.includes(s));
        if (found) {
          branch = found.code;
        } else {
          continue;
        }
      }
    }

    const custCode = cleanText(r[colE] !== undefined ? r[colE] : r[4]);
    const loanNumber = cleanText(r[colM] !== undefined ? r[colM] : r[12]);

    // Excel formula: (LLOAN!$Z1:$Z70000)
    const rawKol = r[colZ] !== undefined ? r[colZ] : (r[25] !== undefined ? r[25] : 1);
    let collectibility = cleanNum(rawKol);
    if (collectibility <= 0) collectibility = 1;

    // Amounts strictly from Col BU (index 72), Col CM (index 90), Col CQ (index 94)
    const amountBU = cleanNum(r[colBU] !== undefined ? r[colBU] : r[72]);
    const amountCM = cleanNum(r[colCM] !== undefined ? r[colCM] : r[90]);
    const amountCQ = cleanNum(r[colCQ] !== undefined ? r[colCQ] : r[94]);

    // Col DX (index 127), Col DV (index 125), Col DW (index 126) / DPD indicator
    let rawDpd = r[colDX] !== undefined && r[colDX] !== '' ? r[colDX] : undefined;
    if (rawDpd === undefined || rawDpd === null || rawDpd === '') {
      if (r[125] !== undefined && r[125] !== '') rawDpd = r[125];
      else if (r[127] !== undefined && r[127] !== '') rawDpd = r[127];
      else if (r[126] !== undefined && r[126] !== '') rawDpd = r[126];
    }

    let numDpd = cleanNum(rawDpd);
    if (numDpd < 0 || numDpd > 50000) numDpd = 0;

    // Tunggakan Pokok (Col CJ / index 87), Tunggakan Bunga (Col CK / index 88), Tunggakan Denda (Col CL / index 89)
    const duePrinciple = Math.abs(cleanNum(r[87]));
    const dueInterest = Math.abs(cleanNum(r[88]));
    const duePenalty = Math.abs(cleanNum(r[89]));

    // Jika DPD tercatat 0 namun nasabah memiliki tunggakan pokok/bunga nyata > 0:
    // Tandai minimal 1 hari menunggak agar terjaring dalam klasifikasi risiko pinjaman
    if (numDpd === 0 && (duePrinciple > 0 || dueInterest > 0)) {
      numDpd = 1;
    }

    const dpdIndicator = numDpd;

    result.push({
      statusRecord,
      branch,
      custCode,
      loanNumber,
      collectibility,
      amountBU,
      amountCM,
      amountCQ,
      dpdIndicator,
      duePrinciple,
      dueInterest,
      duePenalty,
    });
  }
  return result;
}

/**
 * Normalizes LHPDU rows from raw 2D array
 */
export function normalizeLHPDU(rows: any[][]): RawRowLHPDU[] {
  const result: RawRowLHPDU[] = [];
  if (!rows || rows.length === 0) return result;

  let startIndex = 0;
  let colD = 3;
  let colE = 4;
  let colLoanNo = 11;
  let colDpd = 12;
  let colN = 13;
  let colO = 14;

  if (rows.length > 0 && typeof rows[0][0] === 'string' && (rows[0][0].toLowerCase().includes('status') || rows[0][0].toLowerCase().includes('record') || rows[0][0].toLowerCase().includes('no'))) {
    startIndex = 1;
    const header = rows[0];
    header.forEach((val, idx) => {
      const s = String(val || '').trim().toLowerCase();
      if (s === 'branch' || s === 'cabang') colD = idx;
      else if (s.includes('customer') || s.includes('cust')) colE = idx;
      else if (s.includes('loan number') || s.includes('account') || s.includes('rekening') || s.includes('no pinjaman')) colLoanNo = idx;
      else if (s.includes('dpd') || s.includes('hari') || s.includes('tunggakan hari')) colDpd = idx;
      else if (s.includes('pokok') || s.includes('principle')) colN = idx;
      else if (s.includes('bunga') || s.includes('interest')) colO = idx;
    });
  }

  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 4) continue;

    const branch = cleanNum(r[colD] !== undefined ? r[colD] : (r[3] || r[2])) || 1;
    const cust = cleanText(r[colE] !== undefined ? r[colE] : r[4]);
    const loanNo = cleanText(r[colLoanNo] !== undefined ? r[colLoanNo] : r[11]);
    const dpd = cleanNum(r[colDpd] !== undefined ? r[colDpd] : r[12]);
    const amountN = cleanNum(r[colN] !== undefined ? r[colN] : r[13]);
    const amountO = cleanNum(r[colO] !== undefined ? r[colO] : r[14]);

    result.push({
      colA: cleanText(r[0]),
      colB: cleanText(r[1]),
      colC: cleanNum(r[2]) || 1,
      colD: branch,
      colE: cust,
      loanNumber: loanNo,
      dpd,
      amountN,
      amountO,
    });
  }
  return result;
}

/**
 * Normalizes Nominatif Pinjaman rows (Col A - AE)
 * Col A: NO, B: CIF, C: KANTOR, D: NOREK, E: NAMA, F: ALAMAT, G: TELP, H: PROC,
 * I: TYPE, J: JNS_PENGGUNAAN, K: SEK_EKONOMI, L: JW, M: BUNGA, N: START, O: JT,
 * P: TGL, Q: AO, R: PLAFON, S: BDEBET, T: TP, U: TPOKOK, V: TB, W: TBUNGA,
 * X: TUNGGAKAN, Y: KOL, Z: KODE JAM, AA: JAMINAN, AB: NILAI JAM, AC: JAM SERT,
 * AD: JAM BPKB, AE: JAM LAIN
 *
 * Logika pivot:
 * - Aturan normalisasi data: jika ada cell kosong abjad diisi "-" dan jika cell kosong angka diisi 0
 * - Row dengan KOL = 'E' (atau Ekstrakomptabel / WO) dihilangkan
 * - Hanya KOL 1 s.d 5 yang dihitung
 * - Dijumlahkan berdasarkan kolom KANTOR (kode kantor 1 s.d 10)
 */
export function normalizeNominatif(rows: any[][]): RawRowNominatif[] {
  if (!rows || rows.length === 0) return [];

  // Default standard 0-based column indices matching Col A to AE
  let colNo = 0;       // Col A
  let colCif = 1;      // Col B
  let colKantor = 2;   // Col C (KANTOR)
  let colNorek = 3;    // Col D (NOREK)
  let colNama = 4;     // Col E (NAMA)
  let colAlamat = 5;   // Col F
  let colTelp = 6;     // Col G
  let colProc = 7;     // Col H
  let colType = 8;     // Col I
  let colJnsPenggunaan = 9; // Col J
  let colSekEkonomi = 10;   // Col K
  let colJw = 11;      // Col L
  let colBunga = 12;   // Col M
  let colStart = 13;   // Col N
  let colJt = 14;      // Col O
  let colTgl = 15;     // Col P
  let colAo = 16;      // Col Q
  let colPlafon = 17;  // Col R (PLAFON)
  let colBdebet = 18;  // Col S (BDEBET / Baki Debet)
  let colTp = 19;      // Col T (TP)
  let colTpokok = 20;  // Col U (TPOKOK)
  let colTb = 21;      // Col V (TB)
  let colTbunga = 22;  // Col W (TBUNGA)
  let colTunggakan = 23; // Col X (TUNGGAKAN)
  let colKol = 24;     // Col Y (KOL)
  let colKodeJam = 25; // Col Z
  let colJaminan = 26; // Col AA
  let colNilaiJam = 27;// Col AB
  let colJamSert = 28; // Col AC
  let colJamBpkb = 29; // Col AD
  let colJamLain = 30; // Col AE

  let startIndex = 0;

  // Inspect first 15 rows for header row if available
  for (let rIdx = 0; rIdx < Math.min(15, rows.length); rIdx++) {
    const r = rows[rIdx];
    if (!r || !Array.isArray(r)) continue;

    let matchCount = 0;
    r.forEach((cell, cIdx) => {
      const s = String(cell || '').trim().toLowerCase().replace(/[\s_]+/g, '');
      if (s === 'kantor' || s === 'kdcab' || s === 'cabang' || s === 'kodekantor') {
        colKantor = cIdx;
        matchCount++;
      } else if (s === 'norek' || s === 'nomorrekening' || s === 'rekening') {
        colNorek = cIdx;
        matchCount++;
      } else if (s === 'bdebet' || s === 'bakidebet' || s === 'outstanding' || s === 'outs') {
        colBdebet = cIdx;
        matchCount++;
      } else if (s === 'kol' || s === 'kolektibilitas') {
        colKol = cIdx;
        matchCount++;
      } else if (s === 'nama' || s === 'namanasabah' || s === 'debitur') {
        colNama = cIdx;
        matchCount++;
      } else if (s === 'plafon' || s === 'plafond') {
        colPlafon = cIdx;
        matchCount++;
      } else if (s === 'tp' || s.includes('tgk_pokok_hari') || s.includes('tphari')) {
        colTp = cIdx;
        matchCount++;
      } else if (s === 'tpokok' || s.includes('tgkpokok') || s.includes('tunggakanpokok')) {
        colTpokok = cIdx;
        matchCount++;
      } else if (s === 'tb' || s.includes('tbunga_hari') || s.includes('tbhari')) {
        colTb = cIdx;
        matchCount++;
      } else if (s === 'tbunga' || s.includes('tgkbunga') || s.includes('tunggakanbunga')) {
        colTbunga = cIdx;
        matchCount++;
      } else if (s === 'tunggakan' || s.includes('totaltunggakan') || s.includes('jmltunggakan')) {
        colTunggakan = cIdx;
        matchCount++;
      }
    });

    if (matchCount >= 2) {
      startIndex = rIdx + 1;
      break;
    }
  }

  const result: RawRowNominatif[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 3) continue;

    // Col Y / KOL check
    const rawKol = String(r[colKol] !== undefined ? r[colKol] : (r[24] || '')).trim().toUpperCase();
    
    // Logika Pivot: Row dengan KOL = 'E' (Ekstrakomptabel / Hapus Buku) DIHILANGKAN!
    if (rawKol === 'E' || rawKol.startsWith('E') || rawKol.includes('WO') || rawKol.includes('EKSTRA')) {
      continue;
    }

    // Hanya KOL 1 sampai 5 yang dihitung
    const kolNum = parseInt(rawKol, 10);
    if (isNaN(kolNum) || kolNum < 1 || kolNum > 5) {
      continue;
    }

    // Resolusi KANTOR (kode kantor 1 s.d 10)
    const rawKantor = r[colKantor] !== undefined ? r[colKantor] : r[2];
    let branchCode = Number(rawKantor);
    if (isNaN(branchCode)) {
      const s = String(rawKantor || '').trim().toUpperCase();
      const found = BRANCH_LIST.find((b) => s.includes(b.name) || b.name.includes(s));
      if (found) {
        branchCode = found.code;
      } else {
        continue;
      }
    }

    if (branchCode < 1 || branchCode > 10) continue;

    // Nilai BDEBET (Col S / Baki Debet / Outstanding) & kolom keuangan lainnya: kosong diisi 0
    const bdebet = cleanNum(r[colBdebet] !== undefined ? r[colBdebet] : r[18]);
    const tp = cleanNum(r[colTp] !== undefined ? r[colTp] : r[19]);
    const tpokok = cleanNum(r[colTpokok] !== undefined ? r[colTpokok] : r[20]);
    const tb = cleanNum(r[colTb] !== undefined ? r[colTb] : r[21]);
    const tbunga = cleanNum(r[colTbunga] !== undefined ? r[colTbunga] : r[22]);
    const tunggakan = cleanNum(r[colTunggakan] !== undefined ? r[colTunggakan] : r[23]);
    const plafon = cleanNum(r[colPlafon] !== undefined ? r[colPlafon] : r[17]);
    const jw = cleanNum(r[colJw] !== undefined ? r[colJw] : r[11]);
    const bunga = cleanNum(r[colBunga] !== undefined ? r[colBunga] : r[12]);
    const nilaiJam = cleanNum(r[colNilaiJam] !== undefined ? r[colNilaiJam] : r[27]);

    // Kolom teks / abjad: kosong diisi "-"
    const cif = cleanText(r[colCif] !== undefined ? r[colCif] : r[1]);
    const norek = cleanText(r[colNorek] !== undefined ? r[colNorek] : r[3]);
    const nama = cleanText(r[colNama] !== undefined ? r[colNama] : r[4]);
    const alamat = cleanText(r[colAlamat] !== undefined ? r[colAlamat] : r[5]);
    const telp = cleanText(r[colTelp] !== undefined ? r[colTelp] : r[6]);
    const proc = cleanText(r[colProc] !== undefined ? r[colProc] : r[7]);
    const type = cleanText(r[colType] !== undefined ? r[colType] : r[8]);
    const jnsPenggunaan = cleanText(r[colJnsPenggunaan] !== undefined ? r[colJnsPenggunaan] : r[9]);
    const sekEkonomi = cleanText(r[colSekEkonomi] !== undefined ? r[colSekEkonomi] : r[10]);
    const start = cleanText(r[colStart] !== undefined ? r[colStart] : r[13]);
    const jt = cleanText(r[colJt] !== undefined ? r[colJt] : r[14]);
    const tgl = cleanText(r[colTgl] !== undefined ? r[colTgl] : r[15]);
    const ao = cleanText(r[colAo] !== undefined ? r[colAo] : r[16]);
    const kodeJam = cleanText(r[colKodeJam] !== undefined ? r[colKodeJam] : r[25]);
    const jaminan = cleanText(r[colJaminan] !== undefined ? r[colJaminan] : r[26]);
    const jamSert = cleanText(r[colJamSert] !== undefined ? r[colJamSert] : r[28]);
    const jamBpkb = cleanText(r[colJamBpkb] !== undefined ? r[colJamBpkb] : r[29]);
    const jamLain = cleanText(r[colJamLain] !== undefined ? r[colJamLain] : r[30]);

    result.push({
      no: r[colNo] !== undefined ? r[colNo] : i,
      cif,
      kantor: branchCode,
      norek,
      nama,
      alamat,
      telp,
      proc,
      type,
      jnsPenggunaan,
      sekEkonomi,
      jw,
      bunga,
      start,
      jt,
      tgl,
      ao,
      plafon,
      bdebet,
      tp,
      tpokok,
      tb,
      tbunga,
      tunggakan,
      kol: kolNum,
      kodeJam,
      jaminan,
      nilaiJam,
      jamSert,
      jamBpkb,
      jamLain,
    });
  }

  return result;
}

/**
 * Computes Pos-Pos Penting using user's explicit SUMPRODUCT rules
 */
export function calculatePosPosPenting(
  glbal: RawRowGLBAL[],
  lloan: RawRowLLOAN[] = [],
  lhpdu: RawRowLHPDU[] = [],
  nominatif: RawRowNominatif[] = [],
  activePeriod?: string
): BranchReport[] {
  const reports: BranchReport[] = [];

  // Determine active period reference dataset ('september' | 'agustus' | 'juli')
  let targetMonth: 'september' | 'agustus' | 'juli' = 'september';

  // 1. Prioritas Utama: Deteksi langsung dari kolom H (YYYYMM) berkas GLBAL yang diunggah
  let detectedFromGlbal = false;
  if (glbal.length > 0) {
    for (let i = 0; i < Math.min(glbal.length, 100); i++) {
      const hStr = String(glbal[i].colH || '').trim();
      const match = hStr.match(/^(20\d{2})(0[1-9]|1[0-2])$/);
      if (match) {
        const mNum = parseInt(match[2], 10);
        if (mNum === 7) {
          targetMonth = 'juli';
          detectedFromGlbal = true;
          break;
        } else if (mNum === 8) {
          targetMonth = 'agustus';
          detectedFromGlbal = true;
          break;
        } else if (mNum === 9) {
          targetMonth = 'september';
          detectedFromGlbal = true;
          break;
        }
      }
    }
  }

  // 2. Jika bukan dari kolom H GLBAL, gunakan parameter activePeriod
  if (!detectedFromGlbal && activePeriod) {
    const p = activePeriod.toLowerCase();
    if (p.includes('jul')) {
      targetMonth = 'juli';
    } else if (p.includes('agu')) {
      targetMonth = 'agustus';
    } else {
      targetMonth = 'september';
    }
  }
  const referenceReports = MONTHLY_BRANCH_DATA[targetMonth] || SEPTEMBER_BRANCH_REPORTS;

  // Build lookup of loans with DPD > 0 strictly by loanNumber from LHPDU
  const lhpduDpdMap = new Map<string, number>();

  for (const row of lhpdu) {
    const loanKey = String(row.loanNumber || '').trim();
    if (loanKey && row.dpd && row.dpd > 0 && row.dpd < 10000) {
      lhpduDpdMap.set(loanKey, row.dpd);
    }
  }

  // Helper for SUMPRODUCT on GLBAL
  const sumGlbal = (branch: number, coa: number): number => {
    let sum = 0;
    for (const row of glbal) {
      if (row.colC === branch && row.colD === coa) {
        sum += row.colI;
      }
    }
    return sum;
  };

  BRANCH_LIST.forEach((b, idx) => {
    const code = b.code;
    const ref = referenceReports[idx] || SEPTEMBER_BRANCH_REPORTS[idx];

    // 1. Aset Formula (Sesuai rumus per-cabang spesifik user):
    // KPO (1): =((SUMPRODUCT((C=1)*(D=10000), I*-1) - SUMPRODUCT((C=1)*(D=17000), I*-1) - SUMPRODUCT((C=3)*(D=17000), I*-1) - SUMPRODUCT((C=6)*(D=17000), I*-1) - SUMPRODUCT((C=7)*(D=17000), I*-1) - SUMPRODUCT((C=9)*(D=17000), I*-1))) / 1000
    // Kepanjen (2): =((SUMPRODUCT((C=2)*(D=10000), I*-1) - SUMPRODUCT((C=2)*(D=17000), I*-1))) / 1000
    // Brondong (3): =((SUMPRODUCT((C=3)*(D=10000), I*-1))) / 1000
    // Gresik (4): =((SUMPRODUCT((C=4)*(D=10000), I*-1) - SUMPRODUCT((C=4)*(D=17000), I*-1))) / 1000
    // Tuban (5): =((SUMPRODUCT((C=5)*(D=10000), I*-1) - SUMPRODUCT((C=5)*(D=17000), I*-1))) / 1000
    // Rambipuji (6): =((SUMPRODUCT((C=6)*(D=10000), I*-1))) / 1000
    // Genteng (7): =((SUMPRODUCT((C=7)*(D=10000), I*-1))) / 1000
    // Situbondo (8): =((SUMPRODUCT((C=8)*(D=10000), I*-1) - SUMPRODUCT((C=8)*(D=17000), I*-1))) / 1000
    // Ngunut (9): =((SUMPRODUCT((C=9)*(D=10000), I*-1))) / 1000
    // Ngadiluwih (10): =((SUMPRODUCT((C=10)*(D=10000), I*-1) - SUMPRODUCT((C=10)*(D=17000), I*-1))) / 1000
    let asetRaw = 0;
    if (glbal.length > 0) {
      if (code === 1) {
        // KPO Wlingi (Cabang 1): kurangi COA 17000 cabang 1, 3, 6, 7, 9
        const c1_10000 = sumGlbal(1, 10000) * -1;
        const c1_17000 = sumGlbal(1, 17000) * -1;
        const c3_17000 = sumGlbal(3, 17000) * -1;
        const c6_17000 = sumGlbal(6, 17000) * -1;
        const c7_17000 = sumGlbal(7, 17000) * -1;
        const c9_17000 = sumGlbal(9, 17000) * -1;
        asetRaw = (c1_10000 - c1_17000 - c3_17000 - c6_17000 - c7_17000 - c9_17000) / 1000;
      } else if (code === 3 || code === 6 || code === 7 || code === 9) {
        // Brondong (3), Rambipuji (6), Genteng (7), Ngunut (9): Murni COA 10000 tanpa pengurangan 17000
        asetRaw = (sumGlbal(code, 10000) * -1) / 1000;
      } else {
        // Kepanjen (2), Gresik (4), Tuban (5), Situbondo (8), Ngadiluwih (10)
        const cb_10000 = sumGlbal(code, 10000) * -1;
        const cb_17000 = sumGlbal(code, 17000) * -1;
        asetRaw = (cb_10000 - cb_17000) / 1000;
      }
    } else {
      asetRaw = ref.aset;
    }

    // 2. Kredit:
    // Sesuai rumus Excel: (SUMPRODUCT(C=b, D=14100, I * -1)) / 1000 (dari GLBAL)
    // Atau total saldo aktif LLOAN jika GLBAL belum diunggah: ((BU + CM + CQ) * -1) / 100
    const branchLloan = lloan.filter((row) => row.branch === code);
    let lloanCreditSum = 0;
    if (branchLloan.length > 0) {
      for (const row of branchLloan) {
        if (row.statusRecord === 'A') {
          const bu = row.amountBU || 0;
          const cm = row.amountCM || 0;
          const cq = row.amountCQ || 0;
          const bal = ((bu + cm + cq) * -1) / 100;
          lloanCreditSum += bal;
        }
      }
    }

    let kreditRaw = 0;
    if (glbal.length > 0) {
      kreditRaw = (sumGlbal(code, 14100) * -1) / 1000;
    } else if (lloanCreditSum > 0) {
      kreditRaw = Math.abs(lloanCreditSum) / 1000;
    } else {
      kreditRaw = ref.kredit;
    }

    // 3. Tabungan:
    // (SUMPRODUCT(C=b, D=22100, I)) / 1000
    let tabunganRaw = 0;
    if (glbal.length > 0) {
      tabunganRaw = sumGlbal(code, 22100) / 1000;
    } else {
      tabunganRaw = ref.tabungan;
    }

    // 4. Deposito:
    // ((SUMPRODUCT(C=b, D=22200, I) + SUMPRODUCT(C=b, D=22250, I * -1))) / 1000
    let depositoRaw = 0;
    if (glbal.length > 0) {
      depositoRaw = (sumGlbal(code, 22200) + sumGlbal(code, 22250) * -1) / 1000;
    } else {
      depositoRaw = ref.deposito;
    }

    // 5. Pendapatan:
    // (SUMPRODUCT(C=b, D=40000, I)) / 1000
    let pendapatanRaw = 0;
    if (glbal.length > 0) {
      pendapatanRaw = sumGlbal(code, 40000) / 1000;
    } else {
      pendapatanRaw = ref.pendapatan;
    }

    // 6. Biaya:
    // ((SUMPRODUCT(C=b, D=50000, I * -1) - SUMPRODUCT(C=b, D=24100, I))) / 1000
    let biayaRaw = 0;
    if (glbal.length > 0) {
      biayaRaw = (sumGlbal(code, 50000) * -1 - sumGlbal(code, 24100)) / 1000;
    } else {
      biayaRaw = ref.biaya;
    }

    // 7. L/R:
    // Pendapatan - Biaya
    const lrRaw = pendapatanRaw - biayaRaw;

    // 8. LAR (Loan at Risk) & NPL (Non-Performing Loan) DINAMIS:
    // Sesuai rumus Excel:
    // Saldo per rekening: ((BU + CM + CQ) * -1) / 100 (* -1 ditaruh di pembilang)
    // LAR = ((SUMPRODUCT((A="A")*(Z=1)*(DX>0)*(D=b), ((BU+CM+CQ)*-1)/100)) +
    //        (SUMPRODUCT((A="A")*(Z=2)*(DX>=0)*(DX<=2)*(D=b), ((BU+CM+CQ)*-1)/100)) +
    //        (SUMPRODUCT((A="A")*(Z=2)*(DX>2)*(D=b), ((BU+CM+CQ)*-1)/100))) / 1000
    // NPL = (SUMPRODUCT((A="A")*(Z>2)*(D=b), ((BU+CM+CQ)*-1)/100)) / 1000
    let larRaw = 0;
    let nplRaw = 0;

    if (branchLloan.length > 0) {
      let part1Sum = 0; // (A="A")*(Z=1)*(DX>0)
      let part2Sum = 0; // (A="A")*(Z=2)*(DX>=0)*(DX<=2)
      let part3Sum = 0; // (A="A")*(Z=2)*(DX>2)
      let nplSum = 0;   // (A="A")*(Z>2)

      for (const row of branchLloan) {
        if (row.statusRecord !== 'A') continue;

        const bu = row.amountBU || 0;
        const cm = row.amountCM || 0;
        const cq = row.amountCQ || 0;
        // Rumus Excel: ((BU + CM + CQ) * -1) / 100 (* -1 ditaruh di pembilang)
        const balance = ((bu + cm + cq) * -1) / 100;

        // Prioritas DPD dari LLOAN (col DX); jika 0/kosong gunakan cross-reference LHPDU
        const dpdLhpdu = (row.loanNumber ? lhpduDpdMap.get(row.loanNumber) : 0) || (row.custCode ? lhpduDpdMap.get(row.custCode) : 0) || 0;
        const dpd = row.dpdIndicator > 0 ? row.dpdIndicator : dpdLhpdu;

        // Suku 1: (A="A")*(Z=1)*(DPD > 0 atau Tunggakan Pokok/Bunga > 0)*(D=branch) -> Kol 1 berisiko
        if (row.collectibility === 1 && (dpd > 0 || (row.duePrinciple && row.duePrinciple > 0) || (row.dueInterest && row.dueInterest > 0))) {
          part1Sum += balance;
        }
        // Suku 2: Seluruh debitur Kolektibilitas 2 (Z=2)
        else if (row.collectibility === 2) {
          part2Sum += balance;
        }

        // NPL: (A="A")*(Z>2)*(D=branch) -> Kolektibilitas 3, 4, 5
        if (row.collectibility > 2) {
          nplSum += balance;
        }
      }

      // Hitung LAR 100% dinamis dari berkas: Suku 1 (Kol 1 ber-DPD) + Suku 2 (Seluruh Kol 2)
      larRaw = (part1Sum + part2Sum) / 1000;

      nplRaw = nplSum / 1000;
      if (larRaw < 0) larRaw = Math.abs(larRaw);
      if (nplRaw < 0) nplRaw = Math.abs(nplRaw);
    } else {
      larRaw = ref.lar;
      nplRaw = ref.npl;
    }

    // Rumus revisi %LAR : =H11/E11 (yaitu LAR / Kredit)
    // Dikonversi ke persen: (LAR / Kredit) * 100 (Dinamis & Presisi!)
    const larPercent = kreditRaw > 0 ? (larRaw / kreditRaw) * 100 : ref.larPercent;

    // Rumus %NPL : =J11/E11 (yaitu NPL / Kredit)
    // Dikonversi ke persen: (NPL / Kredit) * 100 (Dinamis & Presisi!)
    const nplPercent = kreditRaw > 0 ? (nplRaw / kreditRaw) * 100 : ref.nplPercent;

    reports.push({
      no: idx + 1,
      branchCode: code,
      kantor: b.name,
      aset: Math.round(asetRaw),
      kredit: Math.round(kreditRaw),
      tabungan: Math.round(tabunganRaw),
      deposito: Math.round(depositoRaw),
      lar: Math.round(larRaw),
      larPercent: Number(larPercent.toFixed(2)),
      npl: Math.round(nplRaw),
      nplPercent: Number(nplPercent.toFixed(2)),
      pendapatan: Number(pendapatanRaw.toFixed(2)),
      biaya: Number(biayaRaw.toFixed(2)),
      lr: Math.round(lrRaw),
    });
  });

  return reports;
}

/**
 * Computes consolidated totals
 */
export function getKonsolidasi(reports: BranchReport[]): BranchReport {
  const totalAset = reports.reduce((acc, r) => acc + r.aset, 0);
  const totalKredit = reports.reduce((acc, r) => acc + r.kredit, 0);
  const totalTabungan = reports.reduce((acc, r) => acc + r.tabungan, 0);
  const totalDeposito = reports.reduce((acc, r) => acc + r.deposito, 0);
  const totalLar = reports.reduce((acc, r) => acc + r.lar, 0);
  const totalNpl = reports.reduce((acc, r) => acc + r.npl, 0);
  const totalPendapatan = reports.reduce((acc, r) => acc + r.pendapatan, 0);
  const totalBiaya = reports.reduce((acc, r) => acc + r.biaya, 0);
  const totalLr = totalPendapatan - totalBiaya;

  const larPercent = totalKredit > 0 ? (totalLar / totalKredit) * 100 : 0;
  const nplPercent = totalKredit > 0 ? (totalNpl / totalKredit) * 100 : 0;

  return {
    no: 99,
    branchCode: 99,
    kantor: 'KONSOLIDASI',
    aset: totalAset,
    kredit: totalKredit,
    tabungan: totalTabungan,
    deposito: totalDeposito,
    lar: totalLar,
    larPercent: Number(larPercent.toFixed(2)),
    npl: totalNpl,
    nplPercent: Number(nplPercent.toFixed(2)),
    pendapatan: Number(totalPendapatan.toFixed(2)),
    biaya: Number(totalBiaya.toFixed(2)),
    lr: Math.round(totalLr),
  };
}

/**
 * Computes Consolidated KYD totals
 */
export function getKydKonsolidasi(reports: KydBranchReport[]): KydBranchReport {
  const blnLaluNsb = reports.reduce((acc, r) => acc + r.blnLaluNsb, 0);
  const blnLaluOuts = reports.reduce((acc, r) => acc + r.blnLaluOuts, 0);
  const blnIniNsb = reports.reduce((acc, r) => acc + r.blnIniNsb, 0);
  const blnIniOuts = reports.reduce((acc, r) => acc + r.blnIniOuts, 0);
  const growthNsb = blnIniNsb - blnLaluNsb;
  const growthNominal = blnIniOuts - blnLaluOuts;
  const targetNominal = reports.reduce((acc, r) => acc + r.targetNominal, 0);
  const deviasi = blnIniOuts - targetNominal;

  return {
    no: 99,
    branchCode: 99,
    kantor: 'TOTAL KONSOLIDASI',
    blnLaluNsb,
    blnLaluOuts,
    blnIniNsb,
    blnIniOuts,
    growthNsb,
    growthNominal,
    targetNominal,
    deviasi,
  };
}

export interface DetectedPeriod {
  monthName: string;
  monthIndex: number;
  year: number;
  label: string;
  suggestedTarget: 'bln_ini' | 'bln_lalu';
}

/**
 * Deteksi otomatis nama bulan dan periode laporan dari nama berkas atau baris header excel
 */
export function detectPeriodFromFile(fileName: string, rawRows?: any[][]): DetectedPeriod | null {
  // 1. PRIORITAS TERTINGGI: Periksa langsung kolom G (Hari, e.g. 31) dan kolom H (YYYYMM, e.g. 202607, 202608)
  if (rawRows && rawRows.length > 0) {
    const fromGlbal = extractPeriodFromGLBAL(rawRows);
    if (fromGlbal) {
      return {
        monthName: fromGlbal.monthName,
        monthIndex: fromGlbal.monthIndex,
        year: fromGlbal.year,
        label: fromGlbal.label,
        suggestedTarget: fromGlbal.monthIndex === 8 ? 'bln_ini' : 'bln_lalu',
      };
    }
  }

  const lowerName = fileName.toLowerCase();

  const monthMap: { name: string; idx: number; regex: RegExp }[] = [
    { name: 'Januari', idx: 0, regex: /jan(?:uari|uary)?/i },
    { name: 'Februari', idx: 1, regex: /feb(?:ruari|ruary)?/i },
    { name: 'Maret', idx: 2, regex: /mar(?:et|ch)?/i },
    { name: 'April', idx: 3, regex: /apr(?:il)?/i },
    { name: 'Mei', idx: 4, regex: /mei|may/i },
    { name: 'Juni', idx: 5, regex: /jun(?:i|e)?/i },
    { name: 'Juli', idx: 6, regex: /jul(?:i|y)?/i },
    { name: 'Agustus', idx: 7, regex: /ag(?:u|s)|aug(?:ust)?/i },
    { name: 'September', idx: 8, regex: /sep(?:tember)?/i },
    { name: 'Oktober', idx: 9, regex: /okt(?:ober)?|oct(?:ober)?/i },
    { name: 'November', idx: 10, regex: /nov(?:ember)?/i },
    { name: 'Desember', idx: 11, regex: /des(?:ember)?|dec(?:ember)?/i },
  ];

  let matchedMonth: { name: string; idx: number } | null = null;
  for (const m of monthMap) {
    if (m.regex.test(lowerName)) {
      matchedMonth = m;
      break;
    }
  }

  // Cek pola angka bulan seperti 06-2026 atau 202606
  if (!matchedMonth) {
    const numMatch = lowerName.match(/(?:[_\-\s]|^)(0[1-9]|1[0-2])(?:[_\-\s]|\d{2,4}|$)/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      matchedMonth = monthMap[idx];
    }
  }

  // Jika belum cocok, periksa 10 baris pertama di worksheet
  if (!matchedMonth && rawRows && rawRows.length > 0) {
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const rowStr = (rawRows[r] || []).map((c) => String(c || '')).join(' ').toLowerCase();
      for (const m of monthMap) {
        if (m.regex.test(rowStr)) {
          matchedMonth = m;
          break;
        }
      }
      if (matchedMonth) break;
    }
  }

  if (!matchedMonth) return null;

  let year = 2026;
  const yearMatch = lowerName.match(/202[0-9]/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
  }

  const isPast =
    lowerName.includes('lalu') ||
    lowerName.includes('kemarin') ||
    lowerName.includes('prev') ||
    lowerName.includes('bln_lalu') ||
    matchedMonth.idx < 8; // Bulan Juni (idx 5) < September (idx 8)

  return {
    monthName: matchedMonth.name,
    monthIndex: matchedMonth.idx,
    year,
    label: `${matchedMonth.name} ${year}`,
    suggestedTarget: isPast ? 'bln_lalu' : 'bln_ini',
  };
}

/**
 * Melakukan pivot kalkulasi Laporan Kredit per Cabang (KYD) dari data mentah Nominatif Pinjaman:
 * Aturan sesuai kebutuhan:
 * - NSB: Count row pada kolom BDEBET berdasarkan kolom kantor (1 s.d 10) dengan aturan KOL 1 s.d 5 (KOL = E dieliminasi).
 * - OUTS: Sum kolom BDEBET berdasarkan kolom kantor (1 s.d 10) dengan aturan KOL 1 s.d 5 (KOL = E dieliminasi).
 * - Target Bulan Ini bagian NOMINAL: Tetap disamakan dengan tabel target (tidak berubah).
 * - Growth NSB = NSB Bulan Ini - NSB Bulan Lalu (=E6-C6)
 * - Growth Nominal = OUTS Bulan Ini - OUTS Bulan Lalu (=F6-D6)
 * - Deviasi = OUTS Bulan Ini - Target Nominal (=F6-I6)
 */
export interface BranchNominatifAgg {
  count: number;
  sumBdebet: number;
}

export function aggregateNominatifByBranch(rows: RawRowNominatif[]): Record<number, BranchNominatifAgg> {
  const result: Record<number, BranchNominatifAgg> = {};
  for (let c = 1; c <= 10; c++) {
    result[c] = { count: 0, sumBdebet: 0 };
  }

  if (!rows || rows.length === 0) return result;

  for (const row of rows) {
    const k = row.kantor;
    const kolStr = String(row.kol || '').trim().toUpperCase();
    // Aturan presisi: KOL = 'E' atau 'WO' dieliminasi
    if (kolStr === 'E' || kolStr === 'WO') continue;
    const kolNum = typeof row.kol === 'number' ? row.kol : parseInt(kolStr, 10);

    // Hanya kantor 1 s.d 10 dan KOL 1 s.d 5
    if (k >= 1 && k <= 10 && !isNaN(kolNum) && kolNum >= 1 && kolNum <= 5) {
      result[k].count += 1;
      result[k].sumBdebet += (row.bdebet || 0);
    }
  }

  return result;
}

/**
 * Pembulatan nilai Target Jatim sesuai aturan bisnis:
 * 2 angka di belakang koma (desimal/sen):
 * - Jika >= 50 maka dibulatkan ke atas. Contoh: 54,097,521.98 -> 54,097,522
 * - Jika < 50 maka dihilangkan. Contoh: 54,097,521.08 -> 54,097,521
 */
export function roundTargetValue(val: number): number {
  if (isNaN(val) || val === 0) return 0;
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const intPart = Math.floor(absVal);
  // Ambil 2 angka di belakang koma (sen/cents) dengan toleransi floating point
  const cents = Math.round((absVal - intPart) * 100);
  const result = cents >= 50 ? intPart + 1 : intPart;
  return isNegative ? -result : result;
}

/**
 * Mencocokkan nama bulan pada kolom tabel Target Jatim (JAN, FEB, ..., Sep-23, ..., DES)
 */
export function matchMonthColumn(cellText: any): number | null {
  if (cellText === null || cellText === undefined) return null;
  const s = String(cellText).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s) return null;
  if (s.startsWith('jan')) return 0;
  if (s.startsWith('feb')) return 1;
  if (s.startsWith('mar')) return 2;
  if (s.startsWith('apr')) return 3;
  if (s.startsWith('mei') || s.startsWith('may')) return 4;
  if (s.startsWith('jun')) return 5;
  if (s.startsWith('jul')) return 6;
  if (s.startsWith('agt') || s.startsWith('agu') || s.startsWith('aug')) return 7;
  if (s.startsWith('sep')) return 8;
  if (s.startsWith('okt') || s.startsWith('oct')) return 9;
  if (s.startsWith('nop') || s.startsWith('nov')) return 10;
  if (s.startsWith('des') || s.startsWith('dec')) return 11;
  return null;
}

/**
 * Melakukan parsing berkas TARGET JATIM (RKAP Target Kredit se-Jatim):
 * - Mencari setiap kantor dari Wlingi (1) s.d Ngadiluwih (10)
 * - Mencari baris header bulan JAN s.d DES
 * - Mengambil baris "1. KREDIT"
 * - Mengaplikasikan aturan pembulatan 2 digit desimal (>= 50 dibulatkan ke atas, < 50 dihilangkan)
 */
export function parseTargetJatimWorkbook(wb: XLSX.WorkBook): {
  targets: Record<number, number[]>;
  branchNamesFound: string[];
} {
  const targets: Record<number, number[]> = {};
  for (let c = 1; c <= 10; c++) {
    targets[c] = [...(DEFAULT_TARGET_JATIM_MATRIX[c] || new Array(12).fill(0))];
  }
  const branchFoundSet = new Set<string>();

  const branchPatterns = [
    { code: 1, name: 'KPO WLINGI', regex: /wlingi/i },
    { code: 2, name: 'KEPANJEN', regex: /kepanjen/i },
    { code: 3, name: 'BRONDONG', regex: /brondong/i },
    { code: 4, name: 'GRESIK', regex: /gresik/i },
    { code: 5, name: 'TUBAN', regex: /tuban/i },
    { code: 6, name: 'RAMBIPUJI', regex: /rambipuji/i },
    { code: 7, name: 'GENTENG', regex: /genteng/i },
    { code: 8, name: 'SITUBONDO', regex: /situbondo/i },
    { code: 9, name: 'NGUNUT', regex: /ngunut/i },
    { code: 10, name: 'NGADILUWIH', regex: /ngadiluwih/i },
  ];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!rows || rows.length === 0) continue;

    let sheetBranchCode: number | null = null;
    for (const bp of branchPatterns) {
      if (bp.regex.test(sheetName)) {
        sheetBranchCode = bp.code;
        break;
      }
    }

    let activeBranchCode = sheetBranchCode;

    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row || !Array.isArray(row)) continue;

      // 1. Cek judul kantor
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const cellVal = String(row[cIdx] || '').trim();
        if (cellVal.length > 2 && cellVal.length < 50) {
          for (const bp of branchPatterns) {
            if (bp.regex.test(cellVal) && !cellVal.toLowerCase().includes('jalan')) {
              activeBranchCode = bp.code;
              break;
            }
          }
        }
      }

      if (!activeBranchCode) continue;

      // 2. Cek baris header bulan
      const monthColMap: Record<number, number> = {};
      let monthMatches = 0;
      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const mIdx = matchMonthColumn(row[cIdx]);
        if (mIdx !== null) {
          monthColMap[mIdx] = cIdx;
          monthMatches++;
        }
      }

      // Jika ada minimal 3 bulan yang cocok, cari baris produk "1. KREDIT"
      if (monthMatches >= 3) {
        for (let offset = 1; offset <= 6 && rIdx + offset < rows.length; offset++) {
          const prodRow = rows[rIdx + offset];
          if (!prodRow || !Array.isArray(prodRow)) continue;

          const prodCellStr = prodRow.map((c) => String(c || '').trim()).join(' ').toLowerCase();
          const isKreditRow =
            (prodCellStr.includes('1. kredit') ||
              prodCellStr.includes('1.kredit') ||
              prodCellStr.startsWith('kredit') ||
              prodCellStr.includes(' 1 kredit')) &&
            !prodCellStr.includes('kolektibilitas') &&
            !prodCellStr.includes('npl');

          if (isKreditRow) {
            for (let m = 0; m < 12; m++) {
              const cIdx = monthColMap[m];
              if (cIdx !== undefined && prodRow[cIdx] !== undefined) {
                const rawCell = prodRow[cIdx];
                let numVal = 0;
                if (typeof rawCell === 'number') {
                  numVal = rawCell;
                } else {
                  const cleaned = String(rawCell).replace(/[^0-9.-]/g, '');
                  numVal = parseFloat(cleaned);
                }

                if (!isNaN(numVal) && numVal > 0) {
                  // Jika dalam Rupiah utuh (> 500 jt per cabang), sesuaikan ke ribuan rupiah
                  if (numVal > 500_000_000) {
                    numVal = numVal / 1000;
                  }
                  const rounded = roundTargetValue(numVal);
                  targets[activeBranchCode][m] = rounded;
                }
              }
            }

            const bp = branchPatterns.find((b) => b.code === activeBranchCode);
            if (bp) {
              branchFoundSet.add(bp.name);
            }
            break;
          }
        }
      }
    }
  }

  return {
    targets,
    branchNamesFound: Array.from(branchFoundSet),
  };
}

export function calculateKydFromNominatif(
  nominatifRows: RawRowNominatif[],
  baseKydReports: KydBranchReport[] = INITIAL_KYD_REPORTS,
  targetPeriod: 'bln_ini' | 'bln_lalu' = 'bln_ini',
  targetMonthIndex: number = 8,
  customTargetMatrix?: Record<number, number[]>
): KydBranchReport[] {
  if (!nominatifRows || nominatifRows.length === 0) {
    // Tetap update target jika ada perubahan targetMonthIndex atau customTargetMatrix
    const targetMatrix = customTargetMatrix || DEFAULT_TARGET_JATIM_MATRIX;
    return baseKydReports.map((b) => {
      const branchTargets = targetMatrix[b.branchCode];
      const targetNominal = branchTargets && branchTargets[targetMonthIndex] !== undefined
        ? branchTargets[targetMonthIndex]
        : b.targetNominal;
      const deviasi = b.blnIniOuts - targetNominal;
      return { ...b, targetNominal, deviasi };
    });
  }

  const agg = aggregateNominatifByBranch(nominatifRows);
  const totalBdebet = Object.values(agg).reduce((acc, v) => acc + v.sumBdebet, 0);
  const totalCount = Object.values(agg).reduce((acc, v) => acc + v.count, 0);
  const avgBdebet = totalCount > 0 ? totalBdebet / totalCount : 0;
  // Deteksi skala: bila baki debet dalam Rupiah utuh (> 500rb per akun atau total > 1 milyar), konversi ke ribuan rupiah
  const isFullRupiah = totalBdebet > 1_000_000_000 || avgBdebet > 500_000;

  const targetMatrix = customTargetMatrix || DEFAULT_TARGET_JATIM_MATRIX;

  return baseKydReports.map((b) => {
    const branchCode = b.branchCode;
    const branchData = agg[branchCode];
    const hasData = branchData && branchData.count > 0;

    let computedOuts = 0;
    if (branchData && branchData.sumBdebet > 0) {
      computedOuts = isFullRupiah ? Math.round(branchData.sumBdebet / 1000) : Math.round(branchData.sumBdebet);
    }

    const computedNsb = branchData ? branchData.count : 0;

    // Target nominal dari TARGET JATIM sesuai targetMonthIndex
    const branchTargets = targetMatrix[branchCode];
    const targetNominal = branchTargets && branchTargets[targetMonthIndex] !== undefined
      ? branchTargets[targetMonthIndex]
      : b.targetNominal;

    let blnLaluNsb = b.blnLaluNsb;
    let blnLaluOuts = b.blnLaluOuts;
    let blnIniNsb = b.blnIniNsb;
    let blnIniOuts = b.blnIniOuts;

    if (targetPeriod === 'bln_lalu') {
      if (hasData) {
        blnLaluNsb = computedNsb;
        blnLaluOuts = computedOuts;
      }
    } else {
      if (hasData) {
        blnIniNsb = computedNsb;
        blnIniOuts = computedOuts;
      }
    }

    // Rumus:
    // GROWTH NSB = NSB Bulan Ini - NSB Bulan Lalu
    const growthNsb = blnIniNsb - blnLaluNsb;
    // GROWTH NOMINAL = OUTS Bulan Ini - OUTS Bulan Lalu
    const growthNominal = blnIniOuts - blnLaluOuts;
    // TARGET DEVIASI = OUTS Bulan Ini - Target Nominal
    const deviasi = blnIniOuts - targetNominal;

    return {
      ...b,
      blnLaluNsb,
      blnLaluOuts,
      blnIniNsb,
      blnIniOuts,
      growthNsb,
      growthNominal,
      targetNominal,
      deviasi,
    };
  });
}

/**
 * Menghitung ulang seluruh tabel KYD menggabungkan data Bulan Lalu dan Bulan Ini
 */
export function recalculateAllKyd(
  nominatifLaluRows: RawRowNominatif[],
  nominatifIniRows: RawRowNominatif[],
  baseKydReports: KydBranchReport[] = INITIAL_KYD_REPORTS,
  targetMonthIndex: number = 8,
  customTargetMatrix?: Record<number, number[]>
): KydBranchReport[] {
  let reports = baseKydReports;
  if (nominatifLaluRows && nominatifLaluRows.length > 0) {
    reports = calculateKydFromNominatif(nominatifLaluRows, reports, 'bln_lalu', targetMonthIndex, customTargetMatrix);
  }
  if (nominatifIniRows && nominatifIniRows.length > 0) {
    reports = calculateKydFromNominatif(nominatifIniRows, reports, 'bln_ini', targetMonthIndex, customTargetMatrix);
  } else {
    // Sinkronkan target nominal meskipun nominatif ini belum diupload
    const targetMatrix = customTargetMatrix || DEFAULT_TARGET_JATIM_MATRIX;
    reports = reports.map((b) => {
      const branchTargets = targetMatrix[b.branchCode];
      const targetNominal = branchTargets && branchTargets[targetMonthIndex] !== undefined
        ? branchTargets[targetMonthIndex]
        : b.targetNominal;
      const deviasi = b.blnIniOuts - targetNominal;
      return { ...b, targetNominal, deviasi };
    });
  }
  return reports;
}

/**
 * Downloads a sample Nominatif Pinjaman excel file with exact 31 columns A to AE
 */
export function generateSampleNominatif(): void {
  const wb = XLSX.utils.book_new();
  const headers = [
    'NO', 'CIF', 'KANTOR', 'NOREK', 'NAMA', 'ALAMAT', 'TELP', 'PROC', 'TYPE', 'JNS_PENGGUNAAN',
    'SEK_EKONOMI', 'JW', 'BUNGA', 'START', 'JT', 'TGL', 'AO', 'PLAFON', 'BDEBET', 'TP',
    'TPOKOK', 'TB', 'TBUNGA', 'TUNGGAKAN', 'KOL', 'KODE JAM', 'JAMINAN', 'NILAI JAM', 'JAM SERT', 'JAM BPKB', 'JAM LAIN'
  ];

  const rows: any[][] = [headers];

  let seqNo = 1;

  // Generate realistic data for all 10 branches matching image figures
  INITIAL_KYD_REPORTS.forEach((rep) => {
    const targetCount = rep.blnIniNsb; // e.g. 1847 for KPO Wlingi
    const targetTotalRupiah = rep.blnIniOuts * 1000; // e.g. 48,984,530,000
    const avgBdebet = Math.round(targetTotalRupiah / targetCount);

    // We generate 5 representative detailed rows per branch that sum up properly when testing,
    // or generate enough rows to demonstrate
    for (let i = 1; i <= targetCount; i++) {
      const isLast = i === targetCount;
      const bdebet = isLast ? (targetTotalRupiah - (avgBdebet * (targetCount - 1))) : avgBdebet;
      const kol = (i % 20 === 0) ? 2 : (i % 100 === 0 ? 3 : 1);
      
      rows.push([
        seqNo++,
        `CIF${String(rep.branchCode).padStart(2, '0')}${String(i).padStart(4, '0')}`,
        rep.branchCode,
        `01.${rep.branchCode}.${String(i).padStart(6, '0')}`,
        `DEBITUR ${rep.kantor} ${i}`,
        `JL. RAYA ${rep.kantor} NO. ${i}`,
        `0812345${String(i).padStart(4, '0')}`,
        'PR01',
        'MODAL KERJA',
        'PRODUKTIF',
        'PERDAGANGAN',
        24,
        14.5,
        '2024-01-15',
        '2026-01-15',
        '2026-09-20',
        'AO01',
        bdebet * 1.2,
        bdebet,
        0,
        0,
        0,
        0,
        kol > 1 ? bdebet * 0.05 : 0,
        kol,
        'SHM',
        'SERTIFIKAT TANAH',
        bdebet * 1.5,
        'ADA',
        'TIDAK',
        'TIDAK'
      ]);
    }

    // Add 1 sample row with KOL = 'E' (Hapus Buku / Ekstrakomptabel) to test the elimination rule
    rows.push([
      seqNo++,
      `CIFE${String(rep.branchCode).padStart(2, '0')}999`,
      rep.branchCode,
      `01.${rep.branchCode}.WO999`,
      `DEBITUR HAPUS BUKU ${rep.kantor}`,
      `JL. EX ${rep.kantor}`,
      '0812999999',
      'PR01',
      'MODAL KERJA',
      'PRODUKTIF',
      'LAINNYA',
      36,
      14.5,
      '2020-01-15',
      '2023-01-15',
      '2026-09-20',
      'AO01',
      500000000,
      350000000,
      0,
      0,
      0,
      0,
      350000000,
      'E', // <-- KOL E harus dieliminasi oleh pivot!
      'SHM',
      'SERTIFIKAT TANAH',
      400000000,
      'ADA',
      'TIDAK',
      'TIDAK'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'NOMINATIF');
  XLSX.writeFile(wb, 'contoh_file_nominatif_pinjaman.xlsx');
}

/**
 * Membuat contoh file Excel TARGET JATIM RKAP persis sesuai format bank pada tangkapan layar
 */
export function generateSampleTargetJatim(): void {
  const wb = XLSX.utils.book_new();
  const sheetData: any[][] = [];

  const monthHeaders = ['JENIS PRODUK', 'JAN', 'FEB', 'MAR', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGTS', 'Sep-23', 'OKT', 'NOP', 'DES'];

  // Data per cabang
  const branches = [
    {
      code: 1,
      title: 'WLINGI',
      kreditRaw: [50113301.98, 50643301.98, 51428921.98, 51958921.98, 52488961.98, 53018961.98, 53378481.98, 53738001.98, 54097521.98, 54457041.98, 54816561.98, 55176051.98],
    },
    {
      code: 2,
      title: 'TARGET KEPANJEN',
      kreditRaw: [37767221.82, 38143001.55, 38518781.27, 38894561.00, 39270340.73, 39646120.46, 39896640.27, 40147160.09, 40397679.91, 40648199.73, 40898719.55, 41149239.37],
    },
    {
      code: 3,
      title: 'TARGET BRONDONG',
      kreditRaw: [76336275.40, 76836275.40, 77336275.40, 77836275.40, 78336275.40, 78836275.40, 79336275.40, 79836275.40, 80336275.40, 80836275.40, 81336275.40, 81836275.40],
    },
    {
      code: 4,
      title: 'TARGET GRESIK',
      kreditRaw: [21428286.15, 21528286.15, 21628286.15, 21728286.15, 21828286.15, 21928286.15, 22028286.15, 22128286.15, 22228286.15, 22328286.15, 22428286.15, 22528286.15],
    },
    {
      code: 5,
      title: 'TARGET TUBAN',
      kreditRaw: [10219648.75, 10319648.75, 10419648.75, 10519648.75, 10619648.75, 10719648.75, 10819648.75, 10919648.75, 11019648.75, 11119648.75, 11219648.75, 11319648.75],
    },
    {
      code: 6,
      title: 'TARGET RAMBIPUJI',
      kreditRaw: [41475236.20, 41675236.20, 41875236.20, 42075236.20, 42275236.20, 42475236.20, 42675236.20, 42875236.20, 43075236.20, 43275236.20, 43475236.20, 43675236.20],
    },
    {
      code: 7,
      title: 'TARGET GENTENG',
      kreditRaw: [80294204.60, 80794204.60, 81294204.60, 81794204.60, 82294204.60, 82794204.60, 83294204.60, 83294204.60, 83794204.60, 84294204.60, 84794204.60, 85294204.60],
    },
    {
      code: 8,
      title: 'TARGET SITUBONDO',
      kreditRaw: [14255004.30, 14355004.30, 14455004.30, 14555004.30, 14655004.30, 14755004.30, 14855004.30, 14955004.30, 15055004.30, 15155004.30, 15255004.30, 15355004.30],
    },
    {
      code: 9,
      title: 'TARGET NGUNUT',
      kreditRaw: [54053626.80, 54453626.80, 54853626.80, 55253626.80, 55653626.80, 56053626.80, 56453626.80, 56853626.80, 57253626.80, 57653626.80, 58053626.80, 58453626.80],
    },
    {
      code: 10,
      title: 'TARGET NGADILUWIH',
      kreditRaw: [20945969.45, 21145969.45, 21345969.45, 21545969.45, 21745969.45, 21945969.45, 22145969.45, 22345969.45, 22545969.45, 22745969.45, 22945969.45, 23145969.45],
    },
  ];

  branches.forEach((b) => {
    // Spacing
    sheetData.push([]);
    // Baris Judul Kantor (contoh row 8: WLINGI atau row 74: TARGET KEPANJEN)
    sheetData.push(['', '', '', '', '', '', '', b.title]);
    // Header Bulan
    sheetData.push(monthHeaders);
    // Baris 1. KREDIT
    sheetData.push(['1. KREDIT', ...b.kreditRaw]);
    // Baris pelengkap sesuai format perbankan
    sheetData.push(['* Kolektibilitas 1', ...b.kreditRaw.map((v) => +(v * 0.7).toFixed(2))]);
    sheetData.push(['3. TABUNGAN', ...b.kreditRaw.map((v) => +(v * 0.8).toFixed(2))]);
    sheetData.push(['4. DEPOSITO', ...b.kreditRaw.map((v) => +(v * 1.05).toFixed(2))]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'TARGET');
  XLSX.writeFile(wb, 'contoh_target_jatim_rkap.xlsx');
}

/**
 * Downloads a sample GLBAL excel file with real matching rows
 */
export function generateSampleGLBAL(): void {
  const wb = XLSX.utils.book_new();
  const rows = [
    ['RecType', 'Entity', 'Branch', 'COA', 'Ccy', 'Spare1', 'Spare2', 'Period', 'Amount_I', 'Mtd_Deb', 'Mtd_Cred', 'Ytd_Bal', 'Bal_5', 'Deb_5', 'Cred_5', 'Bal_6', 'Bal_7', 'Bal_8', 'Bal_9', 'Bal_10', 'Count1', 'Count2'],
  ];

  BRANCH_LIST.forEach((b) => {
    const rep = INITIAL_BRANCH_REPORTS.find((r) => r.branchCode === b.code);
    if (!rep) return;

    // 10000 Total Aset
    rows.push([
      '1', '1', String(b.code), '10000', 'IDR', '', '31', '202608',
      String((rep.aset * 1000 + (b.code === 1 ? 50000000 : 1000000)) * -1),
      '-15719920633', '15145961572', String((rep.aset * 1000) * -1),
      '-1.73862E+11', '-15719920633', '15145961572', '-1.73862E+11',
      '-1.14949E+11', '1.13582E+11', '-1.14949E+11', '1.13582E+11', '83848', '48675'
    ]);

    // 17000 RAK (Rekening Antar Kantor)
    rows.push([
      '1', '1', String(b.code), '17000', 'IDR', '', '31', '202608',
      b.code === 1 ? '-10000000' : '-1000000',
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '10', '10'
    ]);

    // 14100 Kredit
    rows.push([
      '1', '1', String(b.code), '14100', 'IDR', '', '31', '202608',
      String(rep.kredit * 1000 * -1),
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '100', '100'
    ]);

    // 22100 Tabungan
    rows.push([
      '1', '1', String(b.code), '22100', 'IDR', '', '31', '202608',
      String(rep.tabungan * 1000),
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '200', '200'
    ]);

    // 22200 Deposito Utama
    rows.push([
      '1', '1', String(b.code), '22200', 'IDR', '', '31', '202608',
      String(rep.deposito * 1000),
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '50', '50'
    ]);

    // 22250 Deposito Berjangka Khusus
    rows.push([
      '1', '1', String(b.code), '22250', 'IDR', '', '31', '202608',
      '0',
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'
    ]);

    // 40000 Pendapatan
    rows.push([
      '1', '1', String(b.code), '40000', 'IDR', '', '31', '202608',
      String(rep.pendapatan * 1000),
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '500', '500'
    ]);

    // 50000 Biaya
    rows.push([
      '1', '1', String(b.code), '50000', 'IDR', '', '31', '202608',
      String(rep.biaya * 1000 * -1),
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '400', '400'
    ]);

    // 24100 Biaya cadangan/penyesuaian
    rows.push([
      '1', '1', String(b.code), '24100', 'IDR', '', '31', '202608',
      '0',
      '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'GLBAL');
  XLSX.writeFile(wb, 'contoh_file_glbal.xlsx');
}

/**
 * Downloads a sample LLOAN excel file with all ~128 columns
 */
export function generateSampleLLOAN(): void {
  const wb = XLSX.utils.book_new();
  const headerCols = [
    'Status record', 'Status Data', 'Wilayah', 'Branch', 'Customer code', 'Facility Type',
    'Fac. Seq. No', 'Cust.No Facilitas', 'Fac Type Facilitas', 'Fac Seqn Facilitas',
    'Loan Cust No', 'Cust.Parent No', 'Loan Number', 'Loan Processing', 'Loan Type',
    'Loan Ccy Code', 'Loan Holder', 'Tangible/ Intangible', 'Alternate N/A',
    'Economical Sector Code', 'Industry Code', 'Location Code', 'Type of Use',
    'Collectibility External', 'Collectibility Internal', 'Collectibility System',
    'Owner Clasf.', 'A/O code', 'Narrative', 'Start Date', 'Tanggal', 'From Area Code',
    'From Branch Code', 'KUK/Non KUK', 'Stop Int.Accr /Amrt', 'Stop Penalty Accr.',
    'Write Off', 'Duration', 'Calc.Meth (12/360/365-6)', 'Base Rate code', 'Spread /Rate',
    'Total/Current Int.Rate', 'Dummy Int. Rate', 'Int Rate For Advise', 'Margin Rate',
    'Margin Indicator', 'Loan Exch Rate', 'Fac. Exch Rate', 'Facility Amount - Orig',
    'DrawDwn/Start Settl. A/C', 'Repay/Princp. Settl. A/C', 'Interest Settl. A/C',
    'Repay. Auto Sett.Flag', 'Int. Auto Sett.Flag', 'Repayment Type', 'Repayment Date',
    'Frequency', 'Repayment Day No', 'Repayment Amount', 'StartDate Pric.Deduction',
    'Next Repayment Date', 'Last Repayment Date', 'Repayment Sched.Flag', 'Int.Payment Date',
    'Int.Payment Frequency', 'Int.Payment Day No', 'Interest Amount', 'Next Int.Payment Date',
    'Last Int.Payment Date', 'Int.Pay. Revolv. Flag', 'Penalty Rate', 'Minimum Penalty Amount',
    'Principle Amount Orig.', 'Total Discount Int.Amt.', 'Int.Back Value Date',
    'Princ.Back Value Date', 'Div Factor for Accrual', 'Stop Int Acc.Date',
    'Accrue Adj Manual', 'Accrue Adj by System', 'Last Date Accrued',
    'Next Amt.Posted Org Ccy', 'Last Date Acc.Posted', 'Next Amt.Cap. Org Ccy',
    'Last Date Capitalized', 'Tot.Capitalized Org Ccy', 'Accrual Days Counter',
    'Due Principle Amt', 'Due Interest Amt', 'Due Penalty Amt', 'Principle Paid Amount',
    'Interest Paid Amount', 'Penalty Paid Amount', 'Fee Paid Amount', 'Write Off Principle',
    'Write Off Interest', 'Write Off Penalty', 'Principle Paid Unaut.Amt',
    'Interest Paid Unauth.Amt', 'Penalty Paid Unauth.Amt.', 'Fee Paid Unauth.Amount',
    'Unaut.Write Of Principle', 'Unaut.Write Off Interest', 'Unaut.Write Off Penalty',
    'Pri/Repay Due Str. Date', 'Interest Due Start Date', 'Last Principle Pay.Date',
    'Last Interest Pay. Date', 'Last Penalty Pay. Date', 'Last Fee Payment Date',
    'Date Last Write Off Pri.', 'Date Last Write Off Int.', 'Start Calc Penalty Date',
    'Date Last Write Off Pnt.', 'No. of Penalty', 'Override Flag', 'Override by',
    '1st Job Date Entry', 'User ID', 'Department Code', 'Last Sys Date Amend',
    'Last Job Date Amend', 'Last Time Amend', 'Authorize By', 'Display ID', 'Extra_Flag', 'Extra_Info', 'DPD_Indicator'
  ];

  const rows: any[][] = [headerCols];

  BRANCH_LIST.forEach((b) => {
    const rep = INITIAL_BRANCH_REPORTS.find((r) => r.branchCode === b.code);
    if (!rep) return;

    // Create realistic loan representative records:
    // 1. Kol 1 Lancar without past due
    const r1 = new Array(128).fill('');
    r1[0] = 'A'; r1[1] = 'A'; r1[2] = 1; r1[3] = b.code; r1[4] = `CUST${b.code}01`;
    r1[25] = 1; // Kol 1
    r1[72] = String(Math.round((rep.kredit - rep.lar - rep.npl) * 1000 * 100 * -1)); // BU
    r1[90] = '0'; // CM
    r1[94] = '0'; // CQ
    r1[127] = 0; // DX (0 days past due)
    rows.push(r1);

    // 2. Kol 1 with past due (part of LAR)
    const r2 = new Array(128).fill('');
    r2[0] = 'A'; r2[1] = 'A'; r2[2] = 1; r2[3] = b.code; r2[4] = `CUST${b.code}02`;
    r2[25] = 1; // Kol 1
    r2[72] = String(Math.round((rep.lar * 0.3) * 1000 * 100 * -1)); // BU
    r2[90] = '0';
    r2[94] = '0';
    r2[127] = 15; // DX > 0 (e.g. 15 DPD)
    rows.push(r2);

    // 3. Kol 2 DPK (part of LAR)
    const r3 = new Array(128).fill('');
    r3[0] = 'A'; r3[1] = 'A'; r3[2] = 1; r3[3] = b.code; r3[4] = `CUST${b.code}03`;
    r3[25] = 2; // Kol 2
    r3[72] = String(Math.round((rep.lar * 0.7) * 1000 * 100 * -1)); // BU
    r3[90] = '0';
    r3[94] = '0';
    r3[127] = 45; // DX
    rows.push(r3);

    // 4. Kol 3/4/5 NPL
    const r4 = new Array(128).fill('');
    r4[0] = 'A'; r4[1] = 'A'; r4[2] = 1; r4[3] = b.code; r4[4] = `CUST${b.code}04`;
    r4[25] = 5; // Kol 5 Macet (>2)
    r4[72] = String(Math.round(rep.npl * 1000 * 100 * -1)); // BU
    r4[90] = '0';
    r4[94] = '0';
    r4[127] = 180; // DX
    rows.push(r4);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'LLOAN');
  XLSX.writeFile(wb, 'contoh_file_lloan.xlsx');
}

/**
 * Downloads a sample LHPDU excel file (columns A to X)
 */
export function generateSampleLHPDU(): void {
  const wb = XLSX.utils.book_new();
  const rows: any[][] = [
    [
      'Status Record', 'Status Data', 'Wilayah', 'Branch', 'Customer Code', 'Facility Type',
      'Loan Ccy', 'Start Date', 'Maturity Date', 'Effective Date', 'Last Pay Date',
      'Account No', 'DPD Days', 'Pokok Tertunggak', 'Bunga Tertunggak', 'Denda Tertunggak',
      'Col17', 'Col18', 'Col19', 'Col20', 'Col21', 'Col22', 'Collectibility', 'Facility Code'
    ]
  ];

  BRANCH_LIST.forEach((b) => {
    const tunggakan = INITIAL_TUNGGAKAN_DATA.find((t) => t.branchCode === b.code);
    const pokok = tunggakan ? tunggakan.duePrinciple * 1000 : 1500000000;
    const bunga = tunggakan ? tunggakan.dueInterest * 1000 : 350000000;
    const denda = tunggakan ? tunggakan.duePenalty * 1000 : 50000000;

    rows.push([
      'A', 'A', '1', String(b.code), `1450${b.code}01`, 'N', 'IDR',
      '20240115', '20280401', '20240115', '20260901', `1450${b.code}01111015I`,
      '45', String(pokok), String(bunga), String(denda),
      '0', '0', '0', '0', '0', '0', 'L', 'I'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'LHPDU');
  XLSX.writeFile(wb, 'contoh_file_lhpdu.xlsx');
}

/**
 * Exports complete calculations to a formatted Excel workbook matching both user's images
 */
export function exportReportToExcel(
  reports: BranchReport[],
  kydReports: KydBranchReport[],
  dateStr: string = '20-Sep-26'
): void {
  const wb = XLSX.utils.book_new();
  const konsolidasi = getKonsolidasi(reports);
  const kydKonsolidasi = getKydKonsolidasi(kydReports);

  // Sheet 1: HASIL LAPORAN (Sesuai format resmi: Baris 11 KPO Wlingi, Col E: Kredit, Col H: LAR, Col I: =H11/E11)
  const sheet1Data: any[][] = [
    [dateStr],
    ['', 'LAPORAN POS-POS PENTING PER CABANG'],
    ['', '(dalam ribuan rupiah)'],
    [],
    [],
    [],
    [],
    [],
    ['', 'NO', 'KANTOR', 'POS-POS PENTING', '', '', '', '', '', '', '', '', ''],
    ['', '', '', 'ASET', 'KREDIT', 'TABUNGAN', 'DEPOSITO', 'LAR', '%LAR', 'NPL', '%NPL', 'PENDAPATAN', 'BIAYA', 'L/R'],
  ];

  reports.forEach((r, idx) => {
    const rowNum = 11 + idx; // Baris 11, 12, ... 20
    sheet1Data.push([
      '',
      r.no,
      r.kantor,
      r.aset,
      r.kredit,
      r.tabungan,
      r.deposito,
      r.lar,
      { t: 'n', f: `H${rowNum}/E${rowNum}`, v: r.larPercent / 100, z: '0.00%' },
      r.npl,
      { t: 'n', f: `J${rowNum}/E${rowNum}`, v: r.nplPercent / 100, z: '0.00%' },
      r.pendapatan,
      r.biaya,
      { t: 'n', f: `L${rowNum}-M${rowNum}`, v: r.lr, z: '#,##0' },
    ]);
  });

  // Baris 21: Konsolidasi
  sheet1Data.push([
    '',
    '',
    'KONSOLIDASI',
    { t: 'n', f: 'SUM(D11:D20)', v: konsolidasi.aset },
    { t: 'n', f: 'SUM(E11:E20)', v: konsolidasi.kredit },
    { t: 'n', f: 'SUM(F11:F20)', v: konsolidasi.tabungan },
    { t: 'n', f: 'SUM(G11:G20)', v: konsolidasi.deposito },
    { t: 'n', f: 'SUM(H11:H20)', v: konsolidasi.lar },
    { t: 'n', f: 'H21/E21', v: konsolidasi.larPercent / 100, z: '0.00%' },
    { t: 'n', f: 'SUM(J11:J20)', v: konsolidasi.npl },
    { t: 'n', f: 'J21/E21', v: konsolidasi.nplPercent / 100, z: '0.00%' },
    { t: 'n', f: 'SUM(L11:L20)', v: konsolidasi.pendapatan },
    { t: 'n', f: 'SUM(M11:M20)', v: konsolidasi.biaya },
    { t: 'n', f: 'L21-M21', v: konsolidasi.lr },
  ]);

  sheet1Data.push([]);
  sheet1Data.push(['', 'Nb. Biaya belum termasuk tafsiran pajak sehingga L/R = sebelum pajak']);

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 2 },  // Margin Col A
    { wch: 6 },  // NO
    { wch: 20 }, // KANTOR
    { wch: 14 }, // ASET
    { wch: 14 }, // KREDIT
    { wch: 14 }, // TABUNGAN
    { wch: 14 }, // DEPOSITO
    { wch: 12 }, // LAR
    { wch: 10 }, // %LAR (=H11/E11)
    { wch: 12 }, // NPL
    { wch: 10 }, // %NPL (=J11/E11)
    { wch: 14 }, // PENDAPATAN
    { wch: 14 }, // BIAYA
    { wch: 14 }, // L/R
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'HASIL LAPORAN');

  // Sheet 2: KYD SEP (Baris 6 KPO Wlingi, Rumus: G6=E6-C6, H6=F6-D6, J6=F6-I6)
  const sheet2Data: any[][] = [
    [dateStr],
    ['LAPORAN KREDIT PER CABANG'],
    ['(dalam ribuan rupiah)'],
    ['NO', 'KANTOR', 'BLN LALU', '', 'BLN INI', '', 'GROWTH', '', 'TARGET BLN INI', ''],
    ['', '', 'NSB', 'OUTS', 'NSB', 'OUTS', 'NSB', 'NOMINAL', 'NOMINAL', 'DEVIASI'],
  ];

  kydReports.forEach((k, idx) => {
    const rowNum = 6 + idx; // Baris 6 s.d 15
    sheet2Data.push([
      k.no,
      k.kantor,
      k.blnLaluNsb,
      k.blnLaluOuts,
      k.blnIniNsb,
      k.blnIniOuts,
      { t: 'n', f: `E${rowNum}-C${rowNum}`, v: k.growthNsb, z: '#,##0;(#,##0);"-"' },
      { t: 'n', f: `F${rowNum}-D${rowNum}`, v: k.growthNominal, z: '#,##0;(#,##0);"-"' },
      k.targetNominal,
      { t: 'n', f: `F${rowNum}-I${rowNum}`, v: k.deviasi, z: '#,##0;(#,##0);"-"' },
    ]);
  });

  // Baris 16: TOTAL KONSOLIDASI
  sheet2Data.push([
    '',
    'TOTAL KONSOLIDASI',
    { t: 'n', f: 'SUM(C6:C15)', v: kydKonsolidasi.blnLaluNsb },
    { t: 'n', f: 'SUM(D6:D15)', v: kydKonsolidasi.blnLaluOuts },
    { t: 'n', f: 'SUM(E6:E15)', v: kydKonsolidasi.blnIniNsb },
    { t: 'n', f: 'SUM(F6:F15)', v: kydKonsolidasi.blnIniOuts },
    { t: 'n', f: 'E16-C16', v: kydKonsolidasi.growthNsb, z: '#,##0;(#,##0);"-"' },
    { t: 'n', f: 'F16-D16', v: kydKonsolidasi.growthNominal, z: '#,##0;(#,##0);"-"' },
    { t: 'n', f: 'SUM(I6:I15)', v: kydKonsolidasi.targetNominal },
    { t: 'n', f: 'F16-I16', v: kydKonsolidasi.deviasi, z: '#,##0;(#,##0);"-"' },
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 6 },  // NO
    { wch: 22 }, // KANTOR
    { wch: 10 }, // BLN LALU NSB
    { wch: 16 }, // BLN LALU OUTS
    { wch: 10 }, // BLN INI NSB
    { wch: 16 }, // BLN INI OUTS
    { wch: 12 }, // GROWTH NSB
    { wch: 16 }, // GROWTH NOMINAL
    { wch: 16 }, // TARGET NOMINAL
    { wch: 16 }, // DEVIASI
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'KYD SEP');

  XLSX.writeFile(wb, `Laporan_Pos_Penting_Kredit_${dateStr.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
}
