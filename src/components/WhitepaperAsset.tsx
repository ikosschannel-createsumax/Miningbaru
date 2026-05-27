import React, { useState } from 'react';
import { FileText, Shield, PieChart, Landmark, TrendingUp, Info, HelpCircle, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export default function WhitepaperAsset() {
  const [activeSec, setActiveSec] = useState<'intro' | 'tokenomics' | 'tech' | 'roadmap'>('intro');

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 text-[11px] text-emerald-400 font-mono border border-zinc-800 mb-2">
            <FileText className="h-3 w-3" />
            Dokumen Resmi v2.4 (Terupdate 2026)
          </span>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white mb-1">
            Whitepaper Digital Asset: IDR Rupiah Coin
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Spesifikasi teknis, mekanisme konsensus terenkripsi end-to-end, regulasi tokenomik, serta peta jalan (roadmap) ekosistem pertambangan virtual berbasis jaringan Cloud Asia-Tenggara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar inside component */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'intro', label: '1. Pengantar & Visi', icon: Info },
            { id: 'tokenomics', label: '2. Model Tokenomik', icon: PieChart },
            { id: 'tech', label: '3. Arsitektur Teknis', icon: Shield },
            { id: 'roadmap', label: '4. Peta Jalan Strategis', icon: TrendingUp },
          ].map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSec(sec.id as any)}
                className={`w-full flex items-center gap-2.5 py-3 px-4 rounded-xl text-xs font-semibold tracking-wide text-left transition-all ${
                  activeSec === sec.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'bg-zinc-90 w-full hover:bg-zinc-900 border border-transparent text-zinc-400'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sec.label}
              </button>
            );
          })}

          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-2.5">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-emerald-500 animate-pulse" />
              Verifikasi Vault
            </span>
            <p className="text-[10.5px] text-zinc-400 leading-relaxed">
              Algoritma konsensus disinkronkan secara real-time dengan server backend untuk mengamankan distribusi koin di dompet penampungan Anda.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-900 bg-zinc-950 p-6 space-y-6 shadow-md min-h-[400px]">
          {activeSec === 'intro' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-xs text-zinc-300 leading-relaxed"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-zinc-900">
                1. Pengantar & Visi Ekosistem IDR-Secure Miner
              </h3>
              <p>
                IDR Rupiah Coin diciptakan sebagai representasi digital virtual berbasis penambangan awan (cloud-based proof-of-performance) yang bertujuan menjembatani kompleksitas hashing kriptografi bagi masyarakat luas dengan kemudahan akses <strong>1x klik saja</strong>.
              </p>
              <p>
                Melalui ekosistem penambangan otomatis 24 jam ini, server cloud kami menyelesaikan perhitungan enkripsi secara mandiri tanpa membebani daya baterai, CPU, ataupun kuota internet perangkat keras lokal Anda. Hal ini merevolusi efisiensi energi dengan mengadopsi skema <em>eco-mining algorithm</em> di bank server regional.
              </p>
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-2">
                <h4 className="font-semibold text-white text-xs">Mengapa Memilih Ekosistem Koin IDR Virtual?</h4>
                <ul className="list-disc list-inside space-y-1 text-zinc-450 text-[11px]">
                  <li>Sesi aman 24 jam penuh tanpa perlu aplikasi tetap terbuka di browser.</li>
                  <li>Integritas mutasi dana dijamin transparan dan tercatat langsung pada ledger terenkripsi.</li>
                  <li>Kemudahan deposit instan via QRIS GPN standar nasional untuk sewa alat pertambangan hardware (Hashrate Shop).</li>
                  <li>Aturan penarikan langsung terhubung ke e-wallet andalan Anda (DANA) secara dinamis.</li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeSec === 'tokenomics' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-zinc-900">
                2. Alokasi & Model Regulasi Tokenomik
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Pasokan Koin IDR virtual didistribusikan dengan skema pembagian yang sangat ketat untuk menjaga nilai tukar dan likuiditas serta kelancaran pencairan dana di terminal penarikan e-wallet.
              </p>

              {/* Progress Distribution visual representation */}
              <div className="space-y-3.5 my-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-850">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500">Distribusi Pasokan Koin Baru</span>
                
                <div className="space-y-2">
                  {[
                    { label: 'Mining Rewards (Hadiah Penambangan Anggota)', pct: '60%', color: 'from-emerald-500 to-emerald-400' },
                    { label: 'Liquidity Pool Payout (Pencairan Dompet)', pct: '20%', color: 'from-pink-500 to-pink-400' },
                    { label: 'Referral Booster Allocation', pct: '10%', color: 'from-teal-500 to-teal-400' },
                    { label: 'Development & Server Cloud Regional Operations', pct: '10%', color: 'from-amber-500 to-amber-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-white font-bold">{item.pct}</span>
                      </div>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                        <div className={`bg-gradient-to-r ${item.color} h-full rounded-full`} style={{ width: item.pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="py-2">Parameter Aset</th>
                      <th className="py-2">Spesifikasi Server</th>
                      <th className="py-2 text-right">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
                    <tr>
                      <td className="py-2.5 font-semibold">Mata Uang Pendukung</td>
                      <td className="py-2.5">Indonesian Rupiah (IDR)</td>
                      <td className="py-2.5 text-right text-emerald-400 font-mono">1:1 Virtual Base Value</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold">Minimum Withdrawal</td>
                      <td className="py-2.5">Rp 10.000 (Akun Baru / Default)</td>
                      <td className="py-2.5 text-right font-mono">Instan ke DANA</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold">Maksimal Tambang Harian</td>
                      <td className="py-2.5">Berdasar Sewa Hashrate (KH/s)</td>
                      <td className="py-2.5 text-right font-mono">Tanpa Batas Atas</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold">Tingkat Keamanan Log</td>
                      <td className="py-2.5">SSL 256-Bit + SHA-256 Block</td>
                      <td className="py-2.5 text-right font-mono text-indigo-400">Ledger Immutable</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeSec === 'tech' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 text-xs text-zinc-300 leading-relaxed"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-zinc-900">
                3. Spesifikasi Keamanan E2EE & Enkripsi Hash
              </h3>
              <p>
                Keamanan adalah prioritas utama jaringan <strong>IDR Rupiah Coin Miner</strong>. Setiap transaksi penambangan, perubahan parameter e-wallet, pengisian saldo deposit QRIS, dan permintaan penarikan dana diamankan menggunakan kombinasi kunci kriptografi asimetris (SHA-256).
              </p>
              <p>
                Ketika Anda melakukan pendaftaran akun baru, server secara otomatis menghasilkan pasangan kunci: sebuah <strong>Kunci Publik (Public Key)</strong> untuk memverifikasi transaksi pertambangan Anda di ledger, serta <strong>Kunci Pribadi (Private Key)</strong> terenkripsi secara lokal untuk melindungi saldo Anda agar tidak dapat diretas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850">
                  <h4 className="font-semibold text-white text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Penyimpanan Terdistribusi (Secure Ledger)
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Setiap block hash penambangan divalidasi silang oleh node terpercaya untuk memastikan bahwa tidak ada manipulasi nilai saldo secara ilegal pada sisi aplikasi klien.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-850">
                  <h4 className="font-semibold text-white text-xs mb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Enkripsi SSL Gateway QRIS
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Gateway berlabel instan nasional Indonesia (GPN-QRIS) diamankan secara end-to-end oleh perisai enkripsi perbankan berlapis 256-bit guna meminimalisir kegagalan kliring deposit.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSec === 'roadmap' && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-zinc-900">
                4. Peta Jalan Pengembangan (Roadmap)
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                IDR Rupiah Coin didesain berkelanjutan dengan rencana pembaharuan sistem secara berkala untuk menjaga stabilitas penambang dan memperluas integrasi e-wallet di Indonesia.
              </p>

              {/* Vertical timeline visualization */}
              <div className="relative border-l border-zinc-800 pl-6 ml-2 space-y-6 py-2">
                {[
                  { title: 'Fase I: Peluncuran Sukses & Integrasi QRIS (Q2 2026)', desc: 'Penyelaras sistem sinkronisasi in-memory database dengan server Express backend untuk multi-perangkat. Implementasi QRIS instan otomatis.', current: true },
                  { title: 'Fase II: Diversifikasi Alat Pembayaran E-Wallet (Q3 2026)', desc: 'Pengembangan jalur mutasi baru bagi pengguna GoPay, ShopeePay, serta LinkAja untuk mempermudah pendaftaran sewa hashrate pertambangan tambahan.', current: false },
                  { title: 'Fase III: Desentralisasi Ledger Global (Q4 2026)', desc: 'Membuka API node bagi pengembang eksternal yang ingin mendukung stabilitas hashing dan mengintegrasikan payout IDR secara lebih luas.', current: false },
                  { title: 'Fase IV: Program Insentif Komunitas Raksasa (2027)', desc: 'Pengembangan sayap program referral berantai dan peluncuran token tata kelola untuk voting fitur baru aplikasi.', current: false }
                ].map((item, index) => (
                  <div key={index} className="relative">
                    {/* Tick mark node */}
                    <span className={`absolute -left-9 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                      item.current 
                        ? 'bg-emerald-500 text-zinc-950 border-emerald-400' 
                        : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className={`text-xs font-semibold ${item.current ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {item.title} {item.current && <span className="ml-2 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40">Sedang Berjalan</span>}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Accordion style FAQ for Quick Assistance */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-md">
        <h3 className="font-sans font-medium text-white flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-zinc-400" />
          Pertanyaan Sering Diajukan (FAQ Whitepaper)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="space-y-1 bg-zinc-900/20 p-4.5 rounded-xl border border-zinc-900">
            <span className="font-bold text-white block">Apakah pertambangan ini menguras ram atau data kuota saya?</span>
            <span className="text-zinc-400 block text-[11px]">
              Sama sekali tidak. Algoritma pertambangan berjalan otomatis sepenuhnya di server Cloud Node kami. Anda bahkan bebas menutup tab browser atau mematikan perangkat Anda setelah melakukan 1x klik.
            </span>
          </div>
          <div className="space-y-1 bg-zinc-900/20 p-4.5 rounded-xl border border-zinc-900">
            <span className="font-bold text-white block">Bagaimana dana deposit QRIS dikelola?</span>
            <span className="text-zinc-400 block text-[11px]">
              Setiap dana rupiah dari deposit QRIS dialokasikan langsung untuk menyewa kecepatan hashrate tambahan (boster) regional guna melipatgandakan hasil pertambangan virtual Anda dengan andal.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
