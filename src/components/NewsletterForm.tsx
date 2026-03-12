import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { subscribeToNewsletter } from '../newsletter';

const formStyles: React.CSSProperties = {
  maxWidth: '500px',
  margin: '1.5rem auto 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const inputStyles: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '5px',
  border: '1px solid #ccc',
  width: '100%',
};

const checkboxContainerStyles: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  alignItems: 'center',
  color: '#ddd',
};

const messageStyles: React.CSSProperties = {
  padding: '0.75rem',
  borderRadius: '5px',
  marginTop: '0.5rem',
  textAlign: 'center',
};

const successStyles: React.CSSProperties = {
  ...messageStyles,
  backgroundColor: '#d4edda',
  color: '#155724',
};

const errorStyles: React.CSSProperties = {
  ...messageStyles,
  backgroundColor: '#f8d7da',
  color: '#721c24',
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
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyles}
        disabled={!emailOptIn}
      />
      <input
        type="tel"
        placeholder="Enter your phone number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        style={inputStyles}
        disabled={!smsOptIn}
      />
      <div style={checkboxContainerStyles}>
        <label>
          <input type="checkbox" checked={emailOptIn} onChange={(e) => setEmailOptIn(e.target.checked)} />
          Email
        </label>
        <label>
          <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
          SMS
        </label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {message && (
        <div style={status === 'success' ? successStyles : errorStyles}>
          {message}
        </div>
      )}
    </form>
  );
};