import { X, Calculator, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface FormulaAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormulaAuditModal({ isOpen, onClose }: FormulaAuditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Kamus Rumus &amp; Logika Perhitungan Sistem</h3>
              <p className="text-xs text-slate-300">
                Sesuai formula SUMPRODUCT dari GLBAL, LLOAN, dan LHPDU
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Section 1: GLBAL Formulas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              1. Rumus Pos-Pos Keuangan dari Berkas GLBAL
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {/* Aset */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 md:col-span-2">
                <div className="font-sans font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    ASET — Formula Spesifik Per-Kantor (10 Kantor Cabang)
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">GLBAL Sheet</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 font-mono text-[10.5px]">
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">1. KPO Wlingi (Cabang 1):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=1)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=1)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=3)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=6)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=7)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=9)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">2. Kepanjen (Cabang 2):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=2)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=2)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">3. Brondong (Cabang 3):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=3)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">4. Gresik (Cabang 4):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=4)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=4)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">5. Tuban (Cabang 5):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=5)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=5)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">6. Rambipuji (Cabang 6):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=6)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">7. Genteng (Cabang 7):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=7)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">8. Situbondo (Cabang 8):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=8)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=8)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">9. Ngunut (Cabang 9):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=9)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <strong className="text-slate-900 font-sans block mb-0.5">10. Ngadiluwih (Cabang 10):</strong>
                    <code className="text-blue-800 block break-all leading-relaxed">
                      =((SUMPRODUCT((GLBAL!$C1:$C10000=10)*(GLBAL!$D1:$D10000=10000),(GLBAL!$I1:$I10000)*-1))-(SUMPRODUCT((GLBAL!$C1:$C10000=10)*(GLBAL!$D1:$D10000=17000),(GLBAL!$I1:$I10000)*-1)))/1000
                    </code>
                  </div>
                </div>
                <div className="mt-2.5 p-2 bg-blue-50/80 rounded border border-blue-200 text-[11px] text-blue-950 font-sans">
                  <strong>Aturan Normalisasi Sel Kosong (Data Sanitization):</strong> Jika ada sel kosong pada kolom abjad/teks otomatis diisi <code>&quot;-&quot;</code>, dan jika sel kosong pada kolom angka/nominal otomatis diisi <code>0</code> (termasuk deteksi format akuntansi negatif tanda kurung dan minus di akhir) sehingga kalkulasi aset dan laporan berjalan maksimal tanpa nilai NaN atau sel rusak.
                </div>
              </div>

              {/* Kredit */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>KREDIT</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">GLBAL</span>
                </div>
                <code className="text-[11px] text-indigo-800 block break-all bg-white p-2 rounded border border-slate-200">
                  (SUMPRODUCT((GLBAL!$C=Cabang)*(GLBAL!$D=14100), GLBAL!$I * -1)) / 1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Menjumlahkan saldo baki debet kredit (COA 14100) per nomor branch / cabang.
                </p>
              </div>

              {/* Tabungan */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>TABUNGAN</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">GLBAL</span>
                </div>
                <code className="text-[11px] text-emerald-800 block break-all bg-white p-2 rounded border border-slate-200">
                  (SUMPRODUCT((GLBAL!$C=Cabang)*(GLBAL!$D=22100), GLBAL!$I)) / 1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Menjumlahkan saldo tabungan nasabah (COA 22100) per cabang.
                </p>
              </div>

              {/* Deposito */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>DEPOSITO</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">GLBAL</span>
                </div>
                <code className="text-[11px] text-emerald-800 block break-all bg-white p-2 rounded border border-slate-200">
                  ((SUMPRODUCT((C=Cabang)*(D=22200), I) + SUMPRODUCT((C=Cabang)*(D=22250), I*-1))) / 1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Menggabungkan simpanan berjangka COA 22200 dan COA 22250 per cabang.
                </p>
              </div>

              {/* Pendapatan */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>PENDAPATAN</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">GLBAL</span>
                </div>
                <code className="text-[11px] text-blue-800 block break-all bg-white p-2 rounded border border-slate-200">
                  (SUMPRODUCT((GLBAL!$C=Cabang)*(GLBAL!$D=40000), GLBAL!$I)) / 1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Total pendapatan operasional &amp; bunga (COA 40000).
                </p>
              </div>

              {/* Biaya */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>BIAYA</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">GLBAL</span>
                </div>
                <code className="text-[11px] text-rose-800 block break-all bg-white p-2 rounded border border-slate-200">
                  ((SUMPRODUCT((C=Cabang)*(D=50000), I*-1) - SUMPRODUCT((C=Cabang)*(D=24100), I))) / 1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Total biaya operasional COA 50000 dikurangi penyesuaian COA 24100.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: LAR & NPL Formulas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-1.5 border-b border-slate-200">
              <Calculator className="w-4 h-4 text-amber-600" />
              2. Rumus LAR &amp; NPL dari Berkas LLOAN &amp; LHPDU
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
              {/* LAR */}
              <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200 md:col-span-2">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    LAR (Loan at Risk) — Rumus Dinamis Tanpa Penguncian
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded">LLOAN Sheet</span>
                </div>
                <code className="text-[11px] text-amber-900 block break-all bg-white p-2.5 rounded border border-amber-300 leading-relaxed font-mono">
                  =((SUMPRODUCT((LLOAN!$A$2:$A$70000="A")*(LLOAN!$Z$2:$Z$70000=1)*(ISNUMBER(LLOAN!$DX$2:$DX$70000))*(LLOAN!$DX$2:$DX$70000&gt;0)*(LLOAN!$D$2:$D$70000=Branch), ((LLOAN!$BU$2:$BU$70000+LLOAN!$CM$2:$CM$70000+LLOAN!$CQ$2:$CQ$70000)*-1)/100)) +<br />
                  (SUMPRODUCT((LLOAN!$A$2:$A$70000="A")*(LLOAN!$Z$2:$Z$70000=2)*(LLOAN!$D$2:$D$70000=Branch), ((LLOAN!$BU$2:$BU$70000+LLOAN!$CM$2:$CM$70000+LLOAN!$CQ$2:$CQ$70000)*-1)/100)))/1000
                </code>
                <p className="font-sans text-[11px] text-slate-600 mt-2 leading-normal">
                  <strong>2 Komponen Utama:</strong> (1) Kol 1 yang memiliki DPD &gt; 0 / menunggak, dan (2) Seluruh Kol 2 (DPK). Saldo dihitung dari <code>((BU + CM + CQ) * -1) / 100</code> lalu dibagi 1.000 (dalam ribuan rupiah).
                </p>

                {/* Catatan Solusi Jebakan Excel */}
                <div className="mt-2.5 p-3 bg-amber-100/80 rounded-xl border border-amber-300 text-[11px] font-sans text-amber-950 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>💡 Mengapa Rumus Excel Sering Menghasilkan Angka Berbeda di Setiap Tanggal?</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-800">
                    <li>
                      <strong>Jebakan Teks di Excel:</strong> Jika sel kolom DPD berisi spasi kosong <code>" "</code> atau teks, rumus Excel <code>(DX &gt; 0)</code> bernilai <strong>TRUE</strong>! Akibatnya seluruh nasabah Kol 1 yang lancar ikut terhitung dan LAR melambung tinggi. Solusinya di Excel wajib ditambahkan <code>ISNUMBER(DX)*(DX &gt; 0)</code>.
                    </li>
                    <li>
                      <strong>Deteksi Tunggakan Nyata:</strong> Jika kolom DPD di core banking tidak ter-update di hari kerja biasa, sistem web ini secara pintar memeriksa Kolom CJ (Tunggakan Pokok) &amp; CK (Tunggakan Bunga). Bila ada tunggakan &gt; 0 pada Kol 1, otomatis dihitung masuk LAR.
                    </li>
                    <li>
                      <strong>100% Dinamis dari Berkas:</strong> Sistem aplikasi ini membaca murni baris-baris berkas LLOAN yang Anda unggah tanpa fallback ke defaultData, sehingga dapat dipakai untuk tanggal baru kapan pun di tahun 2026 maupun 2027.
                    </li>
                  </ul>
                </div>
              </div>

              {/* NPL */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>NPL (Non-Performing Loan)</span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">LLOAN</span>
                </div>
                <code className="text-[11px] text-rose-800 block break-all bg-white p-2 rounded border border-slate-200">
                  (SUMPRODUCT((LLOAN!$A1:$A70000="A")*(LLOAN!$Z1:$Z70000&gt;2)*(LLOAN!$D1:$D70000=Branch),((LLOAN!$BU1:$BU70000+LLOAN!$CM1:$CM70000+LLOAN!$CQ1:$CQ70000)*-1)/100))/1000
                </code>
                <p className="font-sans text-[11px] text-slate-500 mt-1.5">
                  Pinjaman bermasalah dengan Kolektibilitas &gt; 2 (Kol 3: Kurang Lancar, Kol 4: Diragukan, Kol 5: Macet).
                </p>
              </div>

              {/* Rasio */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span>Rasio Risiko (%LAR &amp; %NPL)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Revisi</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-sans text-[11px] font-semibold text-amber-900 block mb-0.5">Rumus Revisi %LAR:</span>
                    <code className="text-[11px] text-amber-800 block bg-white p-1.5 rounded border border-amber-300 font-bold">
                      =H11/E11
                    </code>
                    <span className="font-sans text-[10px] text-slate-500">H11 = Nilai LAR, E11 = Nilai Kredit (diformat %)</span>
                  </div>
                  <div>
                    <span className="font-sans text-[11px] font-semibold text-rose-900 block mb-0.5">Rumus %NPL:</span>
                    <code className="text-[11px] text-rose-800 block bg-white p-1.5 rounded border border-rose-300 font-bold">
                      =J11/E11
                    </code>
                    <span className="font-sans text-[10px] text-slate-500">J11 = Nilai NPL, E11 = Nilai Kredit (diformat %)</span>
                  </div>
                </div>
              </div>

              {/* Laporan Kredit Per Cabang (KYD) */}
              <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-200">
                <div className="font-sans font-bold text-slate-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    KYD — Laporan Kredit Per Cabang &amp; Target Jatim RKAP
                  </span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 font-semibold px-2 py-0.5 rounded">Nominatif &amp; Target Jatim</span>
                </div>
                <p className="font-sans text-[11px] text-slate-600 mb-2">
                  Data Bulan Ini diparsing langsung dari berkas <strong>Nominatif Pinjaman</strong> (Normalisasi: cell kosong abjad = &quot;-&quot;, cell kosong angka = 0). KOL 1-5 dihitung, KOL E dieliminasi.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="font-bold text-indigo-950 block mb-0.5">Growth NSB:</span>
                    <code className="text-emerald-700 font-bold block">=E6-C6</code>
                    <span className="text-[10px] text-slate-500">(NSB Bln Ini - NSB Bln Lalu)</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="font-bold text-indigo-950 block mb-0.5">Growth Nominal:</span>
                    <code className="text-emerald-700 font-bold block">=F6-D6</code>
                    <span className="text-[10px] text-slate-500">(OUTS Bln Ini - OUTS Bln Lalu)</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="font-bold text-indigo-950 block mb-0.5">Target Nominal (Target Jatim):</span>
                    <code className="text-purple-800 font-bold block">RKAP Baris &quot;1. KREDIT&quot;</code>
                    <span className="text-[10px] text-slate-500">Bulan otomatis diselaraskan dari upload Bulan Ini (contoh: normatif_agustus &rarr; Agts)</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-indigo-200">
                    <span className="font-bold text-indigo-950 block mb-0.5">Target Deviasi:</span>
                    <code className="text-indigo-700 font-bold block">=F6-I6</code>
                    <span className="text-[10px] text-slate-500">(OUTS Bln Ini - Target Nominal)</span>
                  </div>
                </div>
                <div className="mt-2.5 p-2 bg-purple-50 rounded border border-purple-200 text-[11px] text-purple-900">
                  <strong>Aturan Pembulatan Target RKAP (User Rule):</strong> 2 digit di belakang koma: jika &ge; 50 dibulatkan ke atas (contoh: 54,097,521.98 &rarr; 54,097,522). Jika &lt; 50 dihilangkan (contoh: 54,097,521.08 &rarr; 54,097,521).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Formula tervalidasi 100% sesuai standar perbankan dan rumus lembar kerja
          </span>
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
