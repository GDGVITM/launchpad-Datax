const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Utility functions for cryptographic operations
 */
class CryptoUtils {
  /**
   * Generate a random nonce for wallet authentication
   * @returns {string} Random nonce
   */
  static generateNonce() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate a secure API key
   * @returns {string} API key
   */
  static generateApiKey() {
    const prefix = 'cs_'; // cybersecurity prefix
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length of the token
   * @returns {string} Random token
   */
  static generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID
   * @returns {string} UUID
   */
  static generateUUID() {
    return uuidv4();
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} Hash
   */
  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data using SHA-512
   * @param {string} data - Data to hash
   * @returns {string} Hash
   */
  static hashSHA512(data) {
    return crypto.createHash('sha512').update(data).digest('hex');
  }

  /**
   * Create HMAC signature
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @returns {string} HMAC signature
   */
  static createHMAC(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} secret - Secret key
   * @returns {boolean} Verification result
   */
  static verifyHMAC(data, signature, secret) {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {object} Encrypted data with IV and auth tag
   */
  static encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from('cybersecurity-saas', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {object} encryptedData - Encrypted data object
   * @param {string} key - Decryption key
   * @returns {string} Decrypted text
   */
  static decrypt(encryptedData, key) {
    try {
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAAD(Buffer.from('cybersecurity-saas', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate blockchain transaction hash (simulation)
   * @param {object} data - Transaction data
   * @returns {string} Transaction hash
   */
  static generateTxHash(data) {
    const dataString = JSON.stringify(data) + Date.now();
    return '0x' + this.hash(dataString);
  }

  /**
   * Generate blockchain address (simulation)
   * @returns {string} Blockchain address
   */
  static generateBlockchainAddress() {
    const randomBytes = crypto.randomBytes(20);
    return '0x' + randomBytes.toString('hex');
  }

  /**
   * Validate Ethereum address format
   * @param {string} address - Address to validate
   * @returns {boolean} Validation result
   */
  static isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Generate secure password hash salt
   * @returns {string} Salt
   */
  static generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }
}

module.exports = CryptoUtils;
