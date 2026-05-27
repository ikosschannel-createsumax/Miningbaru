import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, ArrowRight, ShoppingBag, BatteryCharging, AlertCircle, ShoppingCart, Cpu, Hourglass } from 'lucide-react';
import { MiningConfig } from '../types';
import { formatRupiah } from '../utils';

interface HashrateShopProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

interface MiningRigItem {
  id: string;
  name: string;
  hashPower: number; // in KH/s
  price: number; // in Rupiah (from balanceEWallet)
  efficiency: string;
  description: string;
  durabilityDays: number;
}

export default function HashrateShop({ config, setConfig, onAddLog }: HashrateShopProps) {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Simulated List of Rig Hardware to Lease
  const [rigsList, setRigsList] = useState<MiningRigItem[]>([
    {
      id: 'rig-bronze',
      name: 'Antminer S9 - IDR Lite edition',
      hashPower: 15.0,
      price: 15000,
      efficiency: '88%',
      description: 'Mesin entry-level hemat daya dengan booster akselerasi Cloud. Pemecahan block hash stabil konstan.',
      durabilityDays: 30
    },
    {
      id: 'rig-silver',
      name: 'WhatsMiner M30S - IDR Medium',
      hashPower: 45.0,
      price: 45000,
      efficiency: '94%',
      description: 'Hashrate super stabil tinggi dioptimalkan secara dinamis untuk kolam penambangan regional Asia-Tenggara.',
      durabilityDays: 60
    },
    {
      id: 'rig-gold',
      name: 'AvalonMade 1246 - IDR Extreme Pro',
      hashPower: 150.0,
      price: 100000,
      efficiency: '99%',
      description: 'Sewa rig tingkat industri gaban bertenaga tinggi dengan sistem asimetris terenkripsi 256-bit penuh.',
      durabilityDays: 90
    }
  ]);

  const machineActiveDays = config.machineActiveDays ?? 3;

  const buyHashrateBoost = (rig: MiningRigItem) => {
    if (config.balanceEWallet < rig.price) {
      setErrorMessage(`Saldo ter-settle Anda tidak mencukupi. Anda membutuhkan minimal ${formatRupiah(rig.price)} di e-wallet.`);
      setTimeout(() => setErrorMessage(''), 4000);
      onAddLog(`[SHOP] Gagal menyewa ${rig.name}. Saldo E-Wallet tidak cukup.`);
      return;
    }

    // Deduct from balanceEWallet, add isMiningActive rig rates
    const updatedEWallet = config.balanceEWallet - rig.price;
    const addedHashRate = rig.hashPower;
    
    setConfig(prev => {
      const prevActiveDays = prev.machineActiveDays ?? 3;
      const prevRented = prev.rentedRigs ?? [];
      return {
        ...prev,
        balanceEWallet: updatedEWallet,
        baseHashRate: prev.baseHashRate + addedHashRate,
        machineActiveDays: prevActiveDays + rig.durabilityDays,
        rentedRigs: [...prevRented, rig.id]
      };
    });

    onAddLog(`[SHOP] Sukses membelanjakan saldo settled ${formatRupiah(rig.price)} untuk sewa ${rig.name}! Kecepatan bertambah +${addedHashRate} KH/s.`);
    setSuccessMessage(`Berhasil menyewa ${rig.name}! Kecepatan mining melesat naik +${addedHashRate} KH/s.`);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner introducing Hashrate purchase & rental machine days */}
      <div className="rounded-2xl border border-pink-900 bg-pink-950/10 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-950 text-[11px] text-pink-400 font-mono border border-pink-900/40 mb-2">
              <Zap className="h-3 w-3" />
              Upgrade Hardware Pertambangan IDR
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">
              Belanja Speed Hashrate & Opsi Sewa Mesin Tambang
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl mt-1 leading-relaxed">
              Gunakan sisa saldo Anda yang telah ter-settle di e-wallet untuk menyewa generator hashrate tambahan. Dengan memperbesar daya, pemecahan block hash koin IDR berjalan berlipat kali lebih tangguh 24 jam penuh!
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col font-mono text-right shrink-0">
            <span className="text-[10px] text-zinc-500 uppercase">Sisa Saldo Ter-settle (E-Wallet)</span>
            <span className="text-lg font-bold text-pink-400">{formatRupiah(config.balanceEWallet)}</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-950/30 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-950/20 text-red-400 border border-red-900/30 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Machine Life Stats Grid & Rig catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rig catalog */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-sans font-semibold text-white flex items-center gap-2 border-b border-zinc-900 pb-2 text-sm tracking-wide">
            <ShoppingCart className="h-4 w-4 text-pink-400 animate-pulse" />
            Katalog Hardware Mesin Tambang Tersedia
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rigsList.map((rig) => (
              <div 
                key={rig.id} 
                className="rounded-xl border border-zinc-805 bg-zinc-950 p-4 flex flex-col justify-between hover:border-pink-500/30 transition-all duration-300 relative group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-xs font-sans group-hover:text-pink-400 transition-colors">
                      {rig.name}
                    </h4>
                    <span className="px-1.5 py-0.5 rounded bg-zinc-850 text-[9px] font-mono text-pink-400 font-bold border border-pink-950/30">
                      +{rig.hashPower.toFixed(1)} KH/s
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal">
                    {rig.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-[10px] font-mono border-t border-zinc-900 text-zinc-500">
                    <div className="flex justify-between">
                      <span>Efisiensi:</span>
                      <span className="text-zinc-350 font-bold">{rig.efficiency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durasi Kontrak:</span>
                      <span className="text-indigo-400">{rig.durabilityDays} Hari</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-900 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-zinc-500">Harga Sewa:</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {formatRupiah(rig.price)}
                    </span>
                  </div>

                  <button
                    id={`btn-lease-${rig.id}`}
                    onClick={() => buyHashrateBoost(rig)}
                    className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold tracking-wide transition-all uppercase flex items-center justify-center gap-1 shadow"
                  >
                    Sewa Rig Sekarang
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Machine lifetime metadata active monitor */}
        <div className="lg:col-span-4 rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-5 shadow-md">
          <h3 className="font-sans font-semibold text-white flex items-center gap-2 border-b border-zinc-900 pb-2 text-sm">
            <Cpu className="h-4 w-4 text-emerald-400" />
            Active Machine Life & Telemetry
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Monitor real-time waktu aktif mesin penambangan virtual Anda di bawah. Setiap sewa rig baru memperpanjang masa aktif pertambangan server Anda.
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono uppercase block">Status Mesin</span>
              <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                <span className={`h-2 w-2 rounded-full ${config.isMiningActive ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
                <span>{config.isMiningActive ? 'Bekerja Stabil (24 Jam Mined)' : 'Menunggu Daya Aktif'}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-mono uppercase">Kontrak Day Aktif</span>
                <span className="text-xs text-white font-mono font-bold">{machineActiveDays} Hari Sisa</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-indigo-500" 
                  style={{ width: `${Math.min(100, Math.max(10, (machineActiveDays / 120) * 100))}%` }} 
                />
              </div>
            </div>

            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 space-y-2 text-[10px] text-zinc-400 font-mono">
              <div className="flex justify-between">
                <span>Total Speed Sesi:</span>
                <span className="text-white font-bold">{(config.baseHashRate * config.boostMultiplier).toFixed(2)} KH/s</span>
              </div>
              <div className="flex justify-between">
                <span>Algoritma Rig:</span>
                <span className="text-white">SHA256-IDR-Secure</span>
              </div>
              <div className="flex justify-between">
                <span>Daya Konsumsi (Sewa):</span>
                <span className="text-emerald-400 font-bold">0.05 kW/h (Eco)</span>
              </div>
            </div>

            {config.rentedRigs && config.rentedRigs.length > 0 && (
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-850 space-y-1.5">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold block">📦 RIG AKTIF DI SERVER (DATABASE)</span>
                <div className="space-y-1">
                  {config.rentedRigs.map((rigId, idx) => {
                    const matchedRig = rigsList.find(r => r.id === rigId);
                    return (
                      <div key={idx} className="flex justify-between text-[10px] font-mono p-1 bg-zinc-950/40 rounded border border-zinc-850/40">
                        <span className="text-zinc-300 truncate max-w-[140px]">{matchedRig?.name || 'Sewa Tambahan'}</span>
                        <span className="text-pink-400 font-bold">+{matchedRig?.hashPower.toFixed(1) || '2.5'} KH/s</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 rounded-xl text-[10px] leading-relaxed flex gap-1.5">
            <Hourglass className="h-4 w-4 shrink-0" />
            <span>Masa pertambangan dihitung 24 jam sehari. Ketika kontrak rig kedaluwarsa, hashrate akan kembali ke nilai standar.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
