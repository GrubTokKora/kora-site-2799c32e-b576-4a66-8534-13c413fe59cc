import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { subscribeToNewsletter } from '../newsletter';

const formStyles: React.CSSProperties = {
  maxWidth: '480px',
  margin: '2rem auto 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.875rem',
};

const inputStyles: React.CSSProperties = {
  padding: '0.875rem 1rem',
  borderRadius: '50px',
  border: '1px solid #e0d6cc',
  width: '100%',
  fontSize: '0.95rem',
  background: '#ffffff',
  color: 'var(--text-color)',
  outline: 'none',
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
};

const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = 'var(--accent-color)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(192,57,43,0.08)';
};

const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = '#e0d6cc';
  e.currentTarget.style.boxShadow = 'none';
};

const checkboxContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'var(--text-light)',
  fontSize: '0.9rem',
};

const checkboxLabelStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  cursor: 'pointer',
  fontWeight: 500,
};

const messageStyles: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  marginTop: '0.25rem',
  textAlign: 'center',
  fontSize: '0.9rem',
  fontWeight: 500,
};

const successStyles: React.CSSProperties = {
  ...messageStyles,
  backgroundColor: '#e8f5e9',
  color: '#2e7d32',
  border: '1px solid #c8e6c9',
};

const errorStyles: React.CSSProperties = {
  ...messageStyles,
  backgroundColor: '#fef2f2',
  color: '#b91c1c',
  border: '1px solid #fecaca',
};

const submitBtnStyles: React.CSSProperties = {
  padding: '0.875rem 2rem',
  borderRadius: '50px',
  border: 'none',
  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 15px rgba(192, 57, 43, 0.25)',
  letterSpacing: '0.02em',
};

export const NewsletterForm: FC<{ businessId: string }> = ({ businessId }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    if (!emailOptIn && !smsOptIn) {
      setStatus('error');
      setMessage('Please select at least one way to subscribe (Email or SMS).');
      return;
    }

    if (smsOptIn && !phoneNumber.trim()) {
      setStatus('error');
      setMessage('Please enter a phone number for SMS updates.');
      return;
    }

    const result = await subscribeToNewsletter({
      businessId,
      email: emailOptIn ? email : undefined,
      phoneNumber: smsOptIn ? phoneNumber : undefined,
      emailOptIn,
      smsOptIn,
    });

    if (result.success) {
      setStatus('success');
      setMessage(result.message || 'Thank you for subscribing!');
      setEmail('');
      setPhoneNumber('');
    } else {
      setStatus('error');
      setMessage(result.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyles}>
      <input
        type="email"
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          ...inputStyles,
          opacity: emailOptIn ? 1 : 0.5,
        }}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
        disabled={!emailOptIn}
      />
      <input
        type="tel"
        placeholder="Your phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={{
          ...inputStyles,
          opacity: smsOptIn ? 1 : 0.5,
        }}
        onFocus={inputFocusHandler}
        onBlur={inputBlurHandler}
        disabled={!smsOptIn}
      />
      <div style={checkboxContainerStyles}>
        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={emailOptIn}
            onChange={(e) => setEmailOptIn(e.target.checked)}
            style={{ accentColor: 'var(--accent-color)' }}
          />
          Email updates
        </label>
        <label style={checkboxLabelStyles}>
          <input
            type="checkbox"
            checked={smsOptIn}
            onChange={(e) => setSmsOptIn(e.target.checked)}
            style={{ accentColor: 'var(--accent-color)' }}
          />
          SMS updates
        </label>
      </div>
      <button
        type="submit"
        style={{
          ...submitBtnStyles,
          opacity: status === 'submitting' ? 0.7 : 1,
        }}
        disabled={status === 'submitting'}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(192, 57, 43, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(192, 57, 43, 0.25)';
        }}
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe Now'}
      </button>
      {message && (
        <div style={status === 'success' ? successStyles : errorStyles}>
          {message}
        </div>
      )}
    </form>
  );
};