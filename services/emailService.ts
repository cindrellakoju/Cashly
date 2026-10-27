import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface SendPinResult {
  success: boolean;
  message?: string;
  error?: string;
  recipient?: string;
}

/**
 * Dispatches PIN recovery email to the recipient using the system Gmail SMTP server.
 */
export async function sendPinRecoveryEmail(params: {
  target: 'admin' | 'account';
  newPin: string;
  recipientEmail: string;
}): Promise<SendPinResult> {
  const { target, newPin, recipientEmail } = params;

  // Build candidate server endpoints to reach
  const endpoints: string[] = [];

  // Custom override from .env
  const customUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL;
  if (customUrl && customUrl.trim()) {
    endpoints.push(customUrl.trim());
  }

  // Web environment
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    endpoints.push(`${window.location.origin}/api/send-pin`);
    endpoints.push('http://localhost:3001/send-pin');
  }

  // Mobile / Expo Go environment
  // hostUri provides the computer's LAN IP when connected via Expo Go (e.g. 192.168.1.10:8081)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2?.extra?.expoGo as any)?.debuggerHost ||
    '';
  const hostIp = hostUri ? hostUri.split(':')[0] : 'localhost';

  if (hostIp && hostIp !== 'localhost') {
    endpoints.push(`http://${hostIp}:8081/api/send-pin`);
    endpoints.push(`http://${hostIp}:3001/send-pin`);
  }

  // Localhost fallbacks
  endpoints.push('http://localhost:8081/api/send-pin');
  endpoints.push('http://localhost:3001/send-pin');
  endpoints.push('http://10.0.2.2:3001/send-pin'); // Android Emulator localhost
  endpoints.push('http://10.0.2.2:8081/api/send-pin');

  // De-duplicate endpoints
  const uniqueEndpoints = Array.from(new Set(endpoints));

  let lastError = '';

  for (const endpoint of uniqueEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s — Gmail SMTP can be slow

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          target,
          newPin,
          recipientEmail,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Email sent successfully via Gmail SMTP!',
          recipient: recipientEmail,
        };
      }

      if (data.error === 'MISSING_APP_PASSWORD') {
        return {
          success: false,
          error: 'MISSING_APP_PASSWORD',
          message:
            'Google App Password is not configured in .env yet. Please open .env and add your 16-character Google App Password to GMAIL_APP_PASSWORD.',
        };
      }

      if (data.message) {
        lastError = data.message;
      }
    } catch (e: any) {
      // Silently skip aborted/cancelled requests — move to next endpoint
      const msg: string = e?.message || '';
      const isAbort =
        e?.name === 'AbortError' ||
        msg.toLowerCase().includes('abort') ||
        msg.toLowerCase().includes('cancel');
      if (!isAbort) {
        lastError = msg || 'Network request failed';
      }
    }
  }

  return {
    success: false,
    error: 'CONNECTION_FAILED',
    message:
      lastError ||
      'Could not connect to the email dispatch service. Make sure your Expo server or email-server is running and your Google App Password is set in .env.',
  };
}

/**
 * Sends a 6-digit OTP to the given email for onboarding email verification.
 */
export async function sendVerificationEmail(params: {
  recipientEmail: string;
  otp: string;
}): Promise<SendPinResult> {
  const { recipientEmail, otp } = params;

  const endpoints: string[] = [];

  const customUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL;
  if (customUrl && customUrl.trim()) {
    // Replace /send-pin suffix with /send-verification if present
    endpoints.push(customUrl.trim().replace(/\/send-pin$/, '/send-verification'));
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    endpoints.push(`${window.location.origin}/api/send-verification`);
    endpoints.push('http://localhost:3001/send-verification');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest2?.extra?.expoGo as any)?.debuggerHost ||
    '';
  const hostIp = hostUri ? hostUri.split(':')[0] : 'localhost';

  if (hostIp && hostIp !== 'localhost') {
    endpoints.push(`http://${hostIp}:8081/api/send-verification`);
    endpoints.push(`http://${hostIp}:3001/send-verification`);
  }

  endpoints.push('http://localhost:8081/api/send-verification');
  endpoints.push('http://localhost:3001/send-verification');
  endpoints.push('http://10.0.2.2:3001/send-verification');
  endpoints.push('http://10.0.2.2:8081/api/send-verification');

  const uniqueEndpoints = Array.from(new Set(endpoints));

  let lastError = '';

  for (const endpoint of uniqueEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s — Gmail SMTP can be slow

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ recipientEmail, otp }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Verification email sent!', recipient: recipientEmail };
      }

      if (data.error === 'MISSING_APP_PASSWORD') {
        return {
          success: false,
          error: 'MISSING_APP_PASSWORD',
          message: 'Google App Password is not configured in .env yet.',
        };
      }

      if (data.message) lastError = data.message;
    } catch (e: any) {
      // Silently skip aborted/cancelled requests — move to next endpoint
      const msg: string = e?.message || '';
      const isAbort =
        e?.name === 'AbortError' ||
        msg.toLowerCase().includes('abort') ||
        msg.toLowerCase().includes('cancel');
      if (!isAbort) {
        lastError = msg || 'Network request failed';
      }
    }
  }

  return {
    success: false,
    error: 'CONNECTION_FAILED',
    message: lastError || 'Could not connect to the email service. Make sure your email-server is running.',
  };
}
