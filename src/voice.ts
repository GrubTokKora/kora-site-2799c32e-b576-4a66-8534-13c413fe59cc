import { getApiBaseUrl } from './config';

export type VoiceSessionBootstrap = {
  websocket_url: string;
  client_secret: string;
  expires_at?: number | null;
  session?: Record<string, unknown>;
  kora_session_id?: string;
  initial_greeting?: string;
};

/** Shown to site visitors; never include HTTP status or API JSON in this string. */
export const PUBLIC_VOICE_VISITOR_UNAVAILABLE_MESSAGE =
  "Voice assistant isn't available right now. Please try again later.";

export async function createVoiceSession(
  payload: { business_id: string; locale?: string; page_context?: Record<string, unknown> },
): Promise<VoiceSessionBootstrap> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    try {
      const body = await response.text();
      console.warn('[KoraVoice] session bootstrap failed', response.status, body);
    } catch {
      console.warn('[KoraVoice] session bootstrap failed', response.status);
    }
    throw new Error(PUBLIC_VOICE_VISITOR_UNAVAILABLE_MESSAGE);
  }
  return await response.json();
}

/**
 * Best-effort close for metering/quota enforcement.
 * Use `keepalive: true` so browsers can send it during unload.
 */
export async function closeVoiceSession(
  koraSessionId: string,
  businessId: string,
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  if (!koraSessionId) return;
  try {
    const response = await fetch(
      `${apiBaseUrl}/api/v1/public/voice/session/${encodeURIComponent(koraSessionId)}/close`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
        keepalive: true,
      },
    );
    // Never block UI on close; ignore errors.
    void response;
  } catch (e) {
    console.warn('[KoraVoice] session close failed', e);
  }
}

export async function submitVoiceInquiry(
  payload: {
    business_id: string;
    kora_session_id: string;
    form_type?: string;
    form_data: Record<string, unknown>;
    submitter_email?: string | null;
  },
): Promise<void> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      business_id: payload.business_id,
      kora_session_id: payload.kora_session_id,
      form_type: payload.form_type || 'voice_inquiry',
      form_data: payload.form_data || {},
      submitter_email: payload.submitter_email || null,
    }),
  });

  if (!response.ok) {
    try {
      const body = await response.text();
      console.warn('[KoraVoice] inquiry submit failed', response.status, body);
    } catch {
      console.warn('[KoraVoice] inquiry submit failed', response.status);
    }
    throw new Error(PUBLIC_VOICE_VISITOR_UNAVAILABLE_MESSAGE);
  }
}
