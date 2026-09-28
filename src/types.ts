export interface BranchReport {
  no: number;
  branchCode: number;
  kantor: string;
  aset: number;
  kredit: number;
  tabungan: number;
  deposito: number;
  lar: number;
  larPercent: number;
  npl: number;
  nplPercent: number;
  pendapatan: number;
  biaya: number;
  lr: number;
}

export interface KydBranchReport {
  no: number;
  branchCode: number;
  kantor: string;
  blnLaluNsb: number;
  blnLaluOuts: number;
  blnIniNsb: number;
  blnIniOuts: number;
  growthNsb: number;
  growthNominal: number;
  targetNominal: number;
  deviasi: number;
}

export interface RawRowNominatif {
  no?: number | string;
  cif?: string;
  kantor: number; // 1 to 10
  norek: string;
  nama: string;
  alamat?: string;
  telp?: string;
  proc?: string;
  type?: string;
  jnsPenggunaan?: string;
  sekEkonomi?: string;
  jw?: number;
  bunga?: number;
  start?: string;
  jt?: string;
  tgl?: string;
  ao?: string;
  plafon?: number;
  bdebet: number; // Baki Debet / Outstanding (Col S)
  tp?: number;
  tpokok?: number;
  tb?: number;
  tbunga?: number;
  tunggakan?: number;
  kol: string | number; // Col Y (KOL 1-5, 'E' is excluded)
  kodeJam?: string;
  jaminan?: string;
  nilaiJam?: number;
  jamSert?: string;
  jamBpkb?: string;
  jamLain?: string;
}

export interface TargetJatimMatrix {
  // branchCode (1-10) -> array of 12 targets [JAN..DES] in thousands IDR
  [branchCode: number]: number[];
}

export interface TargetJatimFileInfo {
  name: string;
  size: number;
  uploadedAt: string;
  targets: TargetJatimMatrix;
  branchNamesFound: string[];
}

export interface FileUploadInfo {
  name: string;
  size: number;
  lastModified: number;
  rowCount: number;
  uploadedAt: string;
  status: 'ready' | 'loading' | 'error';
  error?: string;
}

export interface TunggakanItem {
  branchCode: number;
  kantor: string;
  nasabahCount: number;
  kolektibilitas1: number; // Lancar
  kolektibilitas2: number; // DPK
  kolektibilitas3: number; // Kurang Lancar
  kolektibilitas4: number; // Diragukan
  kolektibilitas5: number; // Macet
  dpdUnder30: number;
  dpd30to90: number;
  dpdOver90: number;
  duePrinciple: number;
  dueInterest: number;
  duePenalty: number;
  totalTunggakan: number;
  totalLar: number;
  totalNpl: number;
}

export interface CalculationAuditInfo {
  branchCode: number;
  branchName: string;
  asetFormula: string;
  kreditFormula: string;
  tabunganFormula: string;
  depositoFormula: string;
  pendapatanFormula: string;
  biayaFormula: string;
  larFormula: string;
  nplFormula: string;
}
