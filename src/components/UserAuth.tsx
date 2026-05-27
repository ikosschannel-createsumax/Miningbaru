import React, { useState } from 'react';
import { UserAccount, MiningConfig } from '../types';
import { KeyRound, Mail, User, Phone, CheckCircle2, ShieldAlert, Landmark, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { generateKeyPair, generateRandomCode, formatRupiah } from '../utils';

interface UserAuthProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onLoginSuccess: (user: UserAccount) => void;
  onAddLog: (message: string) => void;
}

export default function UserAuth({ users, setUsers, onLoginSuccess, onAddLog }: UserAuthProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [walletType, setWalletType] = useState<'DANA' | 'GOPAY' | 'OVO' | 'LINKAJA'>('DANA');
  const [walletNo, setWalletNo] = useState<string>('');
  
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Harap isi username dan password Anda.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Look for the user
      const foundUser = users.find(
        u => (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && 
        u.passwordHex === password
      );

      if (foundUser) {
        onLoginSuccess(foundUser);
        onAddLog(`[AUTH] Pengguna ${foundUser.username} berhasil masuk. Peran: ${foundUser.isAdmin ? 'ADMINISTATOR' : 'PREMIUM USER'}`);
        setIsSubmitting(false);
      } else {
        setErrorMsg('Username atau password salah. Cek data demo di bawah.');
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !walletNo) {
      setErrorMsg('Harap lengkapi semua bidang isian pendaftaran.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('Username minimal berisi 3 karakter.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password minimal mengandung 4 karakter.');
      return;
    }

    if (walletNo.length < 9) {
      setErrorMsg('Nomor HP E-Wallet minimal 9 digit.');
      return;
    }

    // Check availability
    const usernameTaken = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    const emailTaken = users.some(u => u.email.toLowerCase() === email.toLowerCase());

    if (usernameTaken) {
      setErrorMsg('Username sudah digunakan oleh pendaftar lain.');
      return;
    }
    if (emailTaken) {
      setErrorMsg('Alamat Email ini sudah terdaftar.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const keys = generateKeyPair();
      const userConfig: MiningConfig = {
        balancePenampungan: 0,
        balanceEWallet: 0,
        totalMined: 0,
        baseHashRate: 4.5, // Standard starting power
        boostMultiplier: 1.0,
        isMiningActive: true,
        referralCode: 'IDR-' + generateRandomCode(4),
        referredBy: null,
        referrals: [],
        autoWithdrawActive: false,
        targetEWallet: walletType,
        walletNumber: walletNo,
        payoutThreshold: 10000,
        payoutProgress: 0,
        payoutHistory: [],
        depositHistory: [],
        privateKey: keys.privateKey,
        publicKey: keys.publicKey,
        machineActiveDays: 3,
        rentedRigs: []
      };

      const newUser: UserAccount = {
        id: 'UID-' + Math.floor(Math.random() * 89999 + 10000),
        username: username,
        email: email,
        passwordHex: password,
        isAdmin: false,
        miningConfig: userConfig,
        joinedAt: new Date().toLocaleDateString('id-ID')
      };

      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
      .then(res => res.json())
      .then(() => {
        setUsers(prev => [...prev, newUser]);
        setIsSubmitting(false);
        onLoginSuccess(newUser);
        onAddLog(`[AUTH] Registrasi sukses! Pengguna baru ${newUser.username} telah login.`);
      })
      .catch(err => {
        console.error("Failed to register with backend database:", err);
        // Fallback to client-side registration anyway
        setUsers(prev => [...prev, newUser]);
        setIsSubmitting(false);
        onLoginSuccess(newUser);
        onAddLog(`[AUTH] Registrasi sukses (Offline)! Pengguna baru ${newUser.username} telah login.`);
      });
    }, 1200);
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setErrorMsg('');
    
    // Simulate natural fast login
    setIsSubmitting(true);
    setTimeout(() => {
      const foundUser = users.find(u => u.username === uname && u.passwordHex === pass);
      if (foundUser) {
        onLoginSuccess(foundUser);
        onAddLog(`[AUTH] Quick-Login: Pengguna masuk sebagai ${foundUser.username} (${foundUser.isAdmin ? 'ADMIN' : 'USER'}).`);
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="flex-grow flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        
        {/* Core Auth Branding logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 shadow-xl border border-white/10 mx-auto">
            <Landmark className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              IDR Rupiah Coin Miner
            </h2>
            <p className="text-xs text-zinc-400">
              Gerbang Otentikasi Terenkripsi Jaringan Mining Virtual
            </p>
          </div>
        </div>

        {/* Auth Tab selectors & Card */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-zinc-900 text-xs">
            <button
              id="auth-tab-login"
              onClick={() => { setActiveMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-4 font-bold uppercase tracking-wider transition-colors ${
                activeMode === 'login' 
                  ? 'bg-zinc-900 text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Masuk Akun
            </button>
            <button
              id="auth-tab-register"
              onClick={() => { setActiveMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-4 font-bold uppercase tracking-wider transition-colors ${
                activeMode === 'register' 
                  ? 'bg-zinc-900 text-indigo-400 border-b-2 border-indigo-500' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Pendaftaran Baru
            </button>
          </div>

          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-950/20 text-red-400 border border-red-900/30 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeMode === 'login' ? (
              /* User Login Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">Username / Alamat Email</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: jokowow / admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">Kata Sandi (Password)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-850 disabled:text-zinc-650 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Memverifikasi Sesi Node...
                    </>
                  ) : (
                    <>
                      Masuk Ke Terminal
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* User Registration Form */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">Username Akun</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: hidayat99"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">Alamat Email Aktif</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="Contoh: miner@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-500 uppercase">Buat Kata Sandi</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-zinc-500">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      placeholder="Min. 4 Karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* E-wallet gateway settings integrated into registration */}
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-850 space-y-3">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Konfigurasi Pengiriman E-Wallet</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['DANA', 'GOPAY', 'OVO', 'LINKAJA'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        id={`auth-reg-wallet-${type}`}
                        onClick={() => setWalletType(type)}
                        className={`py-1.5 rounded border text-center transition-all font-mono font-semibold ${
                          walletType === type 
                            ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/50' 
                            : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="Nomor HP E-Wallet"
                      value={walletNo}
                      onChange={(e) => setWalletNo(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 pl-9 pr-3 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-4 py-3 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:bg-zinc-850 disabled:text-zinc-650 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg transition-all uppercase tracking-wider"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Membuat Secure Node Miner...
                    </>
                  ) : (
                    <>
                      Selesaikan Pendaftaran
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
