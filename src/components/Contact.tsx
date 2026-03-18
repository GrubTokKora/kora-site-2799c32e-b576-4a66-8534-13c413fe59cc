import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent } from 'react';
import type { ContactData, Hours } from '../types';
import { getRecaptchaSiteKey } from '../config';
import { submitContactForm } from '../api';

const contactGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: '3rem',
  alignItems: 'start',
  marginTop: '3rem',
};

const infoBoxStyles: React.CSSProperties = {
  lineHeight: 1.8,
};

const hoursBoxStyles: React.CSSProperties = {
  background: 'var(--secondary-color)',
  padding: '2.5rem',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
};

const hoursListStyles: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const hourItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.75rem 0',
  borderBottom: '1px solid var(--border-color)',
  fontSize: '0.95rem',
};

const formContainerStyles: React.CSSProperties = {
  background: 'var(--secondary-color)',
  padding: '2.5rem',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-sm)',
};

export const Contact: FC<{ contactData: ContactData; hoursData: Hours; businessId: string }> = ({
  contactData,
  hoursData,
  businessId,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    const siteKey = getRecaptchaSiteKey();
    if (!siteKey) {
      console.error('reCAPTCHA site key is not configured.');
      return;
    }

    const interval = setInterval(() => {
      if (window.grecaptcha && window.grecaptcha.render && recaptchaRef.current && recaptchaWidgetId.current === null) {
        clearInterval(interval);
        recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setResponseMessage('');

    if (!name || !email || !message) {
      setStatus('error');
      setResponseMessage('Please fill out all fields.');
      return;
    }

    const token = recaptchaWidgetId.current !== null ? window.grecaptcha.getResponse(recaptchaWidgetId.current) : '';
    if (!token) {
      setStatus('error');
      setResponseMessage('Please complete the security check.');
      return;
    }

    try {
      await submitContactForm({
        businessId,
        formType: 'contact',
        formData: { name, email, message },
        captchaToken: token,
      });
      setStatus('success');
      setResponseMessage('Thank you! Your message has been sent.');
      setName('');
      setEmail('');
      setMessage('');
      if (recaptchaWidgetId.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
      }
    } catch (error) {
      setStatus('error');
      setResponseMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return (
    <section id="contact" className="container">
      <div style={{ textAlign: 'center' }}>
        <h2>Get in Touch</h2>
        <div className="section-line" />
        <p className="section-subtitle">
          Have a question or want to book a large party? Send us a message and we'll get back to you soon.
        </p>
      </div>

      <div style={contactGridStyles}>
        <div style={formContainerStyles}>
          <h3 style={{ marginBottom: '1.5rem' }}>Send a Message</h3>
          <form onSubmit={handleSubmit} className="contact-form">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea
              placeholder="Your Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <div ref={recaptchaRef} style={{ transform: 'scale(0.95)', transformOrigin: '0 0', marginBottom: '1rem' }}></div>
            <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>
            {responseMessage && (
              <div className={`form-message ${status}`}>
                {responseMessage}
              </div>
            )}
          </form>
        </div>

        <div>
          <div style={infoBoxStyles}>
            <h3 style={{ marginBottom: '1.5rem' }}>Contact Details</h3>
            <p>
              <strong>Address:</strong><br />
              {contactData.address}
            </p>
            <p>
              <strong>Phone:</strong><br />
              <a href={`tel:${contactData.phone}`}>{contactData.phone}</a>
            </p>
            <p>
              <strong>Email:</strong><br />
              <a href={`mailto:${contactData.email}`}>{contactData.email}</a>
            </p>
          </div>
          <div style={{ ...hoursBoxStyles, marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Opening Hours</h3>
            <ul style={hoursListStyles}>
              {Object.entries(hoursData).map(([day, hours]) => (
                <li key={day} style={hourItemStyles}>
                  <span>{day}</span>
                  <strong>{hours}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};