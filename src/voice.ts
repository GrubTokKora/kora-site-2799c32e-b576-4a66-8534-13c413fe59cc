import { getApiBaseUrl } from './config';

export type VoiceSessionBootstrap = {
  websocket_url: string;
  client_secret: string;
  expires_at?: number | null;
  session?: Record<string, unknown>;
};

export async function createVoiceSession(
  businessId: string,
  locale: string,
  pageContext: Record<string, unknown>
): Promise<VoiceSessionBootstrap> {
  const apiBaseUrl = getApiBaseUrl();
  const payload = {
    business_id: businessId,
    locale,
    page_context: pageContext,
  };

  const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to create voice session.' }));
    throw new Error(errorData.message || 'Failed to create voice session.');
  }

  return (await response.json()) as VoiceSessionBootstrap;
}