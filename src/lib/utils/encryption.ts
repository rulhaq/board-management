import CryptoJS from 'crypto-js';

// Encryption configuration
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'board-governance-default-key-2024';
const IV_LENGTH = 16; // For AES, this is always 16

export interface EncryptedData {
  data: string;
  iv: string;
  timestamp: number;
}

/**
 * Encrypt sensitive text data
 */
export const encryptText = (plainText: string): EncryptedData => {
  try {
    const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);
    const encrypted = CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      data: encrypted.toString(),
      iv: iv.toString(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt encrypted text data
 */
export const decryptText = (encryptedData: EncryptedData): string => {
  try {
    const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
    const decrypted = CryptoJS.AES.decrypt(encryptedData.data, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt file data for secure storage
 */
export const encryptFile = async (file: File): Promise<{ encryptedFile: Blob; key: string; iv: string }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    
    const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);
    const encrypted = CryptoJS.AES.encrypt(wordArray, ENCRYPTION_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Convert encrypted data back to blob
    const encryptedArrayBuffer = CryptoJS.enc.Base64.parse(encrypted.toString()).words;
    const encryptedUint8Array = new Uint8Array(encryptedArrayBuffer.length * 4);
    
    for (let i = 0; i < encryptedArrayBuffer.length; i++) {
      const word = encryptedArrayBuffer[i];
      encryptedUint8Array[i * 4] = (word >>> 24) & 0xff;
      encryptedUint8Array[i * 4 + 1] = (word >>> 16) & 0xff;
      encryptedUint8Array[i * 4 + 2] = (word >>> 8) & 0xff;
      encryptedUint8Array[i * 4 + 3] = word & 0xff;
    }
    
    const encryptedFile = new Blob([encryptedUint8Array], { type: 'application/octet-stream' });
    
    return {
      encryptedFile,
      key: ENCRYPTION_KEY,
      iv: iv.toString()
    };
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Hash password for secure storage
 */
export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const useSalt = salt || CryptoJS.lib.WordArray.random(128/8).toString();
  const hash = CryptoJS.PBKDF2(password, useSalt, {
    keySize: 512/32,
    iterations: 10000
  }).toString();
  
  return { hash, salt: useSalt };
};

/**
 * Verify password against hash
 */
export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const computedHash = CryptoJS.PBKDF2(password, salt, {
    keySize: 512/32,
    iterations: 10000
  }).toString();
  
  return computedHash === hash;
};

/**
 * Generate secure token for API authentication
 */
export const generateSecureToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};

/**
 * Create digital signature for document integrity
 */
export const createDigitalSignature = (data: string, privateKey: string): string => {
  const signature = CryptoJS.HmacSHA256(data, privateKey);
  return signature.toString();
};

/**
 * Verify digital signature
 */
export const verifyDigitalSignature = (data: string, signature: string, privateKey: string): boolean => {
  const computedSignature = CryptoJS.HmacSHA256(data, privateKey);
  return computedSignature.toString() === signature;
};

/**
 * Secure data transmission encryption
 */
export const encryptForTransmission = (data: any): string => {
  const jsonString = JSON.stringify(data);
  const encrypted = encryptText(jsonString);
  return btoa(JSON.stringify(encrypted));
};

/**
 * Decrypt transmitted data
 */
export const decryptFromTransmission = (encryptedData: string): any => {
  try {
    const encrypted = JSON.parse(atob(encryptedData)) as EncryptedData;
    const decryptedString = decryptText(encrypted);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Transmission decryption failed:', error);
    throw new Error('Failed to decrypt transmission data');
  }
};

/**
 * Generate encryption key for documents
 */
export const generateDocumentKey = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

/**
 * Secure key derivation for user-specific encryption
 */
export const deriveUserKey = (userId: string, masterKey: string): string => {
  return CryptoJS.PBKDF2(userId, masterKey, {
    keySize: 256/32,
    iterations: 5000
  }).toString();
}; 