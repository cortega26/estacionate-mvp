import { webcrypto } from 'node:crypto';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

// Ensure we have a master key
// Ensure we warn if missing, but don't crash boot
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
    console.error('FATAL: ENCRYPTION_KEY should be defined in .env for production');
}

// Helper to derive a KeyObject from the hex string
async function getKey(): Promise<webcrypto.CryptoKey> {
    const rawKey = process.env.ENCRYPTION_KEY || '0000000000000000000000000000000000000000000000000000000000000000';
    // Convert hex string to buffer
    const keyBuffer = Buffer.from(rawKey, 'hex');

    return webcrypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns format: "iv:ciphertext" (hex encoded)
 */
export async function encrypt(text: string): Promise<string> {
    if (!text) return text;

    const key = await getKey();
    const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedText = new TextEncoder().encode(text);

    const encryptedBuffer = await webcrypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        key,
        encodedText
    );

    const ivHex = Buffer.from(iv).toString('hex');
    const authTagAndCipher = Buffer.from(encryptedBuffer).toString('hex');

    return `${ivHex}:${authTagAndCipher}`;
}

/**
 * Decrypts a string in format "iv:ciphertext".
 * Returns original text.
 */
export async function decrypt(encryptedText: string): Promise<string | null> {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;

    const [ivHex, cipherHex] = encryptedText.split(':');

    try {
        const key = await getKey();
        const iv = Buffer.from(ivHex, 'hex');
        const cipherBuffer = Buffer.from(cipherHex, 'hex');

        const decryptedBuffer = await webcrypto.subtle.decrypt(
            { name: ALGORITHM, iv },
            key,
            cipherBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null; // Fail safe
    }
}

/**
 * Hashes PII for Blind Indexing (Lookups).
 * Uses SHA-256.
 * Returns hex string.
 */
export async function hashPII(text: string): Promise<string> {
    if (!text) return text;
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', msgBuffer);
    return Buffer.from(hashBuffer).toString('hex');
}

