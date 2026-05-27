import React, { useState } from 'react';
import { UserAccount, DepositTransaction, PayoutTransaction, EWalletType } from '../types';
import { formatRupiah, generateCryptoHash } from '../utils';
import { Check, X, ShieldAlert, BadgeInfo, Settings, RefreshCw, Users, Landmark, Zap, Shield, HelpCircle } from 'lucide-react';

interface AdminPanelProps {
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: UserAccount | null;
  onAddLog: (log: string) => void;
  onSyncCurrentUser: (updatedUser: UserAccount) => void;
}

export default function AdminPanel({ users, setUsers, currentUser, onAddLog, onSyncCurrentUser }: AdminPanelProps) {
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [newSpeed, setNewSpeed] = useState<string>('');
  const [newBalance, setNewBalance] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const startEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setNewSpeed(user.miningConfig.baseHashRate.toString());
    setNewBalance(user.miningConfig.balancePenampungan.toString());
  };

  const saveEditUser = () => {
    if (!editingUser) return;
    const speed = parseFloat(newSpeed);
    const balance = parseInt(newBalance);

    if (isNaN(speed) || isNaN(balance)) {
      alert('Mohon masukkan nominal angka kecepatan atau saldo yang valid.');
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === editingUser.id) {
        const updatedConfig = {
          ...u.miningConfig,
          baseHashRate: speed,
          balancePenampungan: balance
        };
        const updatedUser = {
          ...u,
          miningConfig: updatedConfig
        };
        // If editing self, sync current session
        if (currentUser && u.id === currentUser.id) {
          onSyncCurrentUser(updatedUser);
        }
        return updatedUser;
      }
      return u;
    }));

    onAddLog(`[ADMIN] Mengedit profil ${editingUser.username}. Kecepatan diubah menjadi ${speed} KH/s dan Saldo Penampungan menjadi ${formatRupiah(balance)}`);
    setSuccessMsg(`Informasi pengguna ${editingUser.username} berhasil disimpan.`);
    setEditingUser(null);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Collect all deposits across all users for admin to approve
  const allDeposits: { user: UserAccount; deposit: DepositTransaction }[] = [];
  users.forEach(user => {
    user.miningConfig.depositHistory.forEach(dep => {
      allDeposits.push({ user, deposit: dep });
    });
  });

  // Sort deposits by timestamp or id
  allDeposits.sort((a, b) => b.deposit.timestamp.localeCompare(a.deposit.timestamp));

  // Collect all withdrawals across all users
  const allWithdrawals: { user: UserAccount; withdrawal: PayoutTransaction }[] = [];
  users.forEach(user => {
    user.miningConfig.payoutHistory.forEach(p => {
      allWithdrawals.push({ user, withdrawal: p });
    });
  });

  allWithdrawals.sort((a, b) => b.withdrawal.timestamp.localeCompare(a.withdrawal.timestamp));

  const handleProcessDeposit = (userId: string, depositId: string, action: 'Approve' | 'Reject') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedDepositHistory = u.miningConfig.depositHistory.map(d => {
          if (d.id === depositId) {
            return {
              ...d,
              status: action === 'Approve' ? 'Completed' as const : 'Expired' as const
            };
          }
          return d;
        });

        const depositAmount = u.miningConfig.depositHistory.find(d => d.id === depositId)?.amount || 0;
        
        // Increase balanceEWallet on approval to match the DANA transit wallet target
        const newEWalletBalance = action === 'Approve' 
          ? u.miningConfig.balanceEWallet + depositAmount 
          : u.miningConfig.balanceEWallet;

        const updatedConfig = {
          ...u.miningConfig,
          depositHistory: updatedDepositHistory,
          balanceEWallet: newEWalletBalance
        };

        const updatedUser = {
          ...u,
          miningConfig: updatedConfig
        };

        if (currentUser && u.id === currentUser.id) {
          onSyncCurrentUser(updatedUser);
        }

        return updatedUser;
      }
      return u;
    }));

    onAddLog(`[ADMIN] Deposit #${depositId} milik ${action === 'Approve' ? 'Disetujui' : 'Ditolak'} untuk pengguna UID:${userId}`);
    setSuccessMsg(`Deposit #${depositId} berhasil diproses: ${action === 'Approve' ? 'DISETUJUI (LUNAS KE DANA)' : 'DITOLAK'}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleProcessWithdrawal = (userId: string, txId: string, action: 'Approve' | 'Reject') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updatedPayoutHistory = u.miningConfig.payoutHistory.map(p => {
          if (p.id === txId) {
            return {
              ...p,
              status: action === 'Approve' ? 'Completed' as const : 'Failed' as const,
              txHash: '0x' + generateCryptoHash(64)
            };
          }
          return p;
        });

        const updatedConfig = {
          ...u.miningConfig,
          payoutHistory: updatedPayoutHistory
        };

        const updatedUser = {
          ...u,
          miningConfig: updatedConfig
        };

        if (currentUser && u.id === currentUser.id) {
          onSyncCurrentUser(updatedUser);
        }

        return updatedUser;
      }
      return u;
    }));

    onAddLog(`[ADMIN] Penarikan #${txId} milik ${action === 'Approve' ? 'Disetujui (Sukses Terkirim)' : 'Gagal'} untuk pengguna UID:${userId}`);
    setSuccessMsg(`Transaksi penarikan #${txId} status diperbarui.`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const pendingDeposits = allDeposits.filter(({ deposit }) => deposit.status === 'Pending');

  return (
    <div className="space-y-6">
      {pendingDeposits.length > 0 && (
        <div className="p-5 rounded-2xl border border-yellow-500/20 bg-yellow-950/20 shadow-lg text-yellow-300 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-yellow-500"></span>
              </span>
              <h4 className="font-sans font-bold text-sm tracking-tight text-yellow-250">
                🔔 DEPOSIT MASUK: {pendingDeposits.length} Invoice Memerlukan Verifikasi Lunas
              </h4>
            </div>
            <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wide border border-yellow-500/10 animate-pulse">
              Pending Admin Audit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pendingDeposits.map(({ user, deposit }) => (
              <div key={deposit.id} className="p-3.5 rounded-xl bg-zinc-950 border border-yellow-500/10 hover:border-yellow-500/30 transition-all flex flex-col justify-between space-y-2.5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 -m-8 h-24 w-24 rounded-full bg-yellow-500/2 blur-2xl group-hover:bg-yellow-500/5 transition-all pointer-events-none" />
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="text-[9px] text-zinc-500 font-mono block">INVOICE ID</span>
                    <span className="font-bold text-xs text-white font-mono">{deposit.id}</span>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {formatRupiah(deposit.amount)}
                  </span>
                </div>
                
                <div className="text-[11px] text-zinc-400 font-mono relative z-10">
                  Pengguna: <span className="text-white font-bold">{user.username}</span>
                  <span className="block text-[10px] text-zinc-500 mt-1">Waktu: {deposit.timestamp}</span>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-zinc-900/60 relative z-10">
                  <button
                    onClick={() => handleProcessDeposit(user.id, deposit.id, 'Reject')}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-rose-950/60 hover:text-rose-400 text-[10px] font-semibold text-zinc-400 transition-colors border border-zinc-850"
                  >
                    Gagalkan
                  </button>
                  <button
                    onClick={() => handleProcessDeposit(user.id, deposit.id, 'Approve')}
                    className="px-3 py-1 rounded-md bg-yellow-500 hover:bg-yellow-400 text-[10px] font-extrabold text-zinc-950 transition-colors uppercase tracking-wide shadow-sm"
                  >
                    Settle Lunas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Credentials Alert */}
      <div className="rounded-2xl border border-rose-950 bg-rose-950/10 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-3">
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-400 shrink-0">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-white">
              Sistem Admin IDR Coin Miner Network (Bypass Konsol)
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed max-w-xl">
              Gunakan panel administratif ini untuk memproses deposit instan pengguna melalui verifikasi manual QRIS, menyetujui mutasi, atau merekayasa hash power server penambangan.
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 text-xs font-mono rounded bg-rose-950 text-rose-400 border border-rose-900/40 font-bold">
          ADMIN AKKREDITED
        </span>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/20 text-emerald-400 border border-emerald-800/30 rounded-xl text-xs flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Users Management Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <h3 className="font-sans font-semibold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-400" />
                Manajemen Seluruh Pengguna ({users.length})
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Daftar Akun Riil</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500 font-mono font-normal">
                    <th className="py-2 pb-3">Username</th>
                    <th className="py-2 pb-3">Email</th>
                    <th className="py-2 pb-3 text-right">Saldo Penampungan</th>
                    <th className="py-2 pb-3 text-right">Kecepatan</th>
                    <th className="py-2 pb-3 text-right">Peran</th>
                    <th className="py-2 pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {users.map((u) => (
                    <tr key={u.id} className="text-zinc-300 hover:bg-zinc-900/20 transition-all">
                      <td className="py-3 font-semibold text-white">
                        {u.username}
                        {currentUser && u.id === currentUser.id && (
                          <span className="ml-1 text-[9px] px-1 bg-indigo-950 text-indigo-400 rounded">Me</span>
                        )}
                      </td>
                      <td className="py-3 text-zinc-500">{u.email}</td>
                      <td className="py-3 text-right font-mono text-emerald-400 font-bold">
                        {formatRupiah(u.miningConfig.balancePenampungan)}
                      </td>
                      <td className="py-3 text-right font-mono font-medium text-amber-500">
                        {(u.miningConfig.baseHashRate * u.miningConfig.boostMultiplier).toFixed(1)} KH/s
                      </td>
                      <td className="py-3 text-right">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono ${
                          u.isAdmin ? 'bg-rose-950 text-rose-400 font-bold border border-rose-900/30' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {u.isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          id={`btn-edit-user-${u.id}`}
                          onClick={() => startEditUser(u)}
                          className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-850/50 text-[10px] tracking-wide"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inline Editor for mining profiles */}
          {editingUser && (
            <div className="rounded-xl border border-indigo-950 bg-gradient-to-tr from-zinc-950 to-indigo-950/10 p-6 space-y-4 shadow-lg animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-950">
                <h4 className="font-semibold text-white text-sm">
                  Rekayasa Data Pengguna: <span className="text-indigo-400 font-mono">{editingUser.username}</span>
                </h4>
                <button
                  id="btn-close-edit"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase mb-1">
                    Ubah Kecepatan Dasar (Base Hash Rate KH/s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSpeed}
                    onChange={(e) => setNewSpeed(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-mono uppercase mb-1">
                    Ubah Saldo Dompet Imigrasi (Transit Penampungan)
                  </label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  id="btn-cancel-user-edit"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs text-zinc-400"
                >
                  Batal
                </button>
                <button
                  id="btn-save-user-edit"
                  onClick={saveEditUser}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Process QRIS Deposits Panel */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-4 shadow-md flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
              <h3 className="font-sans font-semibold text-white flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-emerald-400" />
                Verifikasi Pembayaran QRIS Pengguna
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Invoice Gateway</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Daftar di bawah memuat invoice deposit QRIS yang dibuat oleh pengguna. Sebagai admin, Anda dapat memverifikasi pembayaran mereka agar saldonya langsung bertambah.
            </p>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {allDeposits.length === 0 ? (
                <div className="text-center py-10 text-zinc-650">
                  <BadgeInfo className="h-8 w-8 mx-auto mb-2 text-zinc-700" />
                  <p className="text-xs">Tidak ada riwayat tagihan QRIS terdeteksi.</p>
                </div>
              ) : (
                allDeposits.map(({ user, deposit }) => (
                  <div
                    key={deposit.id}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-850 space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                          Invoice: <span className="text-indigo-400">{deposit.id}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          User: <strong className="text-zinc-305">{user.username}</strong> ({user.email})
                        </div>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold ${
                        deposit.status === 'Pending' 
                          ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/30' 
                          : deposit.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                          : 'bg-zinc-950 text-zinc-600'
                      }`}>
                        {deposit.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1.5 border-t border-zinc-850/60">
                      <div>
                        <span className="text-[9px] text-zinc-500 block">Nominal Deposit:</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatRupiah(deposit.amount)}
                        </span>
                      </div>

                      {deposit.status === 'Pending' && (
                        <div className="flex gap-1.5">
                          <button
                            id={`btn-reject-dep-${deposit.id}`}
                            onClick={() => handleProcessDeposit(user.id, deposit.id, 'Reject')}
                            className="p-1 px-2.5 bg-zinc-950 hover:bg-red-950 hover:text-red-400 rounded text-[10px] font-semibold text-zinc-400 transition-colors border border-zinc-800"
                            title="Tolak / Kedaluwarsa"
                          >
                            <X className="h-3 w-3 inline mr-0.5" />
                            Gagalkan
                          </button>
                          <button
                            id={`btn-approve-dep-${deposit.id}`}
                            onClick={() => handleProcessDeposit(user.id, deposit.id, 'Approve')}
                            className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 rounded text-[10px] font-bold text-zinc-950 transition-colors"
                            title="Setujui Pembayaran"
                          >
                            <Check className="h-3 w-3 inline mr-0.5" />
                            Verifikasi Lunas
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Process Withdrawals Panel */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900">
          <h3 className="font-sans font-medium text-white flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-400" />
            Pemberian Izin Penarikan / Payouts Pengguna ({allWithdrawals.length})
          </h3>
          <span className="text-[10px] text-zinc-500 font-mono">Audit Transaksi Kolektif</span>
        </div>

        {allWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-zinc-650">
            <p className="text-xs">Tidak ada transaksi penarikan koin terdeteksi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono font-normal">
                  <th className="py-2 pb-3">No</th>
                  <th className="py-2 pb-3">User</th>
                  <th className="py-2 pb-3">Nominal Tarik</th>
                  <th className="py-2 pb-3">Tujuan Wallet</th>
                  <th className="py-2 pb-3">Waktu</th>
                  <th className="py-2 pb-3">Status Audit</th>
                  <th className="py-2 pb-3 text-right">Otorisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {allWithdrawals.map(({ user, withdrawal }, index) => (
                  <tr key={withdrawal.id} className="text-zinc-300 hover:bg-zinc-900/35 transition-colors">
                    <td className="py-3 font-mono text-zinc-500">{index + 1}</td>
                    <td className="py-3 font-semibold text-white">
                      {user.username} <span className="text-[10px] text-zinc-500 font-normal">({user.email})</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-400">{formatRupiah(withdrawal.amount)}</td>
                    <td className="py-3 font-mono text-zinc-400">
                      {withdrawal.walletType} • {withdrawal.walletNumber}
                    </td>
                    <td className="py-3 text-zinc-500">{withdrawal.timestamp}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${
                        withdrawal.status === 'Processing'
                          ? 'bg-yellow-950 text-yellow-400 border-yellow-905/30 animate-pulse'
                          : withdrawal.status === 'Completed'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-900/30'
                          : 'bg-red-950 text-red-400 border-red-900/30'
                      }`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {withdrawal.status === 'Processing' ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            id={`btn-reject-withdrawal-${withdrawal.id}`}
                            onClick={() => handleProcessWithdrawal(user.id, withdrawal.id, 'Reject')}
                            className="px-2 py-1 bg-zinc-900 hover:bg-red-950 hover:text-red-400 text-zinc-400 border border-zinc-850 rounded text-[10px]"
                          >
                            Tolak
                          </button>
                          <button
                            id={`btn-approve-withdrawal-${withdrawal.id}`}
                            onClick={() => handleProcessWithdrawal(user.id, withdrawal.id, 'Approve')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[10px]"
                          >
                            Setujui & Settle
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[120px] inline-block">
                          {withdrawal.txHash ? withdrawal.txHash.substring(0, 16) + '...' : 'Selesai'}
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
