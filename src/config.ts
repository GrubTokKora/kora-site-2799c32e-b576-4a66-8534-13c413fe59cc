const API_BASE_URL_FALLBACK = 'https://kora-agent.quseappdev.com';
// This is Google's v2 test key. The production site will have a real key injected.
const RECAPTCHA_SITE_KEY_FALLBACK = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.KORA_CONFIG?.apiBaseUrl) {
    return window.KORA_CONFIG.apiBaseUrl.replace(/\/+$/, '');
  }
  return API_BASE_URL_FALLBACK;
}

export function getRecaptchaSiteKey(): string {
  if (typeof window !== 'undefined' && window.KORA_CONFIG?.recaptchaSiteKey) {
    return window.KORA_CONFIG.recaptchaSiteKey;
  }
  return RECAPTCHA_SITE_KEY_FALLBACK;
}