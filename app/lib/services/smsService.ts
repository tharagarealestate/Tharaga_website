/**
 * SMS Service using Twilio
 * Handles SMS notifications to builders
 */

import twilio from 'twilio';
import { getSupabase } from '../supabase';

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface SMSData {
  builderId: string;
  builderPhone: string;
  propertyName: string;
  leadCount: number;
  propertyId?: string;
}

/**
 * Send SMS to builder
 */
export async function sendBuilderSMS(
  data: SMSData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio not configured');
    }

    const message = `Great news! Tharaga generated ${data.leadCount} quality buyers for ${data.propertyName}. Check your email for details. View dashboard: https://tharaga.co.in/dashboard/leads`;

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: data.builderPhone,
    });

    // Log SMS delivery
    await logSMSDelivery({
      propertyId: data.propertyId,
      builderId: data.builderId,
      recipientPhone: data.builderPhone,
      messageBody: message,
      status: 'sent',
      providerMessageId: result.sid,
    });

    return {
      success: true,
      messageId: result.sid
    };

  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error);
    
    // Log failed delivery
    await logSMSDelivery({
      propertyId: data.propertyId,
      builderId: data.builderId,
      recipientPhone: data.builderPhone,
      messageBody: `Great news! Tharaga generated ${data.leadCount} quality buyers for ${data.propertyName}.`,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log SMS delivery to database
 */
async function logSMSDelivery(data: {
  propertyId?: string;
  builderId: string;
  recipientPhone: string;
  messageBody: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  providerMessageId?: string;
  error?: string;
}): Promise<void> {
  try {
    const supabase = getSupabase();

    await supabase
      .from('sms_delivery_logs')
      .insert([{
        property_id: data.propertyId || null,
        builder_id: data.builderId,
        recipient_phone: data.recipientPhone,
        message_body: data.messageBody,
        status: data.status,
        provider_message_id: data.providerMessageId || null,
        sent_at: data.status === 'sent' ? new Date().toISOString() : null,
        provider_response: data.error ? { error: data.error } : null,
      }]);
  } catch (error) {
    console.error('[SMS Service] Error logging delivery:', error);
    // Don't throw - logging is non-critical
  }
}

/**
 * Get builder phone number from database
 */
export async function getBuilderPhone(builderId: string): Promise<string | null> {
  try {
    const supabase = getSupabase();

    // Try to get from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('user_id', builderId)
      .single();

    if (profile?.phone) {
      return profile.phone;
    }

    // Try to get from builders table
    const { data: builder } = await supabase
      .from('builders')
      .select('phone')
      .eq('id', builderId)
      .single();

    if (builder?.phone) {
      return builder.phone;
    }

    return null;
  } catch (error) {
    console.error('[SMS Service] Error fetching builder phone:', error);
    return null;
  }
}

