// Encryption key rotation system

import crypto from 'crypto'
import { getSupabase } from '../supabase'
import { encrypt, decrypt } from './encryption'

// Helper to get encryption key from environment or database
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  return key
}

export interface KeyRotationResult {
  success: boolean
  oldKeyVersion: number
  newKeyVersion: number
  recordsReEncrypted: number
  errors: string[]
}

/**
 * Generate a new encryption key
 */
export function generateNewEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Rotate encryption key and re-encrypt data
 * This is a long-running operation that should be run as a background job
 */
export async function rotateEncryptionKey(
  newKey?: string,
  batchSize: number = 100
): Promise<KeyRotationResult> {
  const result: KeyRotationResult = {
    success: false,
    oldKeyVersion: 0,
    newKeyVersion: 0,
    recordsReEncrypted: 0,
    errors: []
  }

  try {
    const supabase = getSupabase()
    
    // Get current key version
    const { data: currentKey } = await supabase
      .from('encryption_keys')
      .select('version, key')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (!currentKey) {
      // First time setup - create initial key
      const initialKey = newKey || generateNewEncryptionKey()
      const { error: insertError } = await supabase
        .from('encryption_keys')
        .insert({
          version: 1,
          key: initialKey,
          is_active: true,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        result.errors.push(`Failed to create initial key: ${insertError.message}`)
        return result
      }

      result.oldKeyVersion = 0
      result.newKeyVersion = 1
      result.success = true
      return result
    }

    result.oldKeyVersion = currentKey.version
    result.newKeyVersion = currentKey.version + 1

    // Generate new key if not provided
    const newEncryptionKey = newKey || generateNewEncryptionKey()

    // Mark old key as inactive
    await supabase
      .from('encryption_keys')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('version', currentKey.version)

    // Insert new key
    const { error: keyInsertError } = await supabase
      .from('encryption_keys')
      .insert({
        version: result.newKeyVersion,
        key: newEncryptionKey,
        is_active: true,
        created_at: new Date().toISOString()
      })

    if (keyInsertError) {
      result.errors.push(`Failed to insert new key: ${keyInsertError.message}`)
      return result
    }

    // Re-encrypt data in batches
    // Note: This assumes you have a table with encrypted fields
    // Adjust table and column names based on your schema
    let offset = 0
    let hasMore = true

    while (hasMore) {
      // Get batch of records with encrypted data
      // Example: profiles table with encrypted phone numbers
      const { data: records, error: fetchError } = await supabase
        .from('profiles')
        .select('id, phone_encrypted')
        .not('phone_encrypted', 'is', null)
        .range(offset, offset + batchSize - 1)

      if (fetchError) {
        result.errors.push(`Failed to fetch records: ${fetchError.message}`)
        break
      }

      if (!records || records.length === 0) {
        hasMore = false
        break
      }

      // Re-encrypt each record
      for (const record of records) {
        try {
          // Decrypt with old key
          const oldKey = currentKey.key
          const decrypted = decrypt(record.phone_encrypted, oldKey)

          // Encrypt with new key
          const reEncrypted = encrypt(decrypted, newEncryptionKey)

          // Update record
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              phone_encrypted: reEncrypted,
              encryption_key_version: result.newKeyVersion
            })
            .eq('id', record.id)

          if (updateError) {
            result.errors.push(`Failed to update record ${record.id}: ${updateError.message}`)
          } else {
            result.recordsReEncrypted++
          }
        } catch (error: any) {
          result.errors.push(`Error re-encrypting record ${record.id}: ${error.message}`)
        }
      }

      offset += batchSize
      
      // Add delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    result.success = result.errors.length === 0 || result.recordsReEncrypted > 0

    return result
  } catch (error: any) {
    result.errors.push(`Key rotation failed: ${error.message}`)
    return result
  }
}

/**
 * Get current active encryption key
 */
export async function getCurrentEncryptionKey(): Promise<string | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('encryption_keys')
      .select('key')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Fallback to environment variable
      return getEncryptionKey()
    }

    return data.key
  } catch (error) {
    console.error('[KeyRotation] Error getting current key:', error)
    return getEncryptionKey()
  }
}

/**
 * Schedule key rotation (to be called by cron job)
 */
export async function scheduleKeyRotation(): Promise<void> {
  try {
    // Check if rotation is needed (e.g., every 90 days)
    const supabase = getSupabase()
    const { data: lastRotation } = await supabase
      .from('encryption_keys')
      .select('created_at')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (!lastRotation) {
      // No key exists, create initial key
      await rotateEncryptionKey()
      return
    }

    const daysSinceRotation = (Date.now() - new Date(lastRotation.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const rotationInterval = parseInt(process.env.ENCRYPTION_KEY_ROTATION_DAYS || '90', 10)

    if (daysSinceRotation >= rotationInterval) {
      console.log(`[KeyRotation] Rotating encryption key (${daysSinceRotation.toFixed(0)} days since last rotation)`)
      const result = await rotateEncryptionKey()
      
      if (result.success) {
        console.log(`[KeyRotation] Successfully rotated key. Re-encrypted ${result.recordsReEncrypted} records.`)
      } else {
        console.error(`[KeyRotation] Key rotation completed with errors:`, result.errors)
      }
    }
  } catch (error) {
    console.error('[KeyRotation] Error scheduling key rotation:', error)
  }
}

