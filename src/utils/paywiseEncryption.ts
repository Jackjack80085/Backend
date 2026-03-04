import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt data using AES-256-CBC
 */
export function encryptPaywiseData(
  data: any,
  key: string,
  iv: string
): string {
  const plaintext = typeof data === 'object' ? JSON.stringify(data) : data;
  const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
  const ivBuffer = Buffer.from(iv, 'utf8').slice(0, 16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, ivBuffer);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  return encrypted.toString('base64');
}

/**
 * Decrypt data using AES-256-CBC
 */
export function decryptPaywiseData(
  encryptedData: string,
  key: string,
  iv: string
): string {
  const keyBuffer = Buffer.from(key, 'utf8').slice(0, 32);
  const ivBuffer = Buffer.from(iv, 'utf8').slice(0, 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}
