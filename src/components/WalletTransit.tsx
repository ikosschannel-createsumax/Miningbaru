import React, { useState, useEffect } from 'react';
import { Wallet, Settings, ArrowDownRight, RefreshCw, Send, CheckCircle2, CircleDollarSign, ShieldAlert, ListFilter, Lock } from 'lucide-react';
import { MiningConfig, EWalletType, PayoutTransaction } from '../types';
import { formatRupiah, generateCryptoHash } from '../utils';

interface WalletTransitProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

export default function WalletTransit({ config, setConfig, onAddLog }: WalletTransitProps) {
  const [phoneError, setPhoneError] = useState<string>('');
  const [isProcessingManual, setIsProcessingManual] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Auto Payout Simulation Core Effect
  // If Auto-Withdraw is active and the "balancePenampungan" exceeds the specified threshold, 
  // we trigger an automatic transfer from the transit database to the e-wallet.
  useEffect(() => {
    if (config.autoWithdrawActive && config.balancePenampungan >= config.payoutThreshold && config.walletNumber.length >= 9) {
      // Simulate automatic payout trigger
      const timer = setTimeout(() => {
        const withdrawAmount = config.balancePenampungan;
        
        const newTx: PayoutTransaction = {
          id: 'TXN-' + Math.floor(Math.random() * 899999 + 100000),
          timestamp: new Date().toLocaleString('id-ID'),
          amount: withdrawAmount,
          walletType: config.targetEWallet,
          walletNumber: config.walletNumber,
          txHash: '0x' + generateCryptoHash(64),
          status: 'Completed'
        };

        setConfig(prev => ({
          ...prev,
          balancePenampungan: 0,
          balanceEWallet: prev.balanceEWallet + withdrawAmount,
          payoutHistory: [newTx, ...prev.payoutHistory]
        }));

        onAddLog(`[AUTO-WITHDRAW] Pembayaran otomatis terpicu! Mengirimkan ${formatRupiah(withdrawAmount)} ke ${config.targetEWallet} (${config.walletNumber}). Hash transakasi: ${newTx.txHash.substring(0, 16)}...`);
        showTemporarySuccess(`Auto-payout sukses! ${formatRupiah(withdrawAmount)} terkirim.`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [config.balancePenampungan, config.autoWithdrawActive, config.payoutThreshold, config.walletNumber, config.targetEWallet]);

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleWalletNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setConfig(prev => ({ ...prev, walletNumber: val }));
    if (val.length > 0 && val.length < 9) {
      setPhoneError('Nomor HP e-wallet minimal 9 digit angka (contoh: 08123456789)');
    } else {
      setPhoneError('');
    }
  };

  const executeManualWithdraw = () => {
    if (config.walletNumber.length < 9) {
      setPhoneError('Mohon masukkan nomor e-wallet yang valid sebelum melakukan penarikan.');
      return;
    }
    if (config.balancePenampungan <= 0) {
      onAddLog('[WITHDRAW] Penarikan gagal: Saldo di dompet penampungan Anda masih kosong.');
      return;
    }

    setIsProcessingManual(true);
    onAddLog(`[WITHDRAW] Inisiasi penarikan instan senilai ${formatRupiah(config.balancePenampungan)} ke ${config.targetEWallet} sedang diverifikasi...`);

    // Simulate verification
    setTimeout(() => {
      const withdrawAmount = config.balancePenampungan;
      const newTx: PayoutTransaction = {
        id: 'TXN-' + Math.floor(Math.random() * 899999 + 100000),
        timestamp: new Date().toLocaleString('id-ID'),
        amount: withdrawAmount,
        walletType: config.targetEWallet,
        walletNumber: config.walletNumber,
        txHash: '0x' + generateCryptoHash(64),
        status: 'Completed'
      };

      setConfig(prev => ({
        ...prev,
        balancePenampungan: 0,
        balanceEWallet: prev.balanceEWallet + withdrawAmount,
        payoutHistory: [newTx, ...prev.payoutHistory]
      }));

      setIsProcessingManual(false);
      onAddLog(`[WITHDRAW] Penarikan Instan BERHASIL! Saldo bermigrasi aman ke akun ${config.targetEWallet} (${config.walletNumber}).`);
      showTemporarySuccess(`Penarikan instan ${formatRupiah(withdrawAmount)} berhasil dilakukan.`);
    }, 2000);
  };

  const percentageToThreshold = Math.min(100, Math.round((config.balancePenampungan / config.payoutThreshold) * 100));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Portfolios */}
        <div className="lg:col-span-1 space-y-6">
          {/* Imigrasi Holding card */}
          <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-indigo-950/20 to-zinc-950 p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 -m-6 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5 text-indigo-400" />
                Dompet Imigrasi (Penampungan)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-900/40 text-[10px] text-indigo-300 font-mono border border-indigo-800/30">
                Holding Zone
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-sans">Total Saldo Transit</span>
              <div className="text-3xl font-bold text-white tracking-tight font-mono">
                {formatRupiah(config.balancePenampungan)}
              </div>
            </div>

            {/* Clean Progress & Guidance Block */}
            <div className="mt-4 p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 flex flex-col">
              <div className="flex items-center justify-between text-xs font-semibold font-sans text-zinc-300">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Lock className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  Petunjuk Aktivasi Imigrasi
                </span>
                <span className="text-indigo-400 font-mono text-[11px] font-bold">
                  {Math.min(100, Math.round((config.balancePenampungan / 450000) * 100))}%
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
                Setiap hasil penambangan koin Rupiah virtual otomatis ditampung di sini. Sistem imigrasi koin ke E-Wallet tujuan akan terbuka otomatis setelah saldo akun Anda mencapai target.
              </p>

              {/* Progress Bar & Status */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                  <span>Progres Imigrasi:</span>
                  <span className="text-zinc-300 font-bold">{Math.min(100, Math.round((config.balancePenampungan / 450000) * 100))}%</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-1.5 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${Math.min(100, Math.round((config.balancePenampungan / 450000) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-900 space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Verifikasi Transaksi:</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  E2E Enkripsi Aktif
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Koin yang dihasilkan dari penambangan otomatis akan dimasukkan ke dompet penampungan terlebih dahulu untuk diacak energinya melalui enkripsi end-to-end sebelum dikirim.
              </p>
            </div>
          </div>

          {/* Settled E-wallet card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                Sisa Saldo Ter-settle ({config.targetEWallet})
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-zinc-500">Saldo E-Wallet Virtual Anda</span>
              <div className="text-3xl font-bold text-emerald-400 tracking-tight font-mono">
                {formatRupiah(config.balanceEWallet)}
              </div>
            </div>

            <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
              <div className="text-[11px] text-zinc-400">Tujuan Nomor HP:</div>
              <div className="text-xs font-mono text-zinc-300 font-medium tracking-wider">
                {config.walletNumber ? config.walletNumber : '(Nomor e-wallet belum terpasang)'}
              </div>
            </div>
          </div>
        </div>

        {/* Configurations for Payout & Auto-withdraw */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-lg">
          <div className="flex items-center gap-2 pb-3 mb-6 border-b border-zinc-800">
            <Settings className="h-5 w-5 text-indigo-400 animate-spin-slow" />
            <h3 className="font-sans font-semibold text-white">
              Sistem Konfigurasi Penarikan Otomatis (Periodic Auto-Withdraw)
            </h3>
          </div>

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Auto Payout Switch */}
            <div className="flex items-center justify-between bg-zinc-900/50 p-4 border border-zinc-800/80 rounded-xl">
              <div>
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  Aktifkan Auto-Withdraw Berkala
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sistem otomatis mendistribusikan saldo transit e-wallet jika mencapai ambang batas penarikan.
                </p>
              </div>

              <button
                id="btn-toggle-autowithdraw"
                onClick={() => {
                  setConfig(prev => ({ ...prev, autoWithdrawActive: !prev.autoWithdrawActive }));
                  onAddLog(`[AUTO-WITHDRAW] Pembayaran otomatis diperbarui ke status: ${!config.autoWithdrawActive ? 'AKTIF' : 'NON-AKTIF'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  config.autoWithdrawActive ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.autoWithdrawActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Selection profile of target e-wallet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                  Pilih Saluran E-Wallet Lokal
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['DANA', 'GOPAY', 'OVO', 'LINKAJA'] as EWalletType[]).map((wallet) => (
                    <button
                      key={wallet}
                      id={`btn-select-wallet-${wallet}`}
                      onClick={() => {
                        setConfig(prev => ({ ...prev, targetEWallet: wallet }));
                        onAddLog(`[AUTO-WITHDRAW] Mengubah saluran utama penarikan ke: ${wallet}`);
                      }}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-semibold font-mono tracking-tight transition-all duration-200 border ${
                        config.targetEWallet === wallet
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                  Nomor HP E-Wallet Aktif
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={config.walletNumber}
                  onChange={handleWalletNumberChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {phoneError && (
                  <p className="text-[10px] text-red-400 mt-1">{phoneError}</p>
                )}
              </div>
            </div>

            {/* Threshold config & progress indicator */}
            <div className="p-4 bg-zinc-900/30 border border-zinc-800/80 rounded-xl space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-300">Ambang Batas Penarikan Otomatis</span>
                <span className="font-mono text-emerald-400 font-bold">{formatRupiah(config.payoutThreshold)}</span>
              </div>

              <input
                type="range"
                min="10000"
                max="150000"
                step="10000"
                value={config.payoutThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setConfig(prev => ({ ...prev, payoutThreshold: val }));
                }}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Min: Rp 10.000</span>
                <span>Rata-rata default</span>
                <span>Maks: Rp 150.000</span>
              </div>

              {/* Progress to next threshold */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Progresifikasi Penarikan</span>
                  <span>{percentageToThreshold}% ({formatRupiah(config.balancePenampungan)} / {formatRupiah(config.payoutThreshold)})</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${percentageToThreshold}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 italic">
                  *Saat progres menyentuh 100%, sistem dengan aman langsung mengirimkan total saldo penampungan ke akun {config.targetEWallet} tujuan Anda.
                </p>
              </div>
            </div>

            {/* Fast Payout Manual Core Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-2 text-zinc-400">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span className="text-[11px] leading-relaxed">
                  Apakah Anda ingin menarik saldo instan tanpa menunggu ambang batas otomatis?
                </span>
              </div>

              <button
                id="btn-manual-withdraw"
                disabled={isProcessingManual || config.balancePenampungan <= 0 || config.walletNumber.length < 9}
                onClick={executeManualWithdraw}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 font-medium text-xs text-white flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {isProcessingManual ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Menghubungkan Node...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Tarik Instan Saldo Penampungan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement Logs and Transaction Ledger */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
          <h3 className="font-sans font-medium text-white flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-zinc-400" />
            Riwayat Pembayaran Ke E-Wallet (24 Jam Terakhir)
          </h3>
          <span className="text-xs text-zinc-500 font-mono">ID Segel Transaksi</span>
        </div>

        {config.payoutHistory.length === 0 ? (
          <div className="text-center py-8 bg-zinc-950 rounded-xl border border-dashed border-zinc-850">
            <ArrowDownRight className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Belum ada transaksi pengiriman saldo.</p>
            <p className="text-[10px] text-zinc-500 mt-1">Nyalakan miner koin Anda dan atur auto-withdraw untuk memulai migrasi otomatis rupiah Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono font-normal">
                  <th className="py-2 pb-3">ID Transaksi</th>
                  <th className="py-2 pb-3">Waktu</th>
                  <th className="py-2 pb-3">Saluran Penerima</th>
                  <th className="py-2 pb-3">Nomor Tujuan</th>
                  <th className="py-2 pb-3">Jumlah</th>
                  <th className="py-2 pb-3">E2E Cryptographic Hash</th>
                  <th className="py-2 pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {config.payoutHistory.map((tx) => (
                  <tr key={tx.id} className="text-zinc-300 hover:bg-zinc-900/35 transition-colors">
                    <td className="py-3 font-mono text-zinc-400 font-semibold">{tx.id}</td>
                    <td className="py-3 text-zinc-500">{tx.timestamp}</td>
                    <td className="py-3 font-semibold text-white">{tx.walletType}</td>
                    <td className="py-3 font-mono text-zinc-400">{tx.walletNumber}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">{formatRupiah(tx.amount)}</td>
                    <td className="py-3 font-mono text-zinc-600 truncate max-w-[140px] hover:text-indigo-400 cursor-help" title={tx.txHash}>
                      {tx.txHash.substring(0, 18)}...
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 text-[10px] font-sans font-medium border border-emerald-900/30">
                        <CheckCircle2 className="h-3 w-3" />
                        {tx.status}
                      </span>
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
