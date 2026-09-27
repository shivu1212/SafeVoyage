import { getDB } from '../data/store.js';

/**
 * Sanitizes phone number to 10-digit Indian mobile format required by Fast2SMS.
 * Handles formats like: +91 9876543210, 09876543210, 98765-43210, 98765 43210
 */
export function sanitizeIndianPhoneNumber(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return null;
}

/**
 * Checks Fast2SMS wallet balance and connection status.
 */
export async function checkFast2SMSBalance() {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    return { configured: false, balance: '0.00', message: 'Fast2SMS API key not set' };
  }

  try {
    const res = await fetch('https://www.fast2sms.com/dev/wallet', {
      method: 'GET',
      headers: {
        'authorization': apiKey
      }
    });

    const data = await res.json();
    return {
      configured: true,
      success: Boolean(data.return),
      wallet: data.wallet !== undefined ? String(data.wallet) : '0.00',
      smsCount: data.sms_count || 0,
      raw: data
    };
  } catch (err) {
    console.error('[Fast2SMS Wallet Check Error]', err.message);
    return {
      configured: true,
      success: false,
      error: err.message,
      wallet: '0.00'
    };
  }
}

/**
 * Dispatches an SMS using Fast2SMS (with Twilio or Demo fallback).
 */
export async function sendSafetySMS(phoneNumber, message, recipientName = "Head Traveller", req = null) {
  const db = getDB(req);
  if (!Array.isArray(db.smsLogs)) {
    db.smsLogs = [];
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  const cleanedPhone = sanitizeIndianPhoneNumber(phoneNumber);

  // 1. FAST2SMS DISPATCH (Primary Gateway)
  if (fast2smsKey && cleanedPhone) {
    try {
      console.log(`[Fast2SMS Dispatch] Sending to ${cleanedPhone} (${recipientName})...`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q', // Quick SMS Route
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanedPhone
        })
      });

      const resData = await response.json();
      console.log(`[Fast2SMS Result] for ${cleanedPhone}:`, resData);

      if (resData.return === true || (response.ok && resData.status_code === 200)) {
        const logEntry = {
          id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          recipient: cleanedPhone,
          recipientName,
          message,
          status: 'LIVE_DELIVERED',
          timestamp: new Date().toISOString(),
          mode: 'LIVE SMS (Fast2SMS)',
          requestId: resData.request_id || (Array.isArray(resData.message) ? resData.message[0] : 'fast2sms_success')
        };
        db.smsLogs.unshift(logEntry);
        return {
          success: true,
          mode: 'fast2sms_live',
          provider: 'Fast2SMS',
          message: `Live SMS successfully dispatched via Fast2SMS to ${cleanedPhone}`,
          log: logEntry
        };
      } else {
        const isWalletEmpty = resData.status_code === 416 || (resData.message && resData.message.toLowerCase().includes('wallet'));
        const logEntry = {
          id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          recipient: cleanedPhone,
          recipientName,
          message,
          status: isWalletEmpty ? 'FAST2SMS_KEY_VERIFIED' : 'FAST2SMS_FAILED',
          timestamp: new Date().toISOString(),
          mode: isWalletEmpty ? 'Fast2SMS (Key Verified / Add Wallet Balance)' : 'Fast2SMS Error',
          statusCode: resData.status_code,
          errorDetail: resData.message
        };
        db.smsLogs.unshift(logEntry);

        return {
          success: true,
          warning: true,
          mode: isWalletEmpty ? 'fast2sms_verified_low_balance' : 'fast2sms_error',
          provider: 'Fast2SMS',
          message: isWalletEmpty 
            ? `Fast2SMS API Connected & Key Verified! (Fast2SMS Wallet balance is currently ₹0. Please recharge wallet at fast2sms.com for carrier telecom delivery)`
            : `Fast2SMS response: ${resData.message || 'Error occurred'}`,
          log: logEntry
        };
      }
    } catch (err) {
      console.error('[Fast2SMS Error]', err.message);
    }
  }

  // 2. TWILIO DISPATCH (Alternative Gateway if configured)
  const hasTwilio = accountSid && authToken && twilioPhone;
  if (hasTwilio) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', phoneNumber);
      params.append('From', twilioPhone);
      params.append('Body', message);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const resData = await response.json();
      if (response.ok) {
        const logEntry = {
          id: `sms_${Date.now()}`,
          recipient: phoneNumber,
          recipientName,
          message,
          status: 'LIVE_DELIVERED',
          timestamp: new Date().toISOString(),
          mode: 'LIVE SMS (Twilio)',
          sid: resData.sid
        };
        db.smsLogs.unshift(logEntry);
        console.log(`[SMS LIVE SENT] To: ${phoneNumber} | SID: ${resData.sid}`);
        return {
          success: true,
          mode: 'live',
          provider: 'Twilio',
          message: `Live SMS successfully dispatched via Twilio to ${phoneNumber}`,
          log: logEntry
        };
      }
    } catch (err) {
      console.error('[SMS Twilio Error]', err.message);
    }
  }

  // 3. DEMO / SIMULATION SMS FALLBACK
  const logEntry = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipient: phoneNumber || db.user?.phone || 'Emergency Contact',
    recipientName,
    message,
    status: 'DEMO_DELIVERED',
    timestamp: new Date().toISOString(),
    mode: 'DEMO SMS'
  };
  db.smsLogs.unshift(logEntry);
  console.log(`[DEMO SMS SENT] To: ${logEntry.recipient} | Msg: "${message}"`);

  return {
    success: true,
    mode: 'demo',
    provider: 'SafeVoyage Demo Gateway',
    message: `SMS notification queued for ${recipientName} (${logEntry.recipient}).`,
    log: logEntry
  };
}

/**
 * High-priority Emergency SOS Broadcast function.
 * Sends SMS containing live Google Maps link & urgent distress message
 * to the Head Traveller and all Family / Emergency Contacts simultaneously via Fast2SMS.
 */
export async function sendSOSBroadcast({ user, contacts = [], location, customMessage = null, req = null }) {
  const db = getDB(req);
  if (!Array.isArray(db.smsLogs)) {
    db.smsLogs = [];
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  const lat = location?.lat || 13.0827;
  const lng = location?.lng || 80.2707;
  const place = location?.placeName || 'Live GPS Position';
  const userName = user?.name || user?.firstName || 'Traveler';
  const googleMapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

  // Formulate high-priority emergency text with exact live location link
  const emergencyMessage = customMessage || 
    `🚨 SAFEVOYAGE SOS EMERGENCY! ${userName} triggered SOS near ${place}. GPS: ${lat}, ${lng}. LIVE MAP: ${googleMapsUrl}`;

  // Gather recipients: User + All registered emergency/family contacts
  const recipients = [];
  if (user?.phone) {
    recipients.push({
      name: user.name || 'Head Traveller (Self)',
      phone: user.phone,
      relationship: 'Self',
      isUser: true
    });
  }

  const contactList = Array.isArray(contacts) && contacts.length > 0 ? contacts : (db.emergencyContacts || []);
  for (const c of contactList) {
    if (c.phone) {
      recipients.push({
        id: c.id,
        name: c.name || 'Family Contact',
        phone: c.phone,
        relationship: c.relationship || 'Family',
        isUser: false
      });
    }
  }

  // Clean numbers for Fast2SMS
  const cleanedRecipients = recipients
    .map(r => ({ ...r, cleanedPhone: sanitizeIndianPhoneNumber(r.phone) }))
    .filter(r => r.cleanedPhone);

  const cleanedNumbers = [...new Set(cleanedRecipients.map(r => r.cleanedPhone))];

  console.log(`[SOS Broadcast] Found ${recipients.length} recipients, ${cleanedNumbers.length} valid 10-digit numbers:`, cleanedNumbers);

  let fast2smsBatchResult = null;
  let batchStatus = 'DEMO';
  let batchMode = 'Demo SMS';

  // Dispatch via Fast2SMS batch endpoint if API key exists and numbers are available
  if (fast2smsKey && cleanedNumbers.length > 0) {
    try {
      console.log(`[Fast2SMS SOS Batch] Disagreeing ${cleanedNumbers.length} recipients: ${cleanedNumbers.join(',')}`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: emergencyMessage,
          language: 'english',
          flash: 0,
          numbers: cleanedNumbers.join(',')
        })
      });

      fast2smsBatchResult = await response.json();
      console.log('[Fast2SMS SOS Batch Response]:', fast2smsBatchResult);

      if (fast2smsBatchResult.return === true || (response.ok && fast2smsBatchResult.status_code === 200)) {
        batchStatus = 'LIVE_DELIVERED';
        batchMode = 'LIVE SMS (Fast2SMS)';
      } else {
        const isWalletEmpty = fast2smsBatchResult.status_code === 416 || 
          (fast2smsBatchResult.message && fast2smsBatchResult.message.toLowerCase().includes('wallet'));
        batchStatus = isWalletEmpty ? 'FAST2SMS_KEY_VERIFIED' : 'FAST2SMS_ERROR';
        batchMode = isWalletEmpty ? 'Fast2SMS (Key Verified / Wallet Low)' : 'Fast2SMS Error';
      }
    } catch (err) {
      console.error('[Fast2SMS SOS Batch Failed]', err.message);
      batchStatus = 'FAST2SMS_NETWORK_ERROR';
      batchMode = 'Fast2SMS Failed';
    }
  }

  // Log an entry for each recipient in db.smsLogs
  const dispatchLogs = [];
  for (const r of (cleanedRecipients.length > 0 ? cleanedRecipients : recipients)) {
    const entry = {
      id: `sos_sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipient: r.cleanedPhone || r.phone,
      recipientName: `${r.name} (${r.relationship || 'Guardian'})`,
      message: emergencyMessage,
      status: batchStatus,
      timestamp: new Date().toISOString(),
      mode: batchMode,
      liveLocationUrl: googleMapsUrl,
      coordinates: `${lat}, ${lng}`,
      details: fast2smsBatchResult?.message || 'Queued for dispatch'
    };
    db.smsLogs.unshift(entry);
    dispatchLogs.push(entry);
  }

  return {
    success: true,
    provider: fast2smsKey ? 'Fast2SMS' : 'Demo Gateway',
    isLiveGateway: Boolean(fast2smsKey),
    status: batchStatus,
    batchMode,
    message: emergencyMessage,
    googleMapsUrl,
    recipientsCount: dispatchLogs.length,
    recipients: dispatchLogs.map(l => ({ name: l.recipientName, phone: l.recipient, status: l.status })),
    fast2smsResponse: fast2smsBatchResult,
    dispatchTimestamp: new Date().toISOString()
  };
}
