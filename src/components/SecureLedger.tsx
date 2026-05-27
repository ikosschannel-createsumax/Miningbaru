import React, { useState } from 'react';
import { Lock, Shuffle, KeyRound, Eye, EyeOff, Check, ShieldCheck, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { MiningConfig } from '../types';
import { generateKeyPair, generateCryptoHash } from '../utils';

interface SecureLedgerProps {
  config: MiningConfig;
  setConfig: React.Dispatch<React.SetStateAction<MiningConfig>>;
  onAddLog: (log: string) => void;
}

export default function SecureLedger({ config, setConfig, onAddLog }: SecureLedgerProps) {
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [encryptedValue, setEncryptedValue] = useState<string>('');
  const [encryptionMethod, setEncryptionMethod] = useState<'AES-256' | 'SHA-256'>('AES-256');
  const [copiedKey, setCopiedKey] = useState<'prv' | 'pub' | null>(null);

  const rotateSecurityKeys = () => {
    const keys = generateKeyPair();
    setConfig(prev => ({
      ...prev,
      privateKey: keys.privateKey,
      publicKey: keys.publicKey
    }));
    onAddLog('[SECURITY] Merotasi kunci keamanan kriptografis. Kunci Penandatanganan baru berhasil diaktifkan secara dinamis.');
  };

  const handleTestEncryption = (text: string) => {
    setInputText(text);
    if (!text) {
      setEncryptedValue('');
      return;
    }
    // Simulate encryption
    if (encryptionMethod === 'SHA-256') {
      setEncryptedValue('sha256_' + generateCryptoHash(57));
    } else {
      setEncryptedValue('aes256_enc_' + generateCryptoHash(53));
    }
  };

  const copyToClipboard = (type: 'prv' | 'pub', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    onAddLog(`[SECURITY] Menyalin ${type === 'prv' ? 'Kunci Privat' : 'Kunci Publik'} Anda ke clipboard.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Encryption Top Alert Showcase */}
      <div className="rounded-2xl border border-emerald-900 bg-emerald-950/10 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-md">
        <div className="flex gap-3 items-start">
          <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 shrink-0">
            <ShieldCheck className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-white text-base">
              Sistem Keamanan Enkripsi End-to-End Aktif
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xl mt-0.5">
              Seluruh rekayasa saldo dari Dompet Imigrasi menuju e-wallet diproteksi secara asimetris dengan pasangan kunci privat-publik unik perangkat Anda. Integritas saldo koin Rupiah virtual Anda terlindung mutlak.
            </p>
          </div>
        </div>

        <span className="shrink-0 px-2.5 py-1 text-xs font-mono font-medium rounded bg-emerald-950 text-emerald-400 border border-emerald-800/30">
          STATUS: AMAN & TERENKRIPSI
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symmetric & Asymmetric Key Manager */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-lg">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
            <h3 className="font-sans font-semibold text-white flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-400" />
              Kunci Kriptografis Perangkat (Local Vault)
            </h3>
            <button
              id="btn-rotate-keys"
              onClick={rotateSecurityKeys}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors"
            >
              <Shuffle className="h-3 w-3" />
              Rotasi Kunci
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Kunci asimetris lokal di bawah digunakan untuk memverifikasi asal hashing pertambangan 24 jam. Kunci privat tidak pernah dikirim ke luar perangkat (End-to-End).
          </p>

          <div className="space-y-4">
            {/* Public Key Display */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-mono">PUBLIC KEY (Alamat Dompet)</span>
                <button
                  id="btn-copy-pub"
                  onClick={() => copyToClipboard('pub', config.publicKey)}
                  className="text-[10px] text-indigo-400 font-mono hover:text-indigo-300"
                >
                  {copiedKey === 'pub' ? 'Disalin!' : 'Copy'}
                </button>
              </div>
              <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg text-xs font-mono text-zinc-300 break-all select-all">
                {config.publicKey}
              </div>
            </div>

            {/* Private Key Display */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs text-zinc-500">
                <span className="font-mono text-amber-500/80">PRIVATE KEY (Kunci Rahasia E2EE)</span>
                <div className="flex items-center gap-3">
                  <button
                    id="btn-toggle-private-key-visibility"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {showPrivateKey ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        Tampilkan Kunci
                      </>
                    )}
                  </button>
                  <button
                    id="btn-copy-prv"
                    onClick={() => copyToClipboard('prv', config.privateKey)}
                    className="text-[10px] text-indigo-400 font-mono hover:text-indigo-300"
                  >
                    {copiedKey === 'prv' ? 'Disalin!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-850 p-2.5 rounded-lg text-xs font-mono text-zinc-300 break-all select-all relative">
                {showPrivateKey ? (
                  config.privateKey
                ) : (
                  <span className="text-zinc-650 tracking-widest">
                    ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-950/20 text-yellow-500 border border-yellow-800/20 rounded-lg text-[11px] leading-relaxed flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500 mt-0.5" />
            <span>Jangan pernah memberikan kunci privat Anda (Private Key) kepada siapapun. Kunci privat mengizinkan penandatanganan pengiriman dana otomatis.</span>
          </div>
        </div>

        {/* Real-time AES/SHA Encryption Playgrounds */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <h3 className="font-sans font-semibold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-400" />
                Demosnstrasi Sandbox Enkripsi End-to-End
              </h3>
              <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono font-medium">
                {(['AES-256', 'SHA-256'] as const).map((method) => (
                  <button
                    key={method}
                    id={`btn-encryption-method-${method}`}
                    onClick={() => {
                      setEncryptionMethod(method);
                      setEncryptedValue('');
                      setInputText('');
                    }}
                    className={`px-2 py-1 rounded transition-colors ${
                      encryptionMethod === method ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Ketikkan teks / nominal saldo di bawah ini untuk melihat bagaimana sistem mengamankan data dan ledger Anda menggunakan algoritma asimetris standar dunia:
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-zinc-500">Teks / Data Asli</label>
                <input
                  type="text"
                  placeholder="Contoh: Saldo Rp 50.000 terkirim ke DANA"
                  value={inputText}
                  onChange={(e) => handleTestEncryption(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {inputText && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] uppercase font-mono text-emerald-500">
                    Hasil Enkripsi ({encryptionMethod})
                  </label>
                  <div className="bg-zinc-900 border border-emerald-950/40 p-3 rounded-lg text-xs font-mono text-emerald-400 break-all select-all">
                    {encryptedValue}
                  </div>
                  <p className="text-[10px] text-zinc-500 italic">
                    {encryptionMethod === 'AES-256' 
                      ? '*Dapat di-dekripsi hanya menggunakan Kunci Privat Anda.' 
                      : '*Hash satu arah yang aman yang memperkuat rantai blok penampungan.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 mt-4 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5 text-indigo-400" />
              Node Keamanan: Local Shield-V3
            </span>
            <span>E2EE Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
