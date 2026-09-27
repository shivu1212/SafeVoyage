/**
 * SafeVoyage AI Assistant Service
 * Connects securely to backend AI endpoint without exposing API keys in browser JavaScript
 */

const BASE_URL = '/api';

export const SUGGESTED_QUESTIONS = [
  "Check my itinerary",
  "What's my current risk?",
  "Show active alerts",
  "Is my next activity safe?",
  "Why is my trip risk high?",
  "Recommend safe dining & local food",
  "What should I pack for this trip?"
];

export async function askSentinelAI(query, history = [], tripContext = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const token = localStorage.getItem('safevoyage_token');
    const userJson = localStorage.getItem('safevoyage_auth_user');
    let userId = '';
    if (userJson) {
      try {
        const parsed = JSON.parse(userJson);
        userId = parsed?.id || '';
      } catch (e) {}
    }

    const res = await fetch(`${BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(userId ? { 'x-user-id': userId } : {})
      },
      body: JSON.stringify({
        message: query,
        history,
        context: tripContext
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const userMessage = errorData.error || 'AI Assistant is temporarily unavailable. Please check your API configuration.';
      throw new Error(userMessage);
    }

    const data = await res.json();
    if (data.text) {
      return {
        text: data.text,
        source: data.source || 'SafeVoyage AI Sentinel'
      };
    }

    throw new Error('AI Assistant is temporarily unavailable. Please check your API configuration.');
  } catch (err) {
    console.error('[aiService Error]', err);
    throw new Error(err.message || 'AI Assistant is temporarily unavailable. Please check your API configuration.');
  }
}
