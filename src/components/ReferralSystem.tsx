import React, { useState } from 'react';
import { Share2, Users, Gift, ArrowRight, UserPlus, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { MiningConfig, ReferredUser } from '../types';
import { formatRupiah, generateRandomIndoName, generateRandomCode } from '../utils';

interface ReferralSystemProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

export default function ReferralSystem({ config, setConfig, onAddLog }: ReferralSystemProps) {
  const [partnerCode, setPartnerCode] = useState<string>('');
  const [partnerMessage, setPartnerMessage] = useState<string>('');
  const [invitedNameInput, setInvitedNameInput] = useState<string>('');

  const claimReferralCode = () => {
    if (!partnerCode.trim()) {
      setPartnerMessage('Mohon masukkan kode yang valid.');
      return;
    }
    if (partnerCode.toUpperCase() === config.referralCode) {
      setPartnerMessage('Anda tidak bisa menggunakan kode referral Anda sendiri.');
      return;
    }
    if (config.referredBy) {
      setPartnerMessage('Anda sudah mengklaim kode referral sebelumnya.');
      return;
    }

    // Set referredby, and boost the miner speeds!
    const updatedMultiplier = config.boostMultiplier + 0.25; // boost 25%
    setConfig(prev => ({
      ...prev,
      referredBy: partnerCode.toUpperCase(),
      boostMultiplier: updatedMultiplier,
      balancePenampungan: prev.balancePenampungan + 2500 // Instant Rp 2500 registration bonus
    }));

    onAddLog(`[REFERRAL] Sukses memasukkan kode referral dari ${partnerCode.toUpperCase()}! Multiplier penambangan naik +25% (Sekarang: x${updatedMultiplier.toFixed(2)}) & bonus isi dompet Rp 2.500 diperoleh.`);
    setPartnerMessage('Sukses! Bonus Rp 2.500 ditambahkan dan bonus koin dipercepat.');
    setPartnerCode('');
  };

  const simulateNewReferralGroup = (name?: string) => {
    const friendName = name || invitedNameInput.trim() || generateRandomIndoName();
    const newFriendCode = generateRandomCode(8);
    
    const newFriend: ReferredUser = {
      id: 'REF-' + newFriendCode,
      username: friendName,
      joinedAt: new Date().toLocaleDateString('id-ID'),
      hashRateBonus: 0.5, // 0.5 KH/s hash power boost
      status: 'Active'
    };

    // Calculate rate
    const updatedBase = config.baseHashRate + 0.5;
    const updatedMultiplier = config.boostMultiplier + 0.15; // +15% boost per referral invited

    setConfig(prev => ({
      ...prev,
      baseHashRate: updatedBase,
      boostMultiplier: updatedMultiplier,
      referrals: [newFriend, ...prev.referrals]
    }));

    onAddLog(`[REFERRAL] Teman baru bergabung! ${friendName} telah mendaftar menggunakan kode Anda ${config.referralCode}. Kecepatan dasar bertambah +0.5 KH/s dan multiplier naik +15%.`);
    setInvitedNameInput('');
  };

  const totalReferralPowerBoost = (config.referrals.filter(r => r.status === 'Active').length * 0.5).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Referral Top Intro Box */}
      <div className="rounded-2xl border border-zinc-850 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/20 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-center">
          <div className="md:col-span-2 space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/30 text-xs text-indigo-300 font-mono">
              <Gift className="h-3.5 w-3.5" />
              Program Pertumbuhan Koin IDR-Secure
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Undang Teman, Lipat Gandakan Pendapatan Koin Anda
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              Setiap kali teman mendaftar menggunakan kode referral unik Anda, Anda mendapatkan tambahan kecepatan mining permanen <strong>+0.5 KH/s Bergaransi</strong> beserta bonus multiplier pendapatan koin.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 space-y-3">
            <div className="text-xs text-zinc-500 uppercase tracking-wider font-mono">
              Kode Referral Anda
            </div>
            <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg">
              <span className="text-lg font-mono font-extrabold text-white tracking-widest">
                {config.referralCode}
              </span>
              <button
                id="btn-copy-referral-code"
                onClick={() => {
                  navigator.clipboard.writeText(config.referralCode);
                  onAddLog(`[REFERRAL] Menyalin kode referral Anda (${config.referralCode}) ke clipboard.`);
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Salin Kode
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 text-center italic">
              Bagikan ke WhatsApp, Telegram atau Media Sosial
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fill Partner Referral / Simulated New Registrations */}
        <div className="rounded-2xl border border-zinc-850 bg-zinc-950 p-6 space-y-6 shadow-md">
          {/* Apply referral partner */}
          <div className="space-y-3">
            <h3 className="font-sans font-semibold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" />
              Klaim Kode Referral Pengundang
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dapatkan bonus pendaftaran instan senilai <strong>Rp 2.500</strong> secara cuma-cuma dan meningkatkan multiplier penambangan Anda sebanyak <strong>+25%</strong> secara permanen.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={8}
                placeholder="Masukkan Kode Referral Teman"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                disabled={!!config.referredBy}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition-colors uppercase font-mono tracking-widest w-full"
              />
              <button
                id="btn-claim-referral"
                onClick={claimReferralCode}
                disabled={!!config.referredBy || !partnerCode}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-605 px-4 py-2 rounded-lg font-medium text-xs text-white transition-colors flex items-center gap-1 shrink-0"
              >
                Klaim
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {config.referredBy && (
              <div className="p-3 bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Anda terhubung di jaringan pengguna pengundang: <strong>{config.referredBy}</strong></span>
              </div>
            )}

            {partnerMessage && !config.referredBy && (
              <p className="text-xs font-mono text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {partnerMessage}
              </p>
            )}
          </div>
        </div>

        {/* Referred Friends Ledger and power counts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-md">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-sans font-medium text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-400" />
                Jejaring Teman Bergabung ({config.referrals.length})
              </h3>
              <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                <Zap className="h-3 w-3 text-amber-500" />
                <span>+ {totalReferralPowerBoost} KH/s</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {config.referrals.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-zinc-500">Belum ada teman yang bergabung.</p>
                  <p className="text-[10px] text-zinc-650 mt-1">Bagikan kode referral unik Anda di atas ke teman Anda untuk menguji sistem pertumbuhan koin Anda.</p>
                </div>
              ) : (
                config.referrals.map((friend) => (
                  <div key={friend.id} className="flex justify-between items-center p-2.5 rounded-lg bg-zinc-900 border border-zinc-850/80">
                    <div>
                      <div className="text-xs font-semibold text-white">{friend.username}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">ID: {friend.id} • Gabung: {friend.joinedAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        +{friend.hashRateBonus.toFixed(1)} KH/s
                      </div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-emerald-950 text-[9px] text-emerald-400 uppercase font-mono">
                        {friend.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 mt-4 text-[10px] text-zinc-500 space-y-1">
            <div>Aturan Multiplier:</div>
            <div>• Kode referral berhasil diklaim: +25% Multiplier Pendapataran.</div>
            <div>• Setiap kontak mendaftar: +0.5 KH/s ke kecepatan dasar & +15% multiplier pendanaan.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
