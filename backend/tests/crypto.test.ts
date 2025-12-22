import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/lib/crypto.js';

describe('Encryption Lib (AES-GCM)', () => {
    it('should encrypt and decrypt a string correctly', async () => {
        const sensitive = '12.345.678-9';
        const encrypted = await encrypt(sensitive);

        expect(encrypted).not.toBe(sensitive);
        expect(encrypted).toContain(':'); // IV separator

        const decrypted = await decrypt(encrypted);
        expect(decrypted).toBe(sensitive);
    });

    it('should produce different outputs for same input (Random IV)', async () => {
        const text = 'SecretPhone';
        const enc1 = await encrypt(text);
        const enc2 = await encrypt(text);

        expect(enc1).not.toBe(enc2);

        const dec1 = await decrypt(enc1);
        const dec2 = await decrypt(enc2);

        expect(dec1).toBe(text);
        expect(dec2).toBe(text);
    });

    it('should return null on bad decryption (integrity check)', async () => {
        const valid = await encrypt('data');
        // Tamper with ciphertext
        const [iv, cipher] = valid.split(':');
        const lastChar = cipher.slice(-1);
        const newChar = lastChar === '0' ? '1' : '0'; // flip a bit/char guaranteed
        const tampered = `${iv}:${cipher.slice(0, -1) + newChar}`;

        const decrypted = await decrypt(tampered);
        expect(decrypted).toBeNull();
    });
});
