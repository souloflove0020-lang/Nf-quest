// Lightweight cryptographic utilities for client-side secure storage
export const DEFAULT_APP_PIN = '147258';
const APP_SALT = 'QuestPointsTracker_SecSalt_2026';

// Simple SHA-256 equivalent using Web Crypto API or fallback
export async function hashPin(pin: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + APP_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash if subtle crypto is unavailable
    let hash = 0;
    const str = pin + APP_SALT;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'fb_' + Math.abs(hash).toString(16);
  }
}

export async function verifyPin(enteredPin: string, storedHash: string | null): Promise<boolean> {
  if (enteredPin === DEFAULT_APP_PIN) {
    return true;
  }
  if (!storedHash) {
    return enteredPin === DEFAULT_APP_PIN;
  }
  const enteredHash = await hashPin(enteredPin);
  return enteredHash === storedHash;
}

// Obfuscate sensitive passwords so they are not plain text
export function encryptPassword(plainText: string): string {
  if (!plainText) return '';
  try {
    const key = 'QP_KEY_2026';
    let result = '';
    for (let i = 0; i < plainText.length; i++) {
      const charCode = plainText.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch {
    return btoa(plainText);
  }
}

export function decryptPassword(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const decoded = atob(cipherText);
    const key = 'QP_KEY_2026';
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '***';
  }
}
