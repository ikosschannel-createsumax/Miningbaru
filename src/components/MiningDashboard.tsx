import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Zap, Activity, Play, Pause, AlertTriangle, ArrowUpRight, ShieldCheck, Database } from 'lucide-react';
import { MiningConfig, MiningLog } from '../types';
import { formatRupiah, generateCryptoHash } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface MiningDashboardProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

export default function MiningDashboard({ config, setConfig, onAddLog }: MiningDashboardProps) {
  const [recentBlocks, setRecentBlocks] = useState<MiningLog[]>([]);
  const [cpuLoad, setCpuLoad] = useState<number>(34);
  const [temperature, setTemperature] = useState<number>(41);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [percentLeft, setPercentLeft] = useState<number>(100);
  const blockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blockHeightRef = useRef<number>(842100);

  // Initialize some blocks for context
  useEffect(() => {
    const initialBlocks: MiningLog[] = [];
    let height = 842100;
    for (let i = 0; i < 4; i++) {
      initialBlocks.push({
        timestamp: new Date(Date.now() - (i * 25000)).toLocaleTimeString('id-ID'),
        blockHeight: height - i,
        nonce: Math.floor(Math.random() * 999999),
        hash: '00000000' + generateCryptoHash(56),
        reward: Math.floor(25 + Math.random() * 15),
        algorithm: 'X11-IDR-Secure',
      });
    }
    setRecentBlocks(initialBlocks);
  }, []);

  // Set up 24h background mining simulator tick
  useEffect(() => {
    if (config.isMiningActive) {
      statsTimerRef.current = setInterval(() => {
        // Fluctuating stats
        setCpuLoad(prev => Math.min(95, Math.max(15, prev + (Math.random() * 10 - 5))));
        setTemperature(prev => Math.min(85, Math.max(38, prev + (Math.random() * 4 - 2))));
      }, 3000);

      // Average mining interval based on hash rate
      const intervalMs = Math.max(1000, 4000 - (config.baseHashRate * config.boostMultiplier * 150));
      blockTimerRef.current = setInterval(() => {
        // Calculate reward
        const calculatedMultiplier = config.boostMultiplier;
        const rewardBase = 12; // Rp base coin
        const actualReward = Math.round(rewardBase * (1 + (config.baseHashRate / 20)) * calculatedMultiplier);

        const nextHeight = blockHeightRef.current + 1;
        blockHeightRef.current = nextHeight;

        const newBlock: MiningLog = {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          blockHeight: nextHeight,
          nonce: Math.floor(Math.random() * 999999),
          hash: '00000000' + generateCryptoHash(56),
          reward: actualReward,
          algorithm: 'X11-IDR-Secure',
        };

        setRecentBlocks(prev => [newBlock, ...prev.slice(0, 5)]);

        // Push into wallet transit balance & total mined
        setConfig(prev => {
          const newPenampungan = prev.balancePenampungan + actualReward;
          const newTotal = prev.totalMined + actualReward;
          return {
            ...prev,
            balancePenampungan: newPenampungan,
            totalMined: newTotal,
          };
        });

        onAddLog(`[MINER] Blok #${newBlock.blockHeight} terjaring dengan hash ${newBlock.hash.substring(0, 16)}... Reward ${formatRupiah(actualReward)} dimasukkan ke Dompet Penampungan.`);
      }, intervalMs);
    } else {
      if (blockTimerRef.current) clearInterval(blockTimerRef.current);
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    }

    return () => {
      if (blockTimerRef.current) clearInterval(blockTimerRef.current);
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
  }, [config.isMiningActive, config.baseHashRate, config.boostMultiplier]);

  // Handle 24-hour countdown loop
  useEffect(() => {
    const updateCountdown = () => {
      if (!config.isMiningActive || !config.miningSessionExpiry) {
        setTimeLeft('');
        setPercentLeft(0);
        return;
      }

      const expiry = config.miningSessionExpiry;
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        // Session expired! Auto-terminate!
        setTimeLeft('Sesi Habis (Daluwarsa)');
        setPercentLeft(0);
        setConfig(prev => ({
          ...prev,
          isMiningActive: false,
          miningSessionExpiry: undefined
        }));
        onAddLog('[MINER] Sesi pertambangan otomatis 24 jam telah berakhir. Kembali esok hari dan silakan klik tombol "Mulai Mining 24 Jam" untuk mengaktifkan sesi penambangan baru.');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, '0');
        setTimeLeft(`${pad(hours)} jam ${pad(minutes)} menit ${pad(seconds)} detik`);

        const totalDuration = 24 * 60 * 60 * 1000;
        const progress = Math.min(100, Math.max(0, (diff / totalDuration) * 100));
        setPercentLeft(progress);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.isMiningActive, config.miningSessionExpiry, setConfig, onAddLog]);

  const toggleMining = () => {
    setConfig(prev => {
      const nextActive = !prev.isMiningActive;
      const expiry = nextActive ? Date.now() + 24 * 60 * 60 * 1000 : undefined;
      const nowTime = nextActive ? Date.now() : undefined;
      onAddLog(nextActive 
        ? '[MINER] Menghubungkan ke Pool IDR-Secure... Sesi aman 24 jam diaktifkan. Silakan kembali esok hari setelah waktu sesi habis untuk melanjutkan penambangan.' 
        : '[MINER] Penambangan dinonaktifkan sementara oleh pengguna.'
      );
      return { 
        ...prev, 
        isMiningActive: nextActive, 
        miningSessionExpiry: expiry,
        lastMinedAt: nowTime
      };
    });
  };

  const currentTotalHashPower = (config.baseHashRate * config.boostMultiplier).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Mining Control Console */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2.5 w-2.5 rounded-full ${config.isMiningActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                {config.isMiningActive ? '24/7 Penambangan Aktif' : 'Penambangan Berhenti'}
              </span>
            </div>
            <h2 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              Crypto Core IDR-Secure Miner
            </h2>
            <p className="text-sm text-zinc-400 max-w-lg mt-1">
              Menyeimbangkan algoritma enkripsi end-to-end lokal untuk memecahkan hash koin Rupiah virtual di latar belakang perangkat Anda secara efisien.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-miner"
              onClick={toggleMining}
              className={`flex items-center gap-3 px-6 py-3.5 rounded-xl font-medium tracking-wide transition-all duration-300 shadow-md ${
                config.isMiningActive
                  ? 'bg-zinc-800 text-red-400 hover:bg-zinc-700 hover:text-red-300 border border-zinc-700'
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold'
              }`}
            >
              {config.isMiningActive ? (
                <>
                  <Pause className="h-5 w-5" />
                  Hentikan Mining
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-zinc-950" />
                  Mulai Mining 24 Jam
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modern 24-Hour Countdown Timer and Instructions */}
        {config.isMiningActive && config.miningSessionExpiry && (
          <div className="mt-6 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Sesi Berjalan Otomatis (24 Jam)
              </span>
              <span className="text-xs font-mono font-medium text-white bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-850">
                Sisa Sesi: <span className="text-emerald-400 font-bold">{timeLeft || 'Menghitung...'}</span>
              </span>
            </div>
            
            {/* Dynamic Progress Bar */}
            <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
              <motion.div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: `${percentLeft}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              💡 <strong>Petunjuk Pertambangan:</strong> Penambangan ini berjalan otomatis penuh di server Cloud Node kami dengan cukup <strong>1x klik</strong>. Hari esok ketika waktu sesi di atas habis (00:00:00), Anda cukup kembali ke aplikasi ini untuk memicu sesi penambangan 24 jam baru agar akumulasi koin di penampungan berjalan lancar.
            </p>
          </div>
        )}



        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800">
          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2 text-zinc-500">
              <span className="text-xs">Kecepatan Gabungan</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-mono font-semibold text-white">
              {currentTotalHashPower} <span className="text-xs text-zinc-400 font-sans">KH/s</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
              <span>Dasar: {config.baseHashRate} KH/s</span>
              <span>•</span>
              <span className="text-emerald-400">Ref: x{config.boostMultiplier.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2 text-zinc-500">
              <span className="text-xs">Dompet Penampungan</span>
              <Database className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-xl font-semibold text-emerald-400 font-mono">
              {formatRupiah(config.balancePenampungan)}
            </div>
            <div className="text-[10px] text-zinc-500 font-sans mt-1">
              Imigrasi Penampungan Sementara
            </div>
          </div>

          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2 text-zinc-500">
              <span className="text-xs">CPU / Perangkat Load</span>
              <Cpu className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-semibold text-white">
              {config.isMiningActive ? `${cpuLoad.toFixed(1)}%` : '0.0%'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className={cpuLoad > 80 ? 'text-red-400' : 'text-zinc-500'}>
                {cpuLoad > 80 ? 'Beban Tinggi' : 'Beban Ringan (Aman)'}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="flex items-center justify-between mb-2 text-zinc-500">
              <span className="text-xs">Suhu Perangkat</span>
              <Activity className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-xl font-mono font-semibold text-white">
              {config.isMiningActive ? `${temperature.toFixed(1)}°C` : 'Suhu Kamar'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Optimal &lt; 85°C
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Mining Board & Hashing Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Algorithm Status */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-lg">
          <h3 className="font-sans font-medium text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Security Shield Engine
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Algoritma pertambangan IDR menggunakan standar enkripsi <strong>AES-256</strong> dipasangkan dengan 24-hour verification block hashes untuk mendeteksi transaksi parasit.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500">Protokol:</span>
              <span className="text-white">IDR-AES-SHA2</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500">Pool Node:</span>
              <span className="text-emerald-400">Jakarta-Core-1</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              <span className="text-zinc-500">Mined Lifetime:</span>
              <span className="text-white">{formatRupiah(config.totalMined)}</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl text-xs space-y-1 text-zinc-400">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
              Informasi Mining 24 Jam
            </div>
            Aplikasi mensimulasikan penambangan awan 24 jam. Walaupun tab ditutup, dompet penampungan Anda aman dalam inkubasi migrasi saldo.
          </div>
        </div>

        {/* Live Block Rewards (The transit ledger) */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="font-sans font-medium text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-400" />
                Ledger Blok Terakhir di-Mined (24 Jam)
              </h3>
              <span className="text-xs font-mono text-zinc-500">Real-time Feed</span>
            </div>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              <AnimatePresence>
                {recentBlocks.map((block) => (
                  <motion.div
                    key={block.blockHeight}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono font-medium text-zinc-300">
                          Blok {block.blockHeight}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {block.timestamp}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-zinc-400 truncate max-w-[280px] sm:max-w-md">
                        Hash: <span className="text-zinc-500">{block.hash}</span>
                      </div>
                    </div>

                    <div className="text-right mt-2 sm:mt-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                      <span className="text-xs text-zinc-500 sm:hidden">Reward</span>
                      <span className="text-sm font-semibold text-emerald-400 font-mono flex items-center gap-1">
                        +{formatRupiah(block.reward)}
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500">
            <span>Sollusi Hash Aktif: <strong>AES-256 Cryptographic Secure Node</strong></span>
            <span>Up-to-date</span>
          </div>
        </div>
      </div>
    </div>
  );
}
