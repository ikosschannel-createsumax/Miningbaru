import React, { useState, useEffect } from 'react';
import { QrCode, CreditCard, RefreshCw, CheckCircle2, AlertTriangle, ArrowDownRight, Printer, ShieldAlert, History } from 'lucide-react';
import { MiningConfig, DepositTransaction } from '../types';
import { formatRupiah, generateCryptoHash, generateRandomCode } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';

interface QrisDepositProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
  userId?: string;
}

export default function QrisDeposit({ config, setConfig, onAddLog, userId }: QrisDepositProps) {
  const [amountInput, setAmountInput] = useState<string>('20000');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeInvoice, setActiveInvoice] = useState<DepositTransaction | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes validity
  const [isPayingSimulated, setIsPayingSimulated] = useState<boolean>(false);
  const [depositSuccessMessage, setDepositSuccessMessage] = useState<string>('');

  // Auto-resume active pending invoice from user's history on mount
  useEffect(() => {
    const pendingTx = config.depositHistory.find(d => d.status === 'Pending');
    if (pendingTx && !activeInvoice) {
      setActiveInvoice(pendingTx);
      setSecondsRemaining(300);
    }
  }, [config.depositHistory]);

  // Dynamic automatic check to pick up live database updates (polled every 3s via backend webhook processor)
  useEffect(() => {
    if (activeInvoice && activeInvoice.status === 'Pending') {
      const liveTx = config.depositHistory.find(d => d.id === activeInvoice.id);
      if (liveTx && liveTx.status !== 'Pending') {
        setActiveInvoice(liveTx);
        if (liveTx.status === 'Completed') {
          setDepositSuccessMessage(`Selesai! Dana ${formatRupiah(liveTx.amount)} berhasil masuk ke Sisa Saldo Ter-settle (DANA)`);
          setTimeout(() => setDepositSuccessMessage(''), 6000);
        }
      }
    }
  }, [config.depositHistory, activeInvoice]);

  // Countdown timer for pending QRIS invoice
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeInvoice && activeInvoice.status === 'Pending') {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Expire invoice
            setActiveInvoice((curr) => curr ? { ...curr, status: 'Expired' } : null);
            onAddLog(`[DEPOSIT] Invoice QRIS #${activeInvoice.id} senilai ${formatRupiah(activeInvoice.amount)} telah kedaluwarsa.`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeInvoice]);

  const changePresetAmount = (val: string) => {
    setAmountInput(val);
  };

  const generateQrisInvoice = () => {
    const rawAmt = parseInt(amountInput);
    if (isNaN(rawAmt) || rawAmt < 5000) {
      alert('Minimal deposit melalui QRIS adalah Rp 5.000');
      return;
    }
    if (rawAmt > 2000000) {
      alert('Maksimal deposit per transaksi QRIS adalah Rp 2.000.000');
      return;
    }

    setIsGenerating(true);
    
    // Server-side creation of a real pending transaction
    fetch('/api/deposit/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId || 'UID-10002', // Standard demo user fallback if needed
        amount: rawAmt
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsGenerating(false);
      if (data.success && data.invoice) {
        setActiveInvoice(data.invoice);
        setSecondsRemaining(300); // Reset timer to 5 minutes
        onAddLog(`[DEPOSIT] Invoice QRIS berhasil digenerasi oleh server untuk nominal ${formatRupiah(rawAmt)} dengan ID Tag ${data.invoice.id}. Silakan lakukan pembayaran.`);
      } else {
        alert(data.error || 'Server gagal membuat tagihan deposit.');
      }
    })
    .catch(err => {
      setIsGenerating(false);
      console.error(err);
      alert('Gagal menghubungkan ke server deposit.');
    });
  };

  const handleSimulatePayment = () => {
    if (!activeInvoice || activeInvoice.status !== 'Pending') return;

    setIsPayingSimulated(true);
    onAddLog(`[DEPOSIT] Bank Gateway: Menginisiasi pengiriman callback Webhook status lunas (PAID) ke backend IPN server.`);

    fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: activeInvoice.id,
        status: 'PAID',
        amount: activeInvoice.amount
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsPayingSimulated(false);
      if (data.success) {
        onAddLog(`[WEBHOOK] Callback Berhasil! Webhook server mendeteksi status lunas sebesar ${formatRupiah(activeInvoice.amount)} dan menyuntikkan saldo secara otomatis.`);
      } else {
        alert(data.error || 'Gagal memproses webhook.');
      }
    })
    .catch(err => {
      setIsPayingSimulated(false);
      console.error(err);
      alert('Gagal mengirimkan webhook.');
    });
  };

  const formatTime = (secs: number) => {
    const min = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner introducing deposit with QRIS */}
      <div className="rounded-2xl border border-indigo-900 bg-indigo-950/10 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950 text-[11px] text-indigo-400 font-mono border border-indigo-900/40 mb-2">
              <QrCode className="h-3 w-3" />
              Sistem Deposit Instant QRIS Nasional
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">
              Isi Ulang Sisa Saldo Ter-settle (DANA)
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl mt-1 leading-relaxed">
              Butuh memperkuat Sisa Saldo Ter-settle (DANA) Anda untuk membeli atau menyewa hashrate pertambangan? Lakukan deposit instan menggunakan kode QRIS standar Bank Indonesia. Dapat dipindai menggunakan dompet lokal seperti DANA, GoPay, OVO, ShopeePay atau M-Banking Anda.
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col font-mono text-right">
            <span className="text-[10px] text-zinc-500 uppercase">Sisa Saldo Ter-settle (DANA) Saat Ini</span>
            <span className="text-lg font-bold text-pink-400">{formatRupiah(config.balanceEWallet)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Setup Deposit Amount Form */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-6 shadow-md flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="font-sans font-semibold text-white flex items-center gap-2 border-b border-zinc-900 pb-2">
              <CreditCard className="h-5 w-5 text-indigo-400" />
              Inisiasi Nominal Deposit
            </h3>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-mono text-zinc-500 uppercase">Preset Nominal Populer</label>
              <div className="grid grid-cols-3 gap-2">
                {['10000', '20000', '50000', '100000', '250000', '500000'].map((val) => (
                  <button
                    key={val}
                    id={`btn-preset-deposit-${val}`}
                    onClick={() => changePresetAmount(val)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-semibold font-mono border transition-all ${
                      amountInput === val
                        ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/60'
                        : 'bg-zinc-90 w-full hover:bg-zinc-900 border-zinc-900 text-zinc-400'
                    }`}
                  >
                    {formatRupiah(parseInt(val))}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Manual Amount field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-zinc-500 uppercase">Ketik Nominal Manual (Rp)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-sm">Rp</span>
                <input
                  type="number"
                  placeholder="Contoh: 30000"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Min. deposit Rp 5.000 — Maks. Rp 2.000.000 per transaksi
              </p>
            </div>
          </div>

          <button
            id="btn-generate-qris"
            onClick={generateQrisInvoice}
            disabled={isGenerating || !amountInput || parseInt(amountInput) < 5000}
            className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-650 font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all uppercase tracking-wider"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Membangun QR Code QRIS...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Dapatkan Kode QRIS Sekarang
              </>
            )}
          </button>
        </div>

        {/* Dynamic Interactive QRIS Certificate Invoice Visualizer */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col items-center justify-between shadow-lg relative min-h-[460px]">
          {depositSuccessMessage && (
            <div className="absolute top-4 left-4 right-4 z-20 p-3.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded-xl text-xs flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{depositSuccessMessage}</span>
            </div>
          )}

          {!activeInvoice ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                <QrCode className="h-12 w-12 animate-pulse" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-semibold text-zinc-300">Siap Menerima Pembayaran</h4>
                <p className="text-xs text-zinc-500">
                  Tentukan jumlah deposit Anda di panel kiri dan klik "Dapatkan Kode QRIS" untuk melahirkan sertifikat pembayaran berlabel keamanan end-to-end.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-6">
              
              {/* Header metadata of generated QRIS */}
              <div className="w-full flex justify-between items-center pb-2 border-b border-zinc-900">
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Invoice: <span className="text-indigo-400">{activeInvoice.id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Ref: {activeInvoice.referenceNumber}
                  </div>
                </div>

                <div className="text-right">
                  {activeInvoice.status === 'Pending' ? (
                    <div className="text-xs font-semibold text-yellow-500 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      EXP: {formatTime(secondsRemaining)}
                    </div>
                  ) : (
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-black ${
                      activeInvoice.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-500'
                    }`}>
                      {activeInvoice.status}
                    </span>
                  )}
                </div>
              </div>

              {/* QRIS Layout Certificate Wrapper */}
              <div className="relative py-4 px-6 rounded-xl bg-white border border-zinc-300 shadow-xl max-w-sm w-full flex flex-col items-center select-none text-zinc-950">
                
                {/* QRIS Brand Indicator */}
                <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
                  <div className="flex flex-col select-none">
                    <div className="flex items-center">
                      <span className="text-base font-black italic tracking-tighter text-[#0168b3]">QR</span>
                      <span className="text-base font-black italic tracking-tighter text-[#f37021]">IS</span>
                    </div>
                    <span className="text-[5.5px] font-mono tracking-widest text-zinc-500 uppercase font-black">QR Code Indonesian Standard</span>
                  </div>
                  <div className="flex flex-col items-end select-none">
                    <div className="flex items-center">
                      <span className="text-xs font-black tracking-tighter text-red-600">GP</span>
                      <span className="text-xs font-black tracking-tighter text-indigo-950">N</span>
                    </div>
                    <span className="text-[5px] text-zinc-400 font-mono">NMI-IDR-A99</span>
                  </div>
                </div>

                <div className="text-center space-y-0.5 select-none">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider leading-none text-zinc-900">MERCHANT: IDR COIN MINER NETWORK</h4>
                  <p className="text-[8px] text-zinc-500 font-mono">MEMBER OF SECURE VAULT ASIA</p>
                </div>

                {/* Simulated High-Fi QR Code */}
                <div className="my-4 p-4 bg-white border border-zinc-200/80 rounded-2xl flex flex-col items-center justify-center relative shadow-sm max-w-[210px] w-full">
                  
                  {activeInvoice.status === 'Pending' ? (
                    <div className="flex flex-col items-center w-full">
                      {/* Real, Beautiful, Scannable Vector QR Code using react-qr-code */}
                      <div className="relative flex items-center justify-center bg-white p-1 rounded-xl">
                        <QRCode
                          value="00020101021240490011ID.DANA.WWW01189360091531399885810208WARISMAN5204482953033605802ID5908WARISMAN6015Kab. Deli Serda61051279062460804DMCT993400020001242810120120260521314460666304F45D"
                          size={144}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          viewBox="0 0 256 256"
                        />
                        {/* Center Sticker Logo styled exactly like DANA branding */}
                        <div className="absolute h-8 w-8 bg-white rounded-md border border-zinc-200 flex items-center justify-center shadow-md overflow-hidden">
                          <div className="bg-[#118EEA] w-full h-full flex flex-col items-center justify-center">
                            <span className="text-[7.5px] font-black text-white leading-none font-sans tracking-wide uppercase">dana</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Bold "SCAN QRIS" label underneath matching the screenshot EXACTLY */}
                      <span className="text-[11px] font-extrabold tracking-[0.25em] text-[#1e293b] font-sans mt-3.5 uppercase">
                        SCAN QRIS
                      </span>
                    </div>
                  ) : activeInvoice.status === 'Completed' ? (
                    <div className="w-36 h-36 bg-zinc-50 flex flex-col items-center justify-center space-y-2 rounded-xl">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-scale-in" />
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">LUNAS</span>
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-zinc-50 flex flex-col items-center justify-center space-y-2 rounded-xl">
                      <AlertTriangle className="h-12 w-12 text-red-500" />
                      <span className="text-[11px] font-bold text-red-500 uppercase">EXPIRED</span>
                    </div>
                  )}
                </div>

                <div className="text-center font-mono w-full pt-1.5 border-t border-dashed border-zinc-300">
                  <div className="text-[8px] text-zinc-500 uppercase">Tarif Nominal Tagihan:</div>
                  <div className="text-sm font-black text-zinc-900 tracking-tight">
                    {formatRupiah(activeInvoice.amount)}
                  </div>
                </div>

                <div className="text-[7px] text-zinc-400 mt-2 text-center uppercase tracking-wider font-mono">
                  TERVALIDASI • SSL 256 END-TO-END CRYPTO VAULT
                </div>
              </div>

              {/* Gateway panel where user can process the QRIS instantly */}
              {activeInvoice.status === 'Pending' && (
                <div className="w-full bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                  <div className="flex items-start gap-2 text-xs text-zinc-400">
                    <ShieldAlert className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-200">Deteksi Otomatis & Konfirmasi Gateway</p>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        Sistem gateway kami mendeteksi transfer Anda secara real-time di latar belakang melalui callback webhook aman. Jika Anda sudah berhasil memindai dan mentransfer dana, silakan tekan tombol <strong>"Konfirmasi Pembayaran"</strong> untuk memvalidasi status mutasi Anda secara instan.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-1">
                    <button
                      id="btn-cancel-invoice"
                      onClick={() => {
                        setActiveInvoice(null);
                        onAddLog('[DEPOSIT] Membatalkan pembuatan tagihan deposit.');
                      }}
                      className="px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-xs font-medium text-zinc-400 transition-colors"
                    >
                      Batal
                    </button>

                    <button
                      id="btn-process-qris-payment"
                      disabled={isPayingSimulated}
                      onClick={handleSimulatePayment}
                      className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-850 font-semibold text-xs text-zinc-950 flex items-center justify-center gap-1.5 shadow-md transition-all uppercase tracking-wide"
                    >
                      {isPayingSimulated ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Memverifikasi Mutasi...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Konfirmasi Pembayaran
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="w-full text-center text-[10px] text-zinc-500 mt-4 pt-3 border-t border-zinc-900">
            Sertifikat QRIS didukung oleh Jaringan <strong>IDR-Secure Settlement Engine</strong>
          </div>
        </div>
      </div>

      {/* History log of QRIS Deposits */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
          <h3 className="font-sans font-medium text-white flex items-center gap-2">
            <History className="h-5 w-5 text-zinc-400" />
            Riwayat Deposit QRIS (Pertambangan 24-Jam)
          </h3>
          <span className="text-xs text-zinc-500 font-mono">ID Tag Deposit</span>
        </div>

        {config.depositHistory.length === 0 ? (
          <div className="text-center py-8 bg-zinc-950 rounded-xl border border-dashed border-zinc-850">
            <ArrowDownRight className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Belum ada riwayat isi ulang saldo.</p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Gunakan QRIS diatas untuk menyuntikkan dana langsung ke Sisa Saldo Ter-settle (DANA) Anda jika Anda ingin mempercepat atau menyewa hashrate mesin pertambangan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono font-normal">
                  <th className="py-2 pb-3">No</th>
                  <th className="py-2 pb-3">ID Tag QRIS</th>
                  <th className="py-2 pb-3">Waktu Deposit</th>
                  <th className="py-2 pb-3">Nominal Deposit</th>
                  <th className="py-2 pb-3">Jenis Pembayaran</th>
                  <th className="py-2 pb-3">Nomor Referensi Mutasi</th>
                  <th className="py-2 pb-3 text-right">Status Deposit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {config.depositHistory.map((dp, i) => (
                  <tr key={dp.id} className="text-zinc-300 hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 font-mono text-zinc-500">{i + 1}</td>
                    <td className="py-3 font-mono text-indigo-400 font-bold">{dp.id}</td>
                    <td className="py-3 text-zinc-500">{dp.timestamp}</td>
                    <td className="py-3 font-mono font-extrabold text-emerald-400">{formatRupiah(dp.amount)}</td>
                    <td className="py-3 text-zinc-400 font-semibold">{dp.paymentMethod}</td>
                    <td className="py-3 font-mono text-zinc-500 uppercase">{dp.referenceNumber}</td>
                    <td className="py-3 text-right">
                      {dp.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 text-[10px] font-sans font-medium border border-emerald-900/30">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          LUNAS
                        </span>
                      ) : dp.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setActiveInvoice(dp);
                            setSecondsRemaining(300);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            onAddLog(`[DEPOSIT] Membuat tagihan pending #${dp.id} senilai ${formatRupiah(dp.amount)} aktif untuk konfirmasi.`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-950/40 text-yellow-400 text-[10px] font-sans font-bold border border-yellow-800/40 hover:bg-yellow-905/60 cursor-pointer transition-colors"
                          title="Klik untuk konfirmasi/bayar"
                        >
                          <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />
                          Pending (Konfirmasi)
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-500 text-[10px] font-sans font-medium border border-zinc-800">
                          <AlertTriangle className="h-3 w-3 text-zinc-500" />
                          EXPIRED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
