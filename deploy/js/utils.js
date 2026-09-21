/**
 * Shared application utility functions
 */

class Utils {
  /**
   * Show flash message
   */
  static showFlashMessage(message, type = 'info') {
    const container = document.getElementById('flash-messages');
    if (!container) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    
    const icons = {
      error: 'exclamation-triangle-fill',
      warning: 'exclamation-triangle',
      success: 'check-circle-fill',
      info: 'info-circle-fill'
    };
    
    alertDiv.innerHTML = `
      <i class="bi bi-${icons[type] || icons.info} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    container.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }

  /**
   * Show loading overlay
   */
  static showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const messageEl = document.getElementById('loading-message');
    if (overlay) {
      if (messageEl) messageEl.textContent = message;
      overlay.classList.remove('d-none');
    }
  }

  /**
   * Hide loading overlay
   */
  static hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('d-none');
    }
  }

  /**
   * Update progress indicator
   */
  static updateProgress(step) {
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-indicator');
    
    if (!progressBar || !progressContainer) return;
    
    const progress = (step / 3) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    
    if (step > 0) {
      progressContainer.style.display = 'block';
    }
    
    // Update step indicators
    for (let i = 1; i <= 3; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        const icon = stepEl.querySelector('i');
        if (i <= step) {
          stepEl.classList.add('text-primary', 'fw-semibold');
          if (icon) {
            icon.className = `bi bi-${i}-circle-fill`;
          }
        } else {
          stepEl.classList.remove('text-primary', 'fw-semibold');
          if (icon) {
            icon.className = `bi bi-${i}-circle`;
          }
        }
      }
    }
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Format date
   */
  static formatDate(date = new Date()) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Get provider display name
   */
  static getProviderName(provider) {
    const names = {
      aws: 'Amazon Web Services',
      azure: 'Microsoft Azure',
      gcp: 'Google Cloud Platform'
    };
    return names[provider] || provider;
  }

  /**
   * Get provider icon class
   */
  static getProviderIcon(provider) {
    const icons = {
      aws: 'bi-amazon text-warning',
      azure: 'bi-microsoft text-info',
      gcp: 'bi-google text-success'
    };
    return icons[provider] || 'bi-cloud';
  }

  /**
   * Download file
   */
  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get from localStorage
   */
  static getStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set to localStorage
   */
  static setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear storage
   */
  static clearStorage() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape HTML
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format number with commas
   */
  static formatNumber(num) {
    return num.toLocaleString('en-US');
  }

  /**
   * Wait for JSZip library to be available
   * @param {number} timeout - Maximum time to wait in milliseconds (default: 5000)
   * @returns {Promise<void>}
   */
  static async waitForJSZip(timeout = 5000) {
    if (typeof JSZip !== 'undefined') {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInterval = 100; // Check every 100ms

      const checkJSZip = setInterval(() => {
        if (typeof JSZip !== 'undefined') {
          clearInterval(checkJSZip);
          resolve();
        } else if (Date.now() - startTime >= timeout) {
          clearInterval(checkJSZip);
          reject(new Error('JSZip library failed to load. Please check your internet connection and try again.'));
        }
      }, checkInterval);
    });
  }

  // =========================================================================
  // SENSITIVE DATA HANDLING - Provider Credentials with AES-GCM Encryption
  // =========================================================================

  // Storage keys
  static CREDENTIALS_KEY = 'databricks_encrypted_credentials';
  static SALT_KEY = 'databricks_credentials_salt';
  static VERIFY_KEY = 'databricks_credentials_verify';

  // Session timeout (30 minutes in milliseconds)
  static VAULT_SESSION_TIMEOUT = 30 * 60 * 1000;

  // In-memory session key (derived from master password)
  static _sessionKey = null;
  
  // Session timestamp (when vault was unlocked or last activity)
  static _sessionTimestamp = null;

  /**
   * Mask sensitive value showing only first 4 and last 4 characters
   * @param {string} value - The sensitive value to mask
   * @returns {string} Masked value or placeholder if not set
   */
  static maskSensitiveValue(value) {
    if (!value || value.length < 9) {
      // Too short to mask meaningfully, show as fully masked
      return value ? '••••••••' : '';
    }
    const first4 = value.substring(0, 4);
    const last4 = value.substring(value.length - 4);
    return `${first4}••••••••${last4}`;
  }

  /**
   * Obfuscate sensitive value to prevent trivial HTML inspection
   * Uses Base64 encoding with a simple transformation
   * Used for display security in HTML data attributes
   * @param {string} value - The value to obfuscate
   * @returns {string} Obfuscated value
   */
  static obfuscateHtmlContent(value) {
    if (!value) return '';
    try {
      // Reverse the string and then Base64 encode
      const reversed = value.split('').reverse().join('');
      return btoa(encodeURIComponent(reversed));
    } catch {
      return '';
    }
  }

  /**
   * Deobfuscate a value that was obfuscated with obfuscateHtmlContent
   * @param {string} encoded - The obfuscated value
   * @returns {string} Original value
   */
  static deobfuscateValue(encoded) {
    if (!encoded) return '';
    try {
      // Base64 decode and then reverse the string
      const reversed = decodeURIComponent(atob(encoded));
      return reversed.split('').reverse().join('');
    } catch {
      return '';
    }
  }

  /**
   * Generate a random salt for key derivation
   * @returns {Uint8Array} Random 16-byte salt
   */
  static generateSalt() {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Generate a random IV for AES-GCM encryption
   * @returns {Uint8Array} Random 12-byte IV
   */
  static generateIV() {
    return crypto.getRandomValues(new Uint8Array(12));
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} Base64 encoded string
   */
  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   * @param {string} base64 - The Base64 string to convert
   * @returns {Uint8Array} Decoded bytes
   */
  static base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Derive an AES-GCM key from a password using PBKDF2
   * @param {string} password - The master password
   * @param {Uint8Array} salt - The salt for key derivation
   * @returns {Promise<CryptoKey>} Derived AES-GCM key
   */
  static async deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string} plaintext - The data to encrypt
   * @param {CryptoKey} key - The AES-GCM key
   * @returns {Promise<{iv: string, ciphertext: string}>} Encrypted data with IV
   */
  static async encrypt(plaintext, key) {
    const encoder = new TextEncoder();
    const iv = this.generateIV();
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(plaintext)
    );

    return {
      iv: this.arrayBufferToBase64(iv),
      ciphertext: this.arrayBufferToBase64(ciphertext)
    };
  }

  /**
   * Decrypt data using AES-GCM
   * @param {string} ciphertextBase64 - The encrypted data (Base64)
   * @param {string} ivBase64 - The IV used for encryption (Base64)
   * @param {CryptoKey} key - The AES-GCM key
   * @returns {Promise<string>} Decrypted plaintext
   */
  static async decrypt(ciphertextBase64, ivBase64, key) {
    const decoder = new TextDecoder();
    const iv = this.base64ToArrayBuffer(ivBase64);
    const ciphertext = this.base64ToArrayBuffer(ciphertextBase64);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    return decoder.decode(plaintext);
  }

  /**
   * Check if master password has been configured
   * @returns {boolean} True if credentials vault exists
   */
  static hasCredentialsVault() {
    return localStorage.getItem(this.SALT_KEY) !== null;
  }

  /**
   * Check if the vault is unlocked (session key is available and not expired)
   * @returns {boolean} True if vault is unlocked and session is valid
   */
  static isVaultUnlocked() {
    if (this._sessionKey === null) {
      return false;
    }
    
    // Check if session has expired
    if (this._sessionTimestamp) {
      const elapsed = Date.now() - this._sessionTimestamp;
      if (elapsed > this.VAULT_SESSION_TIMEOUT) {
        // Session expired, auto-lock the vault
        this.lockVault();
        return false;
      }
    }
    
    return true;
  }

  /**
   * Extend the vault session timeout (reset the timer)
   * Called automatically on credential operations
   */
  static extendVaultSession() {
    if (this._sessionKey !== null) {
      this._sessionTimestamp = Date.now();
    }
  }

  /**
   * Get remaining session time in milliseconds
   * @returns {number} Remaining time or 0 if expired/locked
   */
  static getVaultSessionRemaining() {
    if (!this._sessionKey || !this._sessionTimestamp) {
      return 0;
    }
    const elapsed = Date.now() - this._sessionTimestamp;
    const remaining = this.VAULT_SESSION_TIMEOUT - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Format remaining session time as human-readable string
   * @returns {string} Formatted time (e.g., "25 min")
   */
  static formatVaultSessionRemaining() {
    const remaining = this.getVaultSessionRemaining();
    if (remaining <= 0) return 'Expired';
    
    const minutes = Math.ceil(remaining / 60000);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes} min`;
  }

  /**
   * Set up a new credentials vault with a master password
   * @param {string} masterPassword - The master password to set
   * @returns {Promise<boolean>} Success status
   */
  static async setupCredentialsVault(masterPassword) {
    if (!masterPassword || masterPassword.length < 8) {
      throw new Error('Master password must be at least 8 characters');
    }

    try {
      // Generate and store salt
      const salt = this.generateSalt();
      localStorage.setItem(this.SALT_KEY, this.arrayBufferToBase64(salt));

      // Derive key from password
      const key = await this.deriveKey(masterPassword, salt);

      // Create verification token
      const verifyData = await this.encrypt('DATABRICKS_VAULT_VERIFY', key);
      localStorage.setItem(this.VERIFY_KEY, JSON.stringify(verifyData));

      // Initialize empty credentials store
      const emptyCredentials = { aws: {}, azure: {}, gcp: {} };
      const encryptedCreds = await this.encrypt(JSON.stringify(emptyCredentials), key);
      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(encryptedCreds));

      // Store key in session memory and set session timestamp
      this._sessionKey = key;
      this._sessionTimestamp = Date.now();

      return true;
    } catch (error) {
      console.error('Failed to setup credentials vault:', error);
      // Cleanup on failure
      localStorage.removeItem(this.SALT_KEY);
      localStorage.removeItem(this.VERIFY_KEY);
      localStorage.removeItem(this.CREDENTIALS_KEY);
      throw error;
    }
  }

  /**
   * Unlock the credentials vault with the master password
   * @param {string} masterPassword - The master password
   * @returns {Promise<boolean>} True if unlocked successfully
   */
  static async unlockVault(masterPassword) {
    const saltBase64 = localStorage.getItem(this.SALT_KEY);
    const verifyData = localStorage.getItem(this.VERIFY_KEY);

    if (!saltBase64 || !verifyData) {
      throw new Error('Credentials vault not found. Please set up a master password first.');
    }

    try {
      const salt = this.base64ToArrayBuffer(saltBase64);
      const key = await this.deriveKey(masterPassword, salt);

      // Verify the password by decrypting verification token
      const { iv, ciphertext } = JSON.parse(verifyData);
      const decrypted = await this.decrypt(ciphertext, iv, key);

      if (decrypted !== 'DATABRICKS_VAULT_VERIFY') {
        throw new Error('Invalid master password');
      }

      // Store key in session memory and set session timestamp
      this._sessionKey = key;
      this._sessionTimestamp = Date.now();
      return true;
    } catch (error) {
      if (error.name === 'OperationError') {
        throw new Error('Invalid master password');
      }
      throw error;
    }
  }

  /**
   * Lock the credentials vault (clear session key and timestamp)
   */
  static lockVault() {
    this._sessionKey = null;
    this._sessionTimestamp = null;
  }

  /**
   * Change the master password
   * @param {string} currentPassword - Current master password
   * @param {string} newPassword - New master password
   * @returns {Promise<boolean>} Success status
   */
  static async changeMasterPassword(currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New master password must be at least 8 characters');
    }

    // First, unlock with current password to get credentials
    const wasUnlocked = this.isVaultUnlocked();
    if (!wasUnlocked) {
      await this.unlockVault(currentPassword);
    }

    // Get all current credentials
    const allCredentials = await this._getAllCredentials();

    // Generate new salt
    const newSalt = this.generateSalt();
    const newKey = await this.deriveKey(newPassword, newSalt);

    // Re-encrypt everything with new key
    const newVerifyData = await this.encrypt('DATABRICKS_VAULT_VERIFY', newKey);
    const newEncryptedCreds = await this.encrypt(JSON.stringify(allCredentials), newKey);

    // Update storage
    localStorage.setItem(this.SALT_KEY, this.arrayBufferToBase64(newSalt));
    localStorage.setItem(this.VERIFY_KEY, JSON.stringify(newVerifyData));
    localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(newEncryptedCreds));

    // Update session key
    this._sessionKey = newKey;

    return true;
  }

  /**
   * Get all credentials (internal use)
   * @returns {Promise<Object>} All credentials by provider
   */
  static async _getAllCredentials() {
    if (!this._sessionKey) {
      throw new Error('Vault is locked. Please unlock with master password.');
    }

    const encryptedData = localStorage.getItem(this.CREDENTIALS_KEY);
    if (!encryptedData) {
      return { aws: {}, azure: {}, gcp: {} };
    }

    try {
      const { iv, ciphertext } = JSON.parse(encryptedData);
      const decrypted = await this.decrypt(ciphertext, iv, this._sessionKey);
      return JSON.parse(decrypted);
    } catch {
      return { aws: {}, azure: {}, gcp: {} };
    }
  }

  /**
   * Save all credentials (internal use)
   * @param {Object} allCredentials - All credentials by provider
   * @returns {Promise<boolean>} Success status
   */
  static async _saveAllCredentials(allCredentials) {
    if (!this._sessionKey) {
      throw new Error('Vault is locked. Please unlock with master password.');
    }

    try {
      const encryptedCreds = await this.encrypt(JSON.stringify(allCredentials), this._sessionKey);
      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(encryptedCreds));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider credentials from encrypted storage
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @returns {Promise<Object|null>} Credentials object or null
   */
  static async getProviderCredentials(provider) {
    if (!provider) return null;
    if (!this.isVaultUnlocked()) return null;

    try {
      // Extend session on credential access
      this.extendVaultSession();
      const allCreds = await this._getAllCredentials();
      return allCreds[provider.toLowerCase()] || null;
    } catch {
      return null;
    }
  }

  /**
   * Synchronous version - returns null if vault is locked
   * For backward compatibility with existing code
   * @param {string} provider - Cloud provider
   * @returns {Object|null} Credentials or null
   */
  static getProviderCredentialsSync(provider) {
    // This is used for quick checks, returns cached value
    // For actual credential values, use async version
    if (!provider || !this._sessionKey) return null;
    return this._cachedCredentials?.[provider.toLowerCase()] || null;
  }

  /**
   * Save provider credentials to encrypted storage
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @param {Object} credentials - Credentials object with accountId, clientId, clientSecret
   * @returns {Promise<boolean>} Success status
   */
  static async setProviderCredentials(provider, credentials) {
    if (!provider || !credentials) return false;
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock with master password.');
    }

    try {
      // Extend session on credential operation
      this.extendVaultSession();
      
      const allCreds = await this._getAllCredentials();
      allCreds[provider.toLowerCase()] = credentials;
      const success = await this._saveAllCredentials(allCreds);
      
      // Update cache for sync access
      if (!this._cachedCredentials) this._cachedCredentials = {};
      this._cachedCredentials[provider.toLowerCase()] = credentials;
      
      return success;
    } catch {
      return false;
    }
  }

  /**
   * Clear provider credentials from encrypted storage
   * @param {string} provider - Cloud provider (aws, azure, gcp), or null to clear all
   * @returns {Promise<boolean>} Success status
   */
  static async clearProviderCredentials(provider = null) {
    if (!this.isVaultUnlocked()) {
      throw new Error('Vault is locked. Please unlock with master password.');
    }

    try {
      // Extend session on credential operation
      this.extendVaultSession();
      
      if (provider) {
        const allCreds = await this._getAllCredentials();
        allCreds[provider.toLowerCase()] = {};
        await this._saveAllCredentials(allCreds);
        
        // Update cache
        if (this._cachedCredentials) {
          this._cachedCredentials[provider.toLowerCase()] = {};
        }
      } else {
        // Clear all credentials
        const emptyCreds = { aws: {}, azure: {}, gcp: {} };
        await this._saveAllCredentials(emptyCreds);
        this._cachedCredentials = emptyCreds;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete the entire credentials vault
   * @returns {boolean} Success status
   */
  static deleteCredentialsVault() {
    try {
      localStorage.removeItem(this.SALT_KEY);
      localStorage.removeItem(this.VERIFY_KEY);
      localStorage.removeItem(this.CREDENTIALS_KEY);
      this._sessionKey = null;
      this._sessionTimestamp = null;
      this._cachedCredentials = null;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if provider has credentials configured
   * @param {string} provider - Cloud provider (aws, azure, gcp)
   * @returns {Promise<boolean>} True if any credentials are configured
   */
  static async hasProviderCredentials(provider) {
    const creds = await this.getProviderCredentials(provider);
    if (!creds) return false;
    // Check if at least one credential is set
    return !!(creds.accountId || creds.clientId || creds.clientSecret);
  }

  /**
   * Synchronous check - uses cached data
   * @param {string} provider - Cloud provider
   * @returns {boolean} True if credentials exist in cache
   */
  static hasProviderCredentialsSync(provider) {
    if (!this._sessionKey) return false;
    const creds = this._cachedCredentials?.[provider?.toLowerCase()];
    if (!creds) return false;
    return !!(creds.accountId || creds.clientId || creds.clientSecret);
  }

  /**
   * Get a specific credential value for a provider
   * @param {string} provider - Cloud provider
   * @param {string} field - Field name (accountId, clientId, clientSecret)
   * @returns {Promise<string|null>} The credential value or null
   */
  static async getCredentialValue(provider, field) {
    const creds = await this.getProviderCredentials(provider);
    return creds ? creds[field] || null : null;
  }

  /**
   * Refresh cached credentials after unlocking vault
   * @returns {Promise<void>}
   */
  static async refreshCredentialsCache() {
    if (!this.isVaultUnlocked()) {
      this._cachedCredentials = null;
      return;
    }
    try {
      // Extend session on credential access
      this.extendVaultSession();
      this._cachedCredentials = await this._getAllCredentials();
    } catch {
      this._cachedCredentials = { aws: {}, azure: {}, gcp: {} };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
