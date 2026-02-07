// Two-Factor Authentication (2FA) utilities
// Supports TOTP, SMS, and Email-based 2FA
// Note: Install speakeasy and qrcode packages for full TOTP support:
// npm install speakeasy qrcode @types/speakeasy @types/qrcode

import { getSupabase } from '../supabase'
import { encrypt, decrypt, getEncryptionKey } from './encryption'

// Optional imports - will be loaded dynamically if available
let speakeasy: any = null
let QRCode: any = null

try {
  speakeasy = require('speakeasy')
  QRCode = require('qrcode')
} catch {
  // Packages not installed - TOTP features will be limited
  console.warn('2FA: speakeasy/qrcode packages not installed. TOTP features limited.')
}

export interface TwoFactorConfig {
  method: 'totp' | 'sms' | 'email'
  phoneNumber?: string
  recoveryEmail?: string
}

export interface BackupCode {
  code: string
  used: boolean
  usedAt?: Date
}

/**
 * Generate TOTP secret for a user
 */
export async function generateTOTPSecret(userId: string): Promise<{
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}> {
  if (!speakeasy || !QRCode) {
    throw new Error('TOTP requires speakeasy and qrcode packages. Install with: npm install speakeasy qrcode @types/speakeasy @types/qrcode')
  }

  const secret = speakeasy.generateSecret({
    name: `Tharaga (${userId})`,
    issuer: 'Tharaga Real Estate'
  })

  const backupCodes = generateBackupCodes(10)
  const encryptedSecret = encrypt(secret.base32, getEncryptionKey())
  const encryptedBackupCodes = backupCodes.map(code => encrypt(code, getEncryptionKey()))

  const supabase = getSupabase()
  await supabase.from('user_2fa').upsert({
    user_id: userId,
    method: 'totp',
    totp_secret: encryptedSecret,
    backup_codes: encryptedBackupCodes,
    enabled: false // Not enabled until verified
  })

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

  return {
    secret: secret.base32!,
    qrCodeUrl,
    backupCodes
  }
}

/**
 * Verify TOTP token
 */
export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  if (!speakeasy) {
    throw new Error('TOTP verification requires speakeasy package')
  }

  const supabase = getSupabase()
  const { data: twoFactorData, error } = await supabase
    .from('user_2fa')
    .select('totp_secret, backup_codes, used_backup_codes')
    .eq('user_id', userId)
    .eq('enabled', true)
    .single()

  if (error || !twoFactorData) {
    return false
  }

  // Try TOTP verification first
  const decryptedSecret = decrypt(twoFactorData.totp_secret, getEncryptionKey())
  const verified = speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after
  })

  if (verified) {
    // Update last used timestamp
    await supabase
      .from('user_2fa')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', userId)
    return true
  }

  // Try backup codes
  const backupCodes = twoFactorData.backup_codes || []
  const usedBackupCodes = twoFactorData.used_backup_codes || []

  for (const encryptedCode of backupCodes) {
    if (usedBackupCodes.includes(encryptedCode)) continue

    const decryptedCode = decrypt(encryptedCode, getEncryptionKey())
    if (decryptedCode === token) {
      // Mark backup code as used
      await supabase
        .from('user_2fa')
        .update({
          used_backup_codes: [...usedBackupCodes, encryptedCode],
          last_used_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      return true
    }
  }

  return false
}

/**
 * Enable 2FA for a user
 */
export async function enable2FA(userId: string, method: 'totp' | 'sms' | 'email'): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from('user_2fa')
    .update({
      enabled: true,
      method,
      enabled_at: new Date().toISOString()
    })
    .eq('user_id', userId)
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  const supabase = getSupabase()
  await supabase
    .from('user_2fa')
    .update({
      enabled: false,
      enabled_at: null
    })
    .eq('user_id', userId)
}

/**
 * Check if 2FA is enabled for a user
 */
export async function is2FAEnabled(userId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('user_2fa')
    .select('enabled')
    .eq('user_id', userId)
    .single()

  return !error && data?.enabled === true
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-digit code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString()
    codes.push(code)
  }
  return codes
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes = generateBackupCodes(10)
  const encryptedBackupCodes = backupCodes.map(code => encrypt(code, getEncryptionKey()))

  const supabase = getSupabase()
  await supabase
    .from('user_2fa')
    .update({
      backup_codes: encryptedBackupCodes,
      used_backup_codes: []
    })
    .eq('user_id', userId)

  return backupCodes
}

