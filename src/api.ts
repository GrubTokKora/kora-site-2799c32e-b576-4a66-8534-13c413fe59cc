import { getApiBaseUrlsf } from './config';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface SubmitFormPayload {
  businessId: string;
  formType: 'contact';
  formData: ContactFormData;
  captchaToken: string;
}

export async function submitContactForm(payload: SubmitFormPayload) {
  const apiBaseUrl = getApiBaseUrl();
  const { businessId, formType, formData, captchaToken } = payload;

  const response = await fetch(`${apiBaseUrl}/api/v1/public/forms/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_id: businessId,
      form_type: formType,
      form_data: formData,
      submitter_email: formData.email,
      captcha_token: captchaToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred while submitting the form.' }));
    throw new Error(errorData.message || 'Failed to submit form.');
  }

  return response.json();
}