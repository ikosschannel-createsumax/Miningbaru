import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Send, Share2, Star, Youtube, RefreshCw, CheckCircle2, Award, Zap, Coins } from 'lucide-react';
import { MiningConfig } from '../types';
import { formatRupiah } from '../utils';
import { motion } from 'motion/react';

interface MiningTasksProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

interface UserTask {
  id: string;
  title: string;
  description: string;
  hashReward: number; // in KH/s
  cashReward: number; // in Rupiah
  icon: React.ComponentType<any>;
  actionLabel: string;
  status: 'Ready' | 'Processing' | 'Completed';
  url?: string;
}

export default function MiningTasks({ config, setConfig, onAddLog }: MiningTasksProps) {
  const [tasks, setTasks] = useState<UserTask[]>([
    {
      id: 'task-daily',
      title: 'Absensi Harian Penambang (Daily Check-in)',
      description: 'Absen harian Anda untuk menjaga stabilitas koin node server cloud Anda.',
      hashReward: 0.2,
      cashReward: 500,
      icon: Calendar,
      actionLabel: 'Klaim Absen',
      status: 'Ready'
    },
    {
      id: 'task-telegram',
      title: 'Gabung Channel Telegram Komunitas Resmi',
      description: 'Dapatkan berita pembaruan hashrate, pengumuman server, dan airdrop mingguan.',
      hashReward: 0.5,
      cashReward: 2000,
      icon: Send,
      actionLabel: 'Gabung Grup',
      status: 'Ready',
      url: 'https://t.me/mintdrix'
    },
    {
      id: 'task-whatsapp',
      title: 'Bagikan Tautan Undangan ke WhatsApp Grup',
      description: 'Sebarkan link penambang koin Anda di 3 grup chat WhatsApp penambang lokal.',
      hashReward: 0.3,
      cashReward: 1000,
      icon: Share2,
      actionLabel: 'Bagikan Link',
      status: 'Ready'
    },
    {
      id: 'task-rate',
      title: 'Beri Penilaian Bintang 5 Untuk Aplikasi',
      description: 'Bantu reputasi IDR Secure Node agar terus stabil beroperasi dalam jangka panjang.',
      hashReward: 0.8,
      cashReward: 3500,
      icon: Star,
      actionLabel: 'Beri Bintang 5',
      status: 'Ready'
    },
    {
      id: 'task-youtube',
      title: 'Subscribe YouTube Hub Energi Virtual',
      description: 'Tonton video panduan tutorial mining dan sewa alat hashrate berdaya eco digital.',
      hashReward: 0.4,
      cashReward: 1000,
      icon: Youtube,
      actionLabel: 'Subscribe YouTube',
      status: 'Ready',
      url: 'https://youtube.com/shorts/oH3EA4lPYCc?si=j9pJzEEam0Ez_hGj'
    }
  ]);

  // Load completed tasks statuses from localstorage to ensure persistence for the current user session
  useEffect(() => {
    const savedCompletedStr = localStorage.getItem(`completed_tasks_${config.referralCode}`);
    if (savedCompletedStr) {
      try {
        const completedIds: string[] = JSON.parse(savedCompletedStr);
        setTasks(prev => prev.map(t => {
          if (completedIds.includes(t.id)) {
            return { ...t, status: 'Completed' };
          }
          return t;
        }));
      } catch (e) {
        console.error('Failed to parse completed tasks history', e);
      }
    }
  }, [config.referralCode]);

  const runTaskAction = (task: UserTask) => {
    if (task.status !== 'Ready') return;

    // Open URL in new window/tab if present
    if (task.url) {
      try {
        window.open(task.url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Failed to open task link', e);
      }
    }

    // Set to processing
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'Processing' } : t));
    onAddLog(`[TASK] Memulai pengerjaan tugas "${task.title}"... Menghubungi webhook validator.`);

    // Simulate verification delay
    setTimeout(() => {
      // Award bonuses in mining config
      setConfig(prev => ({
        ...prev,
        baseHashRate: prev.baseHashRate + task.hashReward,
        balanceEWallet: prev.balanceEWallet + task.cashReward
      }));

      // Set to Completed
      setTasks(prev => {
        const updated = prev.map(t => t.id === task.id ? { ...t, status: 'Completed' } : t);
        
        // Save to local persistence
        const completedIdsArr = updated.filter(u => u.status === 'Completed').map(u => u.id);
        localStorage.setItem(`completed_tasks_${config.referralCode}`, JSON.stringify(completedIdsArr));
        
        return updated;
      });

      onAddLog(`[TASK] Tugas "${task.title}" SELESAI! Anda memperoleh bonus kecepatan +${task.hashReward.toFixed(2)} KH/s permanen & tambahan saldo ${formatRupiah(task.cashReward)} terkonkonfirmasi.`);
    }, 2200);
  };

  const getCompletedCount = () => {
    return tasks.filter(t => t.status === 'Completed').length;
  };

  return (
    <div className="space-y-6">
      {/* Editorial tasks banner header */}
      <div className="rounded-2xl border border-teal-900 bg-teal-950/10 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 h-48 w-48 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-950 text-[11px] text-teal-400 font-mono border border-teal-900/40 mb-1">
              <CheckSquare className="h-3.5 w-3.5" />
              Tugas Kontribusi & Misi Tambang
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">
              Selesaikan Misi, Perkuat Jaringan Server Anda
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl leading-relaxed font-sans">
              Butuh percepatan hashrate gratis tanpa belanja sewa hardware? Selesaikan misi sosial kami di bawah untuk menyumbang kestabilan daya node, lalu klaim profit instan langsung masuk e-wallet!
            </p>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col font-mono text-center md:text-right shrink-0">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Misi Terselesaikan</span>
            <span className="text-lg font-bold text-teal-400">{getCompletedCount()} / {tasks.length} Tugas</span>
          </div>
        </div>
      </div>

      {/* Grid displays task cards with micro-feedbacks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const TaskIcon = task.icon;
          return (
            <div
              key={task.id}
              className={`rounded-2xl border bg-zinc-950 p-5 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative group overflow-hidden ${
                task.status === 'Completed'
                  ? 'border-zinc-900/80 bg-zinc-950/40 opacity-75'
                  : 'border-zinc-800 hover:border-teal-500/20'
              }`}
            >
              {/* Completed absolute check stamp */}
              {task.status === 'Completed' && (
                <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] uppercase bg-teal-950/80 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/30">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  SELESAI
                </div>
              )}

              <div className="space-y-3.5">
                <div className={`p-2.5 rounded-xl w-fit ${
                  task.status === 'Completed' ? 'bg-zinc-900 text-zinc-500' : 'bg-teal-950/40 text-teal-400 border border-teal-950/20'
                }`}>
                  <TaskIcon className="h-5 w-5" />
                </div>

                <div className="space-y-1">
                  <h4 className={`text-xs font-bold font-sans group-hover:text-teal-400 transition-colors ${
                    task.status === 'Completed' ? 'line-through text-zinc-500' : 'text-white'
                  }`}>
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Rewards display list */}
              <div className="mt-5 pt-3.5 border-t border-zinc-900 space-y-3">
                <div className="flex justify-between items-center text-[10.5px] font-mono">
                  <span className="text-zinc-500">Hadiah Hashrate:</span>
                  <span className={`font-bold flex items-center gap-1 ${task.status === 'Completed' ? 'text-zinc-500' : 'text-teal-400'}`}>
                    <Zap className="h-3 w-3 shrink-0" />
                    +{task.hashReward.toFixed(1)} KH/s
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10.5px] font-mono pb-1">
                  <span className="text-zinc-500">Hadiah Saldo E-Wallet:</span>
                  <span className={`font-bold flex items-center gap-1 ${task.status === 'Completed' ? 'text-zinc-500' : 'text-emerald-400'}`}>
                    <Coins className="h-3 w-3 shrink-0" />
                    +{formatRupiah(task.cashReward)}
                  </span>
                </div>

                <button
                  id={`btn-task-action-${task.id}`}
                  onClick={() => runTaskAction(task)}
                  disabled={task.status !== 'Ready'}
                  className={`w-full py-2.5 rounded-xl text-[11px] font-extrabold tracking-wider transition-all uppercase flex items-center justify-center gap-1 shadow-sm ${
                    task.status === 'Completed'
                      ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                      : task.status === 'Processing'
                      ? 'bg-zinc-900 text-teal-400'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  {task.status === 'Processing' ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : task.status === 'Completed' ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Klaim Berhasil
                    </>
                  ) : (
                    <>
                      <span>{task.actionLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 flex items-start gap-3 shadow-md lg:max-w-2xl">
        <Award className="h-8 w-8 text-teal-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <span className="text-xs font-bold text-white block">Sertifikat Webhook Otomatis</span>
          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
            Validasi tugas disinkronkan secara online melalui sistem webhook cloud miner kami. Manipulasi status ataupun pengerjaan ganda akan membatalkan status validasi hashrate pada block ledger enkripsi Anda secara otomatis.
          </p>
        </div>
      </div>
    </div>
  );
}
