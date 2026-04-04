import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

// Note: Node 18+ exposes crypto.subtle globally — no setup needed.

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _reset: () => { store = {}; },
  };
})();

globalThis.localStorage = localStorageMock;

// Mock document for DOM methods
globalThis.document = {
  createElement: vi.fn((tag) => {
    if (tag === 'div') {
      let textContent = '';
      return {
        get textContent() { return textContent; },
        set textContent(v) { textContent = v; },
        get innerHTML() {
          return textContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        }
      };
    }
    return {};
  }),
  getElementById: vi.fn(() => null),
  body: { appendChild: vi.fn(), removeChild: vi.fn() },
};

globalThis.URL = {
  createObjectURL: vi.fn(() => 'blob:mock'),
  revokeObjectURL: vi.fn(),
};

globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');

// Load Utils via CJS require (the source uses module.exports)
const require = createRequire(import.meta.url);
const Utils = require('../../deploy/js/utils.js');

// Helper to reset vault session state
function resetVaultState() {
  Utils._sessionKey = null;
  Utils._sessionTimestamp = null;
  Utils._cachedCredentials = null;
}

beforeEach(() => {
  localStorageMock._reset();
  vi.clearAllMocks();
  resetVaultState();
});

// =============================================================================
// Pure functions
// =============================================================================

describe('debounce', () => {
  it('delays execution until after wait period', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = Utils.debounce(fn, 100);

    debounced('a');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('a');

    vi.useRealTimers();
  });

  it('coalesces multiple rapid calls into one', () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = Utils.debounce(fn, 200);

    debounced('first');
    debounced('second');
    debounced('third');

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');

    vi.useRealTimers();
  });
});

describe('getProviderName', () => {
  it('maps aws to Amazon Web Services', () => {
    expect(Utils.getProviderName('aws')).toBe('Amazon Web Services');
  });

  it('maps azure to Microsoft Azure', () => {
    expect(Utils.getProviderName('azure')).toBe('Microsoft Azure');
  });

  it('maps gcp to Google Cloud Platform', () => {
    expect(Utils.getProviderName('gcp')).toBe('Google Cloud Platform');
  });

  it('returns the original string for unknown providers', () => {
    expect(Utils.getProviderName('unknown')).toBe('unknown');
  });
});

describe('getProviderIcon', () => {
  it('maps aws to bi-amazon text-warning', () => {
    expect(Utils.getProviderIcon('aws')).toBe('bi-amazon text-warning');
  });

  it('maps azure to bi-microsoft text-info', () => {
    expect(Utils.getProviderIcon('azure')).toBe('bi-microsoft text-info');
  });

  it('maps gcp to bi-google text-success', () => {
    expect(Utils.getProviderIcon('gcp')).toBe('bi-google text-success');
  });

  it('returns bi-cloud for unknown provider', () => {
    expect(Utils.getProviderIcon('unknown')).toBe('bi-cloud');
  });
});

describe('formatNumber', () => {
  it('formats a plain number with commas', () => {
    expect(Utils.formatNumber(1000)).toBe('1,000');
  });

  it('formats a large number with commas', () => {
    expect(Utils.formatNumber(1234567)).toBe('1,234,567');
  });

  it('returns small numbers unchanged', () => {
    expect(Utils.formatNumber(42)).toBe('42');
  });
});

// =============================================================================
// Storage operations
// =============================================================================

describe('getStorage / setStorage / clearStorage', () => {
  it('setStorage serializes value as JSON', () => {
    const result = Utils.setStorage('testKey', { foo: 'bar' });
    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', JSON.stringify({ foo: 'bar' }));
  });

  it('getStorage deserializes JSON value', () => {
    Utils.setStorage('testKey', { foo: 'bar' });
    const value = Utils.getStorage('testKey');
    expect(value).toEqual({ foo: 'bar' });
  });

  it('getStorage returns null for missing key', () => {
    expect(Utils.getStorage('nonexistent')).toBeNull();
  });

  it('clearStorage clears all localStorage entries', () => {
    Utils.setStorage('a', 1);
    Utils.setStorage('b', 2);
    const result = Utils.clearStorage();
    expect(result).toBe(true);
    expect(localStorageMock.clear).toHaveBeenCalled();
  });
});

// =============================================================================
// HTML / Security
// =============================================================================

describe('escapeHtml', () => {
  it('escapes < and > characters', () => {
    expect(Utils.escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes & characters', () => {
    expect(Utils.escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes double quotes', () => {
    expect(Utils.escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(Utils.escapeHtml("it's")).toBe('it&#039;s');
  });

  it('leaves plain text unchanged', () => {
    expect(Utils.escapeHtml('hello world')).toBe('hello world');
  });
});

describe('maskSensitiveValue', () => {
  it('shows first 4 and last 4 chars with mask in between for long values', () => {
    expect(Utils.maskSensitiveValue('abcdefghij')).toBe('abcd••••••••ghij');
  });

  it('fully masks values shorter than 9 characters', () => {
    expect(Utils.maskSensitiveValue('short')).toBe('••••••••');
  });

  it('fully masks a value of exactly 8 characters', () => {
    expect(Utils.maskSensitiveValue('12345678')).toBe('••••••••');
  });

  it('shows first/last 4 for value of exactly 9 characters', () => {
    expect(Utils.maskSensitiveValue('123456789')).toBe('1234••••••••6789');
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(Utils.maskSensitiveValue('')).toBe('');
    expect(Utils.maskSensitiveValue(null)).toBe('');
    expect(Utils.maskSensitiveValue(undefined)).toBe('');
  });
});

describe('obfuscateHtmlContent / deobfuscateValue', () => {
  it('round-trips a plain ASCII string', () => {
    const original = 'my-secret-token';
    const encoded = Utils.obfuscateHtmlContent(original);
    expect(encoded).not.toBe(original);
    expect(Utils.deobfuscateValue(encoded)).toBe(original);
  });

  it('round-trips a string with special characters', () => {
    const original = 'p@ss!word#123';
    const encoded = Utils.obfuscateHtmlContent(original);
    expect(Utils.deobfuscateValue(encoded)).toBe(original);
  });

  it('returns empty string for falsy input to obfuscate', () => {
    expect(Utils.obfuscateHtmlContent('')).toBe('');
    expect(Utils.obfuscateHtmlContent(null)).toBe('');
  });

  it('returns empty string for falsy input to deobfuscate', () => {
    expect(Utils.deobfuscateValue('')).toBe('');
    expect(Utils.deobfuscateValue(null)).toBe('');
  });
});

// =============================================================================
// Base64 conversion
// =============================================================================

describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
  it('round-trips a simple byte array', () => {
    const original = new Uint8Array([1, 2, 3, 4, 255, 0, 128]);
    const base64 = Utils.arrayBufferToBase64(original.buffer);
    const decoded = Utils.base64ToArrayBuffer(base64);
    expect(decoded).toEqual(original);
  });

  it('round-trips an empty buffer', () => {
    const original = new Uint8Array([]);
    const base64 = Utils.arrayBufferToBase64(original.buffer);
    const decoded = Utils.base64ToArrayBuffer(base64);
    expect(decoded).toEqual(original);
  });

  it('produces a valid base64 string for known input', () => {
    const buf = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const base64 = Utils.arrayBufferToBase64(buf.buffer);
    expect(base64).toBe('SGVsbG8=');
  });
});

// =============================================================================
// Vault session management
// =============================================================================

describe('isVaultUnlocked', () => {
  it('returns false when _sessionKey is null', () => {
    expect(Utils.isVaultUnlocked()).toBe(false);
  });

  it('returns true when _sessionKey is set with a recent timestamp', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    expect(Utils.isVaultUnlocked()).toBe(true);
  });

  it('returns false and auto-locks when session has expired (31+ min ago)', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now() - (31 * 60 * 1000);
    expect(Utils.isVaultUnlocked()).toBe(false);
    expect(Utils._sessionKey).toBeNull();
    expect(Utils._sessionTimestamp).toBeNull();
  });
});

describe('lockVault', () => {
  it('clears _sessionKey and _sessionTimestamp', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();

    Utils.lockVault();

    expect(Utils._sessionKey).toBeNull();
    expect(Utils._sessionTimestamp).toBeNull();
  });
});

describe('extendVaultSession', () => {
  it('refreshes _sessionTimestamp when vault is unlocked', () => {
    Utils._sessionKey = 'mock-key';
    const oldTimestamp = Date.now() - 5000;
    Utils._sessionTimestamp = oldTimestamp;

    Utils.extendVaultSession();

    expect(Utils._sessionTimestamp).toBeGreaterThan(oldTimestamp);
  });

  it('does nothing when _sessionKey is null', () => {
    Utils._sessionKey = null;
    Utils._sessionTimestamp = null;

    Utils.extendVaultSession();

    expect(Utils._sessionTimestamp).toBeNull();
  });
});

describe('getVaultSessionRemaining', () => {
  it('returns 0 when vault is locked', () => {
    expect(Utils.getVaultSessionRemaining()).toBe(0);
  });

  it('returns a positive value when vault is active', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    const remaining = Utils.getVaultSessionRemaining();
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(Utils.VAULT_SESSION_TIMEOUT);
  });

  it('returns 0 when session is expired', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now() - (Utils.VAULT_SESSION_TIMEOUT + 1000);
    expect(Utils.getVaultSessionRemaining()).toBe(0);
  });
});

describe('formatVaultSessionRemaining', () => {
  it('returns "Expired" when vault is locked', () => {
    expect(Utils.formatVaultSessionRemaining()).toBe('Expired');
  });

  it('returns "N min" format when vault is active', () => {
    Utils._sessionKey = 'mock-key';
    // 5 minutes elapsed, ~25 minutes remain
    Utils._sessionTimestamp = Date.now() - (5 * 60 * 1000);
    const result = Utils.formatVaultSessionRemaining();
    expect(result).toMatch(/^\d+ min$/);
  });

  it('returns "Expired" when session time has run out', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now() - (Utils.VAULT_SESSION_TIMEOUT + 60000);
    expect(Utils.formatVaultSessionRemaining()).toBe('Expired');
  });
});

// =============================================================================
// Vault management
// =============================================================================

describe('deleteCredentialsVault', () => {
  it('removes SALT_KEY, VERIFY_KEY, CREDENTIALS_KEY from localStorage', () => {
    localStorageMock.setItem(Utils.SALT_KEY, 'somesalt');
    localStorageMock.setItem(Utils.VERIFY_KEY, 'someverify');
    localStorageMock.setItem(Utils.CREDENTIALS_KEY, 'somecreds');
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    Utils._cachedCredentials = { aws: { accountId: '123' } };

    const result = Utils.deleteCredentialsVault();

    expect(result).toBe(true);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(Utils.SALT_KEY);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(Utils.VERIFY_KEY);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(Utils.CREDENTIALS_KEY);
  });

  it('clears session state after deletion', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    Utils._cachedCredentials = { aws: {} };

    Utils.deleteCredentialsVault();

    expect(Utils._sessionKey).toBeNull();
    expect(Utils._sessionTimestamp).toBeNull();
    expect(Utils._cachedCredentials).toBeNull();
  });
});

describe('hasCredentialsVault', () => {
  it('returns false when SALT_KEY is not in localStorage', () => {
    expect(Utils.hasCredentialsVault()).toBe(false);
  });

  it('returns true when SALT_KEY is present in localStorage', () => {
    localStorageMock.setItem(Utils.SALT_KEY, 'somesalt');
    expect(Utils.hasCredentialsVault()).toBe(true);
  });
});

describe('hasProviderCredentialsSync', () => {
  it('returns false when vault is locked (_sessionKey is null)', () => {
    expect(Utils.hasProviderCredentialsSync('aws')).toBe(false);
  });

  it('returns false when _cachedCredentials is null', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = null;
    expect(Utils.hasProviderCredentialsSync('aws')).toBe(false);
  });

  it('returns false when provider has no credentials in cache', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { aws: {} };
    expect(Utils.hasProviderCredentialsSync('aws')).toBe(false);
  });

  it('returns true when provider has accountId in cache', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { aws: { accountId: 'acct-123' } };
    expect(Utils.hasProviderCredentialsSync('aws')).toBe(true);
  });

  it('returns true when provider has clientId in cache', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { azure: { clientId: 'client-abc' } };
    expect(Utils.hasProviderCredentialsSync('azure')).toBe(true);
  });

  it('returns true when provider has clientSecret in cache', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { gcp: { clientSecret: 'secret-xyz' } };
    expect(Utils.hasProviderCredentialsSync('gcp')).toBe(true);
  });

  it('is case-insensitive for provider name', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { aws: { accountId: 'acct-123' } };
    expect(Utils.hasProviderCredentialsSync('AWS')).toBe(true);
  });
});

// =============================================================================
// Crypto primitives (real Web Crypto API)
// =============================================================================

describe('generateSalt', () => {
  it('returns a Uint8Array of length 16', () => {
    const salt = Utils.generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });

  it('returns different values on successive calls', () => {
    const a = Utils.generateSalt();
    const b = Utils.generateSalt();
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('generateIV', () => {
  it('returns a Uint8Array of length 12', () => {
    const iv = Utils.generateIV();
    expect(iv).toBeInstanceOf(Uint8Array);
    expect(iv.length).toBe(12);
  });

  it('returns different values on successive calls', () => {
    const a = Utils.generateIV();
    const b = Utils.generateIV();
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('deriveKey', () => {
  it('returns a CryptoKey object', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('mypassword', salt);
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  it('produces a key that can be used for encrypt/decrypt', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('testpassword123', salt);
    const { iv, ciphertext } = await Utils.encrypt('hello world', key);
    const plaintext = await Utils.decrypt(ciphertext, iv, key);
    expect(plaintext).toBe('hello world');
  });
});

describe('encrypt / decrypt', () => {
  it('round-trips a simple string', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('password123', salt);
    const { iv, ciphertext } = await Utils.encrypt('secret message', key);
    const result = await Utils.decrypt(ciphertext, iv, key);
    expect(result).toBe('secret message');
  });

  it('round-trips a JSON string', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('password123', salt);
    const original = JSON.stringify({ aws: { accountId: '123456789' } });
    const { iv, ciphertext } = await Utils.encrypt(original, key);
    const result = await Utils.decrypt(ciphertext, iv, key);
    expect(result).toBe(original);
  });

  it('encrypt produces non-empty iv and ciphertext', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('password123', salt);
    const { iv, ciphertext } = await Utils.encrypt('test', key);
    expect(iv).toBeTruthy();
    expect(ciphertext).toBeTruthy();
    expect(typeof iv).toBe('string');
    expect(typeof ciphertext).toBe('string');
  });

  it('two encryptions of the same plaintext produce different ciphertexts (random IV)', async () => {
    const salt = Utils.generateSalt();
    const key = await Utils.deriveKey('password123', salt);
    const enc1 = await Utils.encrypt('same text', key);
    const enc2 = await Utils.encrypt('same text', key);
    // IVs should differ
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it('decrypt with wrong key throws', async () => {
    const salt1 = Utils.generateSalt();
    const salt2 = Utils.generateSalt();
    const key1 = await Utils.deriveKey('password123', salt1);
    const key2 = await Utils.deriveKey('otherpassword', salt2);
    const { iv, ciphertext } = await Utils.encrypt('secret', key1);
    await expect(Utils.decrypt(ciphertext, iv, key2)).rejects.toThrow();
  });
});

// =============================================================================
// Vault lifecycle (integration tests using real crypto)
// =============================================================================

describe('setupCredentialsVault', () => {
  it('succeeds with a valid password and sets session key', async () => {
    const result = await Utils.setupCredentialsVault('StrongPass1!');
    expect(result).toBe(true);
    expect(Utils._sessionKey).not.toBeNull();
    expect(Utils._sessionTimestamp).not.toBeNull();
    expect(Utils.isVaultUnlocked()).toBe(true);
  });

  it('stores salt and verify data in localStorage', async () => {
    await Utils.setupCredentialsVault('StrongPass1!');
    expect(localStorageMock.getItem(Utils.SALT_KEY)).not.toBeNull();
    expect(localStorageMock.getItem(Utils.VERIFY_KEY)).not.toBeNull();
    expect(localStorageMock.getItem(Utils.CREDENTIALS_KEY)).not.toBeNull();
  });

  it('rejects password shorter than 8 characters', async () => {
    await expect(Utils.setupCredentialsVault('short')).rejects.toThrow('Master password must be at least 8 characters');
  });

  it('rejects null/undefined password', async () => {
    await expect(Utils.setupCredentialsVault(null)).rejects.toThrow();
    await expect(Utils.setupCredentialsVault(undefined)).rejects.toThrow();
  });

  it('cleans up localStorage on failure and re-throws', async () => {
    // Temporarily break crypto.subtle.importKey to force failure
    const original = globalThis.crypto.subtle.importKey;
    globalThis.crypto.subtle.importKey = vi.fn().mockRejectedValue(new Error('forced failure'));
    await expect(Utils.setupCredentialsVault('ValidPass1!')).rejects.toThrow('forced failure');
    // Should have cleaned up
    expect(localStorageMock.getItem(Utils.SALT_KEY)).toBeNull();
    // Restore
    globalThis.crypto.subtle.importKey = original;
  });
});

describe('unlockVault', () => {
  it('succeeds with the correct password', async () => {
    await Utils.setupCredentialsVault('MyPass1234!');
    Utils.lockVault(); // lock first
    const result = await Utils.unlockVault('MyPass1234!');
    expect(result).toBe(true);
    expect(Utils.isVaultUnlocked()).toBe(true);
  });

  it('fails with wrong password', async () => {
    await Utils.setupCredentialsVault('MyPass1234!');
    Utils.lockVault();
    await expect(Utils.unlockVault('WrongPassword!')).rejects.toThrow('Invalid master password');
  });

  it('throws when vault does not exist', async () => {
    // localStorage is empty after beforeEach reset
    await expect(Utils.unlockVault('AnyPassword!')).rejects.toThrow('Credentials vault not found');
  });
});

describe('changeMasterPassword', () => {
  it('succeeds and vault is still accessible with new password', async () => {
    await Utils.setupCredentialsVault('OldPass1234!');
    await Utils.changeMasterPassword('OldPass1234!', 'NewPass5678!');
    // Vault should still be unlocked (session key updated)
    expect(Utils.isVaultUnlocked()).toBe(true);
    // Lock and re-unlock with new password
    Utils.lockVault();
    const result = await Utils.unlockVault('NewPass5678!');
    expect(result).toBe(true);
  });

  it('fails when new password is too short', async () => {
    await Utils.setupCredentialsVault('OldPass1234!');
    await expect(Utils.changeMasterPassword('OldPass1234!', 'short')).rejects.toThrow('New master password must be at least 8 characters');
  });

  it('unlocks first if vault is locked before changing password', async () => {
    await Utils.setupCredentialsVault('OldPass1234!');
    Utils.lockVault();
    const result = await Utils.changeMasterPassword('OldPass1234!', 'NewPass5678!');
    expect(result).toBe(true);
  });
});

// =============================================================================
// Credential CRUD operations (after vault setup)
// =============================================================================

describe('setProviderCredentials / getProviderCredentials', () => {
  it('stores and retrieves credentials for aws', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const creds = { accountId: '123456789012', region: 'us-east-1' };
    await Utils.setProviderCredentials('aws', creds);
    const retrieved = await Utils.getProviderCredentials('aws');
    expect(retrieved).toEqual(creds);
  });

  it('stores and retrieves credentials for azure', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const creds = { clientId: 'abc-def', clientSecret: 'mysecret', tenantId: 'tenant-123' };
    await Utils.setProviderCredentials('azure', creds);
    const retrieved = await Utils.getProviderCredentials('azure');
    expect(retrieved).toEqual(creds);
  });

  it('is case-insensitive for provider name', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('AWS', { accountId: '999' });
    const retrieved = await Utils.getProviderCredentials('aws');
    expect(retrieved).toEqual({ accountId: '999' });
  });

  it('getProviderCredentials returns null when vault is locked', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    Utils.lockVault();
    const result = await Utils.getProviderCredentials('aws');
    expect(result).toBeNull();
  });

  it('setProviderCredentials throws when vault is locked', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    Utils.lockVault();
    await expect(Utils.setProviderCredentials('aws', { accountId: '123' })).rejects.toThrow('Vault is locked');
  });

  it('returns null for unknown provider', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const result = await Utils.getProviderCredentials('unknown-provider');
    expect(result).toBeNull();
  });

  it('returns null when no provider argument given', async () => {
    const result = await Utils.getProviderCredentials(null);
    expect(result).toBeNull();
  });
});

describe('hasProviderCredentials', () => {
  it('returns true after storing credentials with accountId', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('aws', { accountId: 'acct-123' });
    const result = await Utils.hasProviderCredentials('aws');
    expect(result).toBe(true);
  });

  it('returns false before storing credentials', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const result = await Utils.hasProviderCredentials('gcp');
    expect(result).toBe(false);
  });

  it('returns false when vault is locked', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    Utils.lockVault();
    const result = await Utils.hasProviderCredentials('aws');
    expect(result).toBe(false);
  });
});

describe('clearProviderCredentials', () => {
  it('clears credentials for a specific provider', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('aws', { accountId: '123' });
    await Utils.clearProviderCredentials('aws');
    const result = await Utils.getProviderCredentials('aws');
    expect(result).toEqual({});
  });

  it('clears all credentials when no argument given', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('aws', { accountId: '123' });
    await Utils.setProviderCredentials('azure', { clientId: 'abc' });
    await Utils.clearProviderCredentials();
    expect(await Utils.getProviderCredentials('aws')).toEqual({});
    expect(await Utils.getProviderCredentials('azure')).toEqual({});
  });

  it('throws when vault is locked', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    Utils.lockVault();
    await expect(Utils.clearProviderCredentials('aws')).rejects.toThrow('Vault is locked');
  });
});

describe('getCredentialValue', () => {
  it('returns specific field value from stored credentials', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('aws', { accountId: '123456789012', region: 'eu-west-1' });
    const accountId = await Utils.getCredentialValue('aws', 'accountId');
    expect(accountId).toBe('123456789012');
  });

  it('returns null for a field that does not exist', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('aws', { accountId: '123' });
    const val = await Utils.getCredentialValue('aws', 'nonExistentField');
    expect(val).toBeNull();
  });

  it('returns null when vault is locked', async () => {
    Utils.lockVault();
    const val = await Utils.getCredentialValue('aws', 'accountId');
    expect(val).toBeNull();
  });
});

describe('refreshCredentialsCache', () => {
  it('populates _cachedCredentials when vault is unlocked', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    await Utils.setProviderCredentials('gcp', { clientSecret: 'gcp-secret' });
    Utils._cachedCredentials = null; // clear cache manually
    await Utils.refreshCredentialsCache();
    expect(Utils._cachedCredentials).not.toBeNull();
    expect(Utils._cachedCredentials.gcp).toBeDefined();
  });

  it('sets _cachedCredentials to null when vault is locked', async () => {
    Utils._cachedCredentials = { aws: { accountId: '123' } }; // simulate stale cache
    Utils.lockVault();
    await Utils.refreshCredentialsCache();
    expect(Utils._cachedCredentials).toBeNull();
  });
});

describe('_getAllCredentials / _saveAllCredentials', () => {
  it('_getAllCredentials returns default structure when no credentials stored', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    // Delete credentials key to simulate missing data
    localStorageMock.removeItem(Utils.CREDENTIALS_KEY);
    const allCreds = await Utils._getAllCredentials();
    expect(allCreds).toEqual({ aws: {}, azure: {}, gcp: {} });
  });

  it('_getAllCredentials throws when vault is locked', async () => {
    Utils.lockVault();
    await expect(Utils._getAllCredentials()).rejects.toThrow('Vault is locked');
  });

  it('_saveAllCredentials throws when vault is locked', async () => {
    Utils.lockVault();
    await expect(Utils._saveAllCredentials({ aws: {}, azure: {}, gcp: {} })).rejects.toThrow('Vault is locked');
  });

  it('_saveAllCredentials persists data that can be read back', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const data = { aws: { accountId: 'saved-123' }, azure: {}, gcp: {} };
    await Utils._saveAllCredentials(data);
    const readBack = await Utils._getAllCredentials();
    expect(readBack.aws.accountId).toBe('saved-123');
  });

  it('_getAllCredentials returns default structure when stored data is corrupt JSON', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    // Store invalid JSON so decrypt+parse fails
    localStorageMock.setItem(Utils.CREDENTIALS_KEY, 'not-valid-json-at-all');
    const allCreds = await Utils._getAllCredentials();
    expect(allCreds).toEqual({ aws: {}, azure: {}, gcp: {} });
  });
});

// =============================================================================
// Sync helper: getProviderCredentialsSync with cached credentials
// =============================================================================

describe('getProviderCredentialsSync', () => {
  it('returns null when _sessionKey is null', () => {
    Utils._sessionKey = null;
    expect(Utils.getProviderCredentialsSync('aws')).toBeNull();
  });

  it('returns null when provider is null', () => {
    Utils._sessionKey = 'mock-key';
    Utils._cachedCredentials = { aws: { accountId: '123' } };
    expect(Utils.getProviderCredentialsSync(null)).toBeNull();
  });

  it('returns cached credentials when vault is unlocked and cache is populated', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    const creds = { accountId: 'abc-123' };
    Utils._cachedCredentials = { aws: creds };
    expect(Utils.getProviderCredentialsSync('aws')).toEqual(creds);
  });

  it('returns null when provider not in cache', () => {
    Utils._sessionKey = 'mock-key';
    Utils._sessionTimestamp = Date.now();
    Utils._cachedCredentials = { aws: { accountId: 'x' } };
    expect(Utils.getProviderCredentialsSync('gcp')).toBeNull();
  });
});

// =============================================================================
// Additional edge-case coverage for catch paths
// =============================================================================

describe('setProviderCredentials edge cases', () => {
  it('returns false when provider is null', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const result = await Utils.setProviderCredentials(null, { accountId: '123' });
    expect(result).toBe(false);
  });

  it('returns false when credentials is null', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    const result = await Utils.setProviderCredentials('aws', null);
    expect(result).toBe(false);
  });
});

describe('refreshCredentialsCache catch path', () => {
  it('falls back to empty structure when _getAllCredentials encounters corrupt data', async () => {
    await Utils.setupCredentialsVault('VaultPass123!');
    // Store corrupt data
    localStorageMock.setItem(Utils.CREDENTIALS_KEY, 'corrupt-data');
    await Utils.refreshCredentialsCache();
    // Should fall back to empty structure, not throw
    expect(Utils._cachedCredentials).toEqual({ aws: {}, azure: {}, gcp: {} });
  });
});

// =============================================================================
// DOM-related methods
// =============================================================================

describe('downloadFile', () => {
  it('calls URL.createObjectURL, appends anchor, clicks, removes, and revokes', () => {
    const mockAnchor = { href: null, download: null, click: vi.fn() };
    globalThis.document.createElement = vi.fn((tag) => {
      if (tag === 'a') return mockAnchor;
      if (tag === 'div') {
        let textContent = '';
        return {
          get textContent() { return textContent; },
          set textContent(v) { textContent = v; },
          get innerHTML() {
            return textContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
          }
        };
      }
      return {};
    });
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
    globalThis.document.body.appendChild = vi.fn();
    globalThis.document.body.removeChild = vi.fn();

    const mockBlob = new Blob(['hello'], { type: 'text/plain' });
    Utils.downloadFile(mockBlob, 'test.txt');

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAnchor.href).toBe('blob:mock-url');
    expect(mockAnchor.download).toBe('test.txt');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(globalThis.document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
    expect(globalThis.document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('showFlashMessage', () => {
  it('does nothing when container element is null', () => {
    // getElementById returns null (mock default), so no error should be thrown
    expect(() => Utils.showFlashMessage('test', 'info')).not.toThrow();
  });

  it('appends alert to container when element exists', () => {
    vi.useFakeTimers();
    const mockAlertDiv = { className: '', innerHTML: '', remove: vi.fn() };
    const mockContainer = { appendChild: vi.fn() };
    globalThis.document.getElementById = vi.fn((id) => {
      if (id === 'flash-messages') return mockContainer;
      return null;
    });
    globalThis.document.createElement = vi.fn(() => mockAlertDiv);

    Utils.showFlashMessage('Hello World', 'success');

    expect(mockContainer.appendChild).toHaveBeenCalledWith(mockAlertDiv);
    expect(mockAlertDiv.className).toContain('alert-success');

    // Timer should auto-remove after 5 seconds
    vi.advanceTimersByTime(5000);
    expect(mockAlertDiv.remove).toHaveBeenCalled();

    // Restore
    globalThis.document.getElementById = vi.fn(() => null);
    vi.useRealTimers();
  });

  it('uses "danger" class for error type', () => {
    const mockAlertDiv = { className: '', innerHTML: '', remove: vi.fn() };
    const mockContainer = { appendChild: vi.fn() };
    globalThis.document.getElementById = vi.fn((id) => {
      if (id === 'flash-messages') return mockContainer;
      return null;
    });
    globalThis.document.createElement = vi.fn(() => mockAlertDiv);

    Utils.showFlashMessage('Error occurred', 'error');
    expect(mockAlertDiv.className).toContain('alert-danger');

    globalThis.document.getElementById = vi.fn(() => null);
  });
});

describe('showLoading / hideLoading', () => {
  it('showLoading does nothing when overlay element is null', () => {
    globalThis.document.getElementById = vi.fn(() => null);
    expect(() => Utils.showLoading('Loading...')).not.toThrow();
    globalThis.document.getElementById = vi.fn(() => null);
  });

  it('showLoading sets message and removes d-none class', () => {
    const mockOverlay = { classList: { remove: vi.fn(), add: vi.fn() } };
    const mockMessageEl = { textContent: '' };
    globalThis.document.getElementById = vi.fn((id) => {
      if (id === 'loading-overlay') return mockOverlay;
      if (id === 'loading-message') return mockMessageEl;
      return null;
    });

    Utils.showLoading('Please wait');

    expect(mockMessageEl.textContent).toBe('Please wait');
    expect(mockOverlay.classList.remove).toHaveBeenCalledWith('d-none');

    globalThis.document.getElementById = vi.fn(() => null);
  });

  it('hideLoading does nothing when overlay element is null', () => {
    globalThis.document.getElementById = vi.fn(() => null);
    expect(() => Utils.hideLoading()).not.toThrow();
    globalThis.document.getElementById = vi.fn(() => null);
  });

  it('hideLoading adds d-none class when overlay exists', () => {
    const mockOverlay = { classList: { add: vi.fn() } };
    globalThis.document.getElementById = vi.fn((id) => {
      if (id === 'loading-overlay') return mockOverlay;
      return null;
    });

    Utils.hideLoading();
    expect(mockOverlay.classList.add).toHaveBeenCalledWith('d-none');

    globalThis.document.getElementById = vi.fn(() => null);
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a given date', () => {
    const date = new Date('2024-01-15T10:30:00');
    const result = Utils.formatDate(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('defaults to current date when no argument provided', () => {
    const result = Utils.formatDate();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('waitForJSZip', () => {
  it('resolves immediately when JSZip is already defined', async () => {
    globalThis.JSZip = {};
    await expect(Utils.waitForJSZip()).resolves.toBeUndefined();
    delete globalThis.JSZip;
  });

  it('rejects after timeout when JSZip never loads', async () => {
    vi.useFakeTimers();
    const promise = Utils.waitForJSZip(500);
    vi.advanceTimersByTime(600);
    await expect(promise).rejects.toThrow('JSZip library failed to load');
    vi.useRealTimers();
  });

  it('resolves when JSZip becomes available before timeout', async () => {
    vi.useFakeTimers();
    const promise = Utils.waitForJSZip(1000);
    // Simulate JSZip loading after 200ms
    setTimeout(() => { globalThis.JSZip = {}; }, 200);
    vi.advanceTimersByTime(300);
    await expect(promise).resolves.toBeUndefined();
    delete globalThis.JSZip;
    vi.useRealTimers();
  });
});

describe('updateProgress', () => {
  it('returns early when progressBar or progressContainer is null', () => {
    globalThis.document.getElementById = vi.fn(() => null);
    expect(() => Utils.updateProgress(1)).not.toThrow();
    globalThis.document.getElementById = vi.fn(() => null);
  });

  it('sets progress bar width and aria value', () => {
    const mockBar = { style: {}, setAttribute: vi.fn() };
    const mockContainer = { style: {} };
    globalThis.document.getElementById = vi.fn((id) => {
      if (id === 'progress-bar') return mockBar;
      if (id === 'progress-indicator') return mockContainer;
      return null;
    });

    Utils.updateProgress(2);

    expect(mockBar.style.width).toBe(`${(2 / 3) * 100}%`);
    expect(mockBar.setAttribute).toHaveBeenCalledWith('aria-valuenow', (2 / 3) * 100);
    expect(mockContainer.style.display).toBe('block');

    globalThis.document.getElementById = vi.fn(() => null);
  });
});
