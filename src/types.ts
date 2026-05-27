export type EWalletType = 'DANA' | 'GOPAY' | 'OVO' | 'LINKAJA';

export interface ReferredUser {
  id: string;
  username: string;
  joinedAt: string;
  hashRateBonus: number; // in KH/s
  status: 'Active' | 'Inactive';
}

export interface PayoutTransaction {
  id: string;
  userId?: string;
  username?: string;
  timestamp: string;
  amount: number;
  walletType: EWalletType;
  walletNumber: string;
  txHash: string; // Dynamic simulated end-to-end encryption hash
  status: 'Processing' | 'Completed' | 'Failed';
}

export interface DepositTransaction {
  id: string;
  userId?: string;
  username?: string;
  timestamp: string;
  amount: number;
  paymentMethod: 'QRIS';
  status: 'Pending' | 'Completed' | 'Expired';
  referenceNumber: string;
}

export interface MiningLog {
  timestamp: string;
  blockHeight: number;
  nonce: number;
  hash: string;
  reward: number;
  algorithm: string;
}

export interface MiningConfig {
  balancePenampungan: number; // Dompet Imigrasi Penampungan
  balanceEWallet: number; // Balance in user's linked e-wallet
  totalMined: number;
  baseHashRate: number; // in KH/s
  boostMultiplier: number; // overall referral multiplier multiplier
  isMiningActive: boolean;
  referralCode: string;
  referredBy: string | null;
  referrals: ReferredUser[];
  autoWithdrawActive: boolean;
  targetEWallet: EWalletType;
  walletNumber: string;
  payoutThreshold: number; // e.g., Rp 10.000
  payoutProgress: number; // percent toward next automated payout check
  payoutHistory: PayoutTransaction[];
  depositHistory: DepositTransaction[];
  privateKey: string; // Client-side simulated mining encryption private key
  publicKey: string;
  miningSessionExpiry?: number; // 24-hour cycle session expiry timestamp in ms
  lastMinedAt?: number; // timestamp in ms of last background mining calculation
  machineActiveDays?: number;
  rentedRigs?: string[];
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  passwordHex: string;
  isAdmin: boolean;
  miningConfig: MiningConfig;
  joinedAt: string;
}

