// Encryption utilities for sensitive data

// Note: This uses Node.js crypto. For client-side, use Web Crypto API or 
// a library like crypto-js. In production, encryption keys should be 
// stored securely in environment variables, not in code.

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const SALT_LENGTH = 64 // 512 bits
const TAG_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Derive encryption key from password
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt sensitive data
 */
export function encrypt(data: string, key: string): string {
  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    
    // Derive key from password
    const derivedKey = deriveKey(key, salt)
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)
    
    // Encrypt data
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Get auth tag
    const tag = cipher.getAuthTag()
    
    // Combine salt + IV + tag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string, key: string): string {
  try {
    // Decode from base64
    const data = Buffer.from(encryptedData, 'base64')
    
    // Extract components
    const salt = data.subarray(0, SALT_LENGTH)
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    // Derive key from password
    const derivedKey = deriveKey(key, salt)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, undefined, 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * Hash sensitive data (one-way)
 */
export function hash(data: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, usedSalt, 100000, 64, 'sha256')
  return {
    hash: hash.toString('hex'),
    salt: usedSalt
  }
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashValue: string, salt: string): boolean {
  const { hash: computedHash } = hash(data, salt)
  return computedHash === hashValue
}

/**
 * Get encryption key from environment
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set')
  }
  return key
}

