import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Wallet, Users, KeyRound, Terminal, RotateCcw, Landmark, Clock, QrCode, LogOut, Shield, Zap, FileText, CheckSquare } from 'lucide-react';
import { MiningConfig, UserAccount } from './types';
import { generateKeyPair, generateRandomCode, formatRupiah } from './utils';
import MiningDashboard from './components/MiningDashboard';
import WalletTransit from './components/WalletTransit';
import QrisDeposit from './components/QrisDeposit';
import HashrateShop from './components/HashrateShop';
import ReferralSystem from './components/ReferralSystem';
import SecureLedger from './components/SecureLedger';
import UserAuth from './components/UserAuth';
import AdminPanel from './components/AdminPanel';
import WhitepaperAsset from './components/WhitepaperAsset';
import MiningTasks from './components/MiningTasks';

export default function App() {
  const [activeTab, setActiveTab] = useState<'mining' | 'wallet' | 'deposit' | 'referral' | 'security' | 'admin' | 'shop' | 'whitepaper' | 'tasks'>('mining');
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Local Simulated Users Database State
  const [users, _setUsers] = useState<UserAccount[]>([
    // Admin Account (Indra)
    {
      id: 'UID-10001',
      username: 'admin',
      email: 'admin@idrminer.com',
      passwordHex: 'admin123',
      isAdmin: true,
      joinedAt: '25/5/2026',
      miningConfig: {
        balancePenampungan: 0,
        balanceEWallet: 0,
        totalMined: 0,
        baseHashRate: 15.0, // High starting power for demo admin
        boostMultiplier: 1.0,
        isMiningActive: false,
        referralCode: 'IDR-ADMN',
        referredBy: null,
        referrals: [],
        autoWithdrawActive: false,
        targetEWallet: 'DANA',
        walletNumber: '081211112222',
        payoutThreshold: 10000,
        payoutProgress: 0,
        payoutHistory: [],
        depositHistory: [],
        privateKey: '',
        publicKey: '',
        machineActiveDays: 3,
        rentedRigs: []
      }
    },
    // Standard Demo Account (Joko)
    {
      id: 'UID-10002',
      username: 'jokowow',
      email: 'joko@gmail.com',
      passwordHex: 'user123',
      isAdmin: false,
      joinedAt: '25/5/2026',
      miningConfig: {
        balancePenampungan: 18450, // Starting holding balance so the user immediately perceives progress
        balanceEWallet: 54000, 
        totalMined: 72450,
        baseHashRate: 4.8, 
        boostMultiplier: 1.0,
        isMiningActive: true, 
        referralCode: 'IDR-F7X8',
        referredBy: null,
        referrals: [],
        autoWithdrawActive: true,
        targetEWallet: 'DANA',
        walletNumber: '081298765432',
        payoutThreshold: 50000, 
        payoutProgress: 36,
        payoutHistory: [
          {
            id: 'TXN-842911',
            userId: 'UID-10002',
            username: 'jokowow',
            timestamp: '25/5/2026, 14:12:00',
            amount: 35000,
            walletType: 'DANA',
            walletNumber: '081298765432',
            txHash: '0x3a8b417fcd9e02c59de104a8b7ddf2bb89a19c636f014e3da8f7c9e0cba002ae',
            status: 'Completed'
          }
        ],
        depositHistory: [
          {
            id: 'QRS-41829',
            userId: 'UID-10002',
            username: 'jokowow',
            timestamp: '25/5/2026, 11:05:00',
            amount: 25000,
            paymentMethod: 'QRIS',
            status: 'Completed',
            referenceNumber: 'REF-XZ901248KLPB'
          }
        ],
        privateKey: '',
        publicKey: '',
        machineActiveDays: 3,
        rentedRigs: []
      }
    }
  ]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Central Syncing wrapper that pushes mutations securely to database server REST API
  const setUsers = (value: React.SetStateAction<UserAccount[]>) => {
    _setUsers(prev => {
      const nextUsers = typeof value === 'function' ? (value as any)(prev) : value;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        fetch('/api/users/save-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nextUsers)
        }).catch(err => {
          console.error("Failed to sync database updates with server:", err);
        });
      }, 1500); // 1.5 seconds debounce

      return nextUsers;
    });
  };

  // Current Logged-in Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Computed configuration bound to current session
  const config = currentUser ? currentUser.miningConfig : users[1].miningConfig;

  // Sync state helper to write back config modifications into both session and list
  const setConfig: React.Dispatch<React.SetStateAction<MiningConfig>> = (value) => {
    if (!currentUser) return;

    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const nextConfig = typeof value === 'function' ? value(prevUser.miningConfig) : value;

      // Populate user ownership meta into any new transaction logs automatically
      if (nextConfig.depositHistory) {
        nextConfig.depositHistory = nextConfig.depositHistory.map(d => ({
          ...d,
          userId: d.userId || prevUser.id,
          username: d.username || prevUser.username
        }));
      }
      if (nextConfig.payoutHistory) {
        nextConfig.payoutHistory = nextConfig.payoutHistory.map(p => ({
          ...p,
          userId: p.userId || prevUser.id,
          username: p.username || prevUser.username
        }));
      }

      const updatedUser = {
        ...prevUser,
        miningConfig: nextConfig
      };

      // Propagation via our wrapper automatically triggers server update
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id === prevUser.id) {
          return updatedUser;
        }
        return u;
      }));

      return updatedUser;
    });
  };

  // Real-time synchronization loop to listen for multi-device/multi-browser changes (polled every 3 seconds)
  useEffect(() => {
    let isMounted = true;

    const pullDatabase = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          _setUsers(prevLocalUsers => {
            return data.map((serverUser: UserAccount) => {
              const localUser = prevLocalUsers.find(u => u.id === serverUser.id);
              if (!localUser) return serverUser;

              // Prevent stale data from rolling back currently active mining state or coin statistics
              const localActive = localUser.miningConfig.isMiningActive;
              const serverActive = serverUser.miningConfig.isMiningActive;

              const mergedConfig = {
                ...serverUser.miningConfig,
                isMiningActive: localActive || serverActive,
                miningSessionExpiry: localActive ? localUser.miningConfig.miningSessionExpiry : serverUser.miningConfig.miningSessionExpiry,
                balancePenampungan: Math.max(localUser.miningConfig.balancePenampungan, serverUser.miningConfig.balancePenampungan),
                balanceEWallet: Math.max(localUser.miningConfig.balanceEWallet, serverUser.miningConfig.balanceEWallet),
                totalMined: Math.max(localUser.miningConfig.totalMined, serverUser.miningConfig.totalMined),
                depositHistory: serverUser.miningConfig.depositHistory.length >= localUser.miningConfig.depositHistory.length
                  ? serverUser.miningConfig.depositHistory
                  : localUser.miningConfig.depositHistory,
                payoutHistory: serverUser.miningConfig.payoutHistory.length >= localUser.miningConfig.payoutHistory.length
                  ? serverUser.miningConfig.payoutHistory
                  : localUser.miningConfig.payoutHistory,
              };

              return {
                ...serverUser,
                miningConfig: mergedConfig
              };
            });
          });
        }
      } catch (err) {
        console.warn("Unable to pull database update:", err);
      }
    };

    // Immediate initial sync
    pullDatabase();

    const fetchInterval = setInterval(pullDatabase, 3000);
    return () => {
      isMounted = false;
      clearInterval(fetchInterval);
    };
  }, []);

  // Sync current user session context with pull state updates (e.g., when approved by another device)
  const currentUserId = currentUser?.id;
  useEffect(() => {
    if (!currentUserId) return;
    const match = users.find(u => u.id === currentUserId);
    if (match) {
      setCurrentUser(prev => {
        if (!prev) return null;
        if (JSON.stringify(prev) !== JSON.stringify(match)) {
          return match;
        }
        return prev;
      });
    }
  }, [users, currentUserId]);

  // Log function
  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setSystemLogs(prev => [`[${time}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Set up clock and asymmetric cryptographic node keys on start
  useEffect(() => {
    // Generate asymmetric security keys
    const keys = generateKeyPair();
    
    // Set for our preloaded users
    setUsers(prev => prev.map(u => {
      if (!u.miningConfig.privateKey) {
        return {
          ...u,
          miningConfig: {
            ...u.miningConfig,
            privateKey: keys.privateKey,
            publicKey: keys.publicKey
          }
        };
      }
      return u;
    }));

    // Start system clocks
    setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
    }, 1000);

    // Initial logs showing secure end-to-end setups
    setTimeout(() => {
      addLog('Sistem Keamanan Terenkripsi End-To-End Jaringan diinisiasi... OK.');
      addLog('Menghubungkan ke server imigrasi penampungan koin IDR-Secure... OK.');
      addLog('Menunggu otentikasi pendaftaran maupun masuk pengguna...');
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (currentUser) {
      addLog(`[AUTH] Sesi pengguna ${currentUser.username} ditutup secara aman.`);
    }
    setCurrentUser(null);
    setActiveTab('mining');
  };

  const handleLoginSuccess = (user: UserAccount) => {
    // Synchronize current key pair if empty
    if (!user.miningConfig.privateKey) {
      const keys = generateKeyPair();
      user.miningConfig.privateKey = keys.privateKey;
      user.miningConfig.publicKey = keys.publicKey;
    }
    
    setCurrentUser(user);
    
    // Redirect admin accounts directly to admin panel on login for fast developer inspection
    if (user.isAdmin) {
      setActiveTab('admin');
    } else {
      setActiveTab('mining');
    }
  };

  const clearLogs = () => {
    setSystemLogs([`[${new Date().toLocaleTimeString('id-ID')}] Konsol dibersihkan.`]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-150 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Dynamic Header */}
      <header className="border-b border-zinc-900 bg-zinc-950 sticky top-0 z-50 px-4 sm:px-6 pt-20 pb-5 sm:py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 shadow-md">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                IDR Rupiah Coin Miner
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 font-mono border border-indigo-900/40">
                  Secure Node v2.0
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Aplikasi Penambangan Koin IDR Virtual 24 Jam & Terminal Payout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
            {/* Clock */}
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock className="h-4 w-4 text-zinc-500 animate-pulse" />
              <span className="text-xs font-mono tracking-wider font-semibold">
                {currentTime ? currentTime : 'Memuat Jam...'} WIB
              </span>
            </div>

            {/* Profile Bar with session info */}
            {currentUser ? (
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-zinc-500 font-mono">AKTIF: <strong className="text-indigo-400">{currentUser.username}</strong></span>
                  <span className="text-[9px] uppercase font-mono tracking-wide px-1 rounded bg-zinc-950 text-emerald-400 w-max ml-auto">
                    {currentUser.isAdmin ? 'ADMIN' : 'MEMBER'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] uppercase font-mono text-zinc-500 border border-zinc-900 px-2 py-1 rounded">
                Menunggu Masuk
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      {!currentUser ? (
        /* Render Login & Registration Screens if unauthenticated */
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
          <UserAuth 
            users={users} 
            setUsers={setUsers} 
            onLoginSuccess={handleLoginSuccess} 
            onAddLog={addLog} 
          />
        </main>
      ) : (
        /* Authenticated Core Workspace Dashboard */
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
          
          {/* Dashboard Overall Asset Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-900">
            <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Total Hasil Tambang</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{formatRupiah(config.totalMined)}</span>
              </div>
              <Cpu className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Saldo Dompet Imigrasi</span>
                <span className="text-base font-bold text-indigo-400 font-mono">{formatRupiah(config.balancePenampungan)}</span>
              </div>
              <Wallet className="h-5 w-5 text-indigo-400" />
            </div>

            <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Kecepatan Sesi</span>
                <span className="text-base font-bold text-amber-500 font-mono">
                  {(config.baseHashRate * config.boostMultiplier).toFixed(1)} KH/s
                </span>
              </div>
              <Users className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          {/* Navigation Tabs bar */}
          <div className="flex border-b border-zinc-900 text-sm overflow-x-auto scrollbar-hide">
            
            {/* Admin-only Panel routing button */}
            {currentUser.isAdmin && (
              <button
                id="tab-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                  activeTab === 'admin'
                    ? 'border-rose-500 text-rose-400 font-bold bg-rose-950/5'
                    : 'border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                <Shield className="h-4 w-4" />
                Panel Admin (Otorisasi)
              </button>
            )}

            <button
              id="tab-mining"
              onClick={() => setActiveTab('mining')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'mining'
                  ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Cpu className="h-4 w-4" />
              Pertambangan 24-Jam
            </button>

            <button
              id="tab-shop"
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'shop'
                  ? 'border-pink-500 text-pink-400 font-semibold bg-pink-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="h-4 w-4" />
              Sewa & Beli Hashrate
            </button>

            <button
              id="tab-wallet"
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'wallet'
                  ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Wallet className="h-4 w-4" />
              Dompet Penampungan
            </button>

            <button
              id="tab-deposit"
              onClick={() => setActiveTab('deposit')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'deposit'
                  ? 'border-pink-500 text-pink-400 font-semibold bg-pink-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <QrCode className="h-4 w-4" />
              Isi Ulang Saldo (DANA)
            </button>

            <button
              id="tab-referral"
              onClick={() => setActiveTab('referral')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'referral'
                  ? 'border-teal-500 text-teal-400 font-semibold bg-teal-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Sistem Referral Booster
            </button>

            <button
              id="tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'tasks'
                  ? 'border-teal-500 text-teal-400 font-semibold bg-teal-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              Tugas & Misi Komunitas
            </button>

            <button
              id="tab-security"
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'security'
                  ? 'border-purple-500 text-purple-400 font-semibold bg-purple-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Sistem Keamanan E2EE
            </button>

            <button
              id="tab-whitepaper"
              onClick={() => setActiveTab('whitepaper')}
              className={`flex items-center gap-2 py-3 px-5 border-b-2 font-medium tracking-wide transition-all duration-200 shrink-0 ${
                activeTab === 'whitepaper'
                  ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-950/5'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              Whitepaper Digital Asset
            </button>
          </div>

          {/* Active Tab View */}
          <div className="flex-grow">
            {activeTab === 'admin' && currentUser.isAdmin && (
              <AdminPanel 
                users={users} 
                setUsers={setUsers} 
                currentUser={currentUser} 
                onAddLog={addLog} 
                onSyncCurrentUser={(u) => setCurrentUser(u)} 
              />
            )}
            {activeTab === 'mining' && (
              <MiningDashboard config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
            {activeTab === 'shop' && (
              <HashrateShop config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
            {activeTab === 'wallet' && (
              <WalletTransit config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
            {activeTab === 'deposit' && (
              <QrisDeposit config={config} setConfig={setConfig} onAddLog={addLog} userId={currentUser?.id} />
            )}
            {activeTab === 'referral' && (
              <ReferralSystem config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
            {activeTab === 'security' && (
              <SecureLedger config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
            {activeTab === 'whitepaper' && (
              <WhitepaperAsset />
            )}
            {activeTab === 'tasks' && (
              <MiningTasks config={config} setConfig={setConfig} onAddLog={addLog} />
            )}
          </div>

          {/* Interactive Cryptographic Action Terminal Console Log Footer */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5 mt-4 shadow-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Cryptographic Secure Stream Console
              </span>
              <button
                id="btn-clear-logs"
                onClick={clearLogs}
                className="text-[10px] text-zinc-500 font-mono hover:text-zinc-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Bersihkan Log
              </button>
            </div>

            <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-850 h-[110px] overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-400 space-y-1">
              {systemLogs.map((log, index) => (
                <div key={index} className="truncate">
                  <span className="text-indigo-400 font-semibold">&gt;&gt; </span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Humble footer */}
      <footer className="py-6 border-t border-zinc-900 text-center text-xs text-zinc-650 font-mono bg-zinc-950">
        Rp Coin Miner © {new Date().getFullYear()} • Standar Enkripsi End-to-End Terdistribusi • Server Region Asia-Tenggara
      </footer>
    </div>
  );
}
