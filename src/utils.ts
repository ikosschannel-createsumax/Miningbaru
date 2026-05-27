// Utilities for cryptography and simulations

export function generateCryptoHash(length = 64): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const prv = 'prv_' + generateCryptoHash(32);
  const pub = 'pub_' + generateCryptoHash(32);
  return { privateKey: prv, publicKey: pub };
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const INDO_FIRST_NAMES = [
  'Budi', 'Joko', 'Siti', 'Agus', 'Dewi', 'Rian', 'Andi', 'Putri', 'Sari', 'Hendra',
  'Roni', 'Mega', 'Slamet', 'Taufik', 'Iwan', 'Sri', 'Kartika', 'Adi', 'Wawan', 'Novi'
];

const INDO_LAST_NAMES = [
  'Santoso', 'Wijaya', 'Pratama', 'Hidayat', 'Saputra', 'Sari', 'Lestari', 'Kusuma', 'Gunawan',
  'Setiawan', 'Susanto', 'Purnama', 'Wulandari', 'Utami', 'Harahap', 'Siregar', 'Ginting', 'Nasution'
];

export function generateRandomIndoName(): string {
  const first = INDO_FIRST_NAMES[Math.floor(Math.random() * INDO_FIRST_NAMES.length)];
  const last = INDO_LAST_NAMES[Math.floor(Math.random() * INDO_LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
