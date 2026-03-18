import { useState, useEffect, useRef } from 'react';
import type { FC, FormEvent, CSSProperties } from 'react';
import type { ContactData, Hours } from '../types';
import { getRecaptchaSiteKey } from '../config';
import { submitContactForm } from '../api';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

// SVG Icons
const UserIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const EmailIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;
const MessageIcon = <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const AddressIcon = <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const PhoneIcon = <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const ContactEmailIcon = <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;

// Styles
const sectionStyles: CSSProperties = { background: 'var(--secondary-color)' };
const formContainerStyles: CSSProperties = { background: 'var(--card-bg)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' };
const infoContainerStyles: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const infoBoxStyles: CSSProperties = { background: 'var(--card-bg)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' };
const contactItemStyles: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' };
const contactIconWrapperStyles: CSSProperties = { flexShrink: 0, width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-light))', color: '#fff', boxShadow: '0 4px 12px rgba(217, 83, 79, 0.2)' };
const contactTextStyles: CSSProperties = { lineHeight: 1.6 };
const hoursListStyles: CSSProperties = { listStyle: 'none', padding: 0, margin: 0 };
const hourItemStyles: CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', transition: 'background-color 0.3s ease' };
const currentDayStyles: CSSProperties = { backgroundColor: 'rgba(200, 169, 110, 0.08)', color: 'var(--primary-color)', borderRadius: '4px', paddingLeft: '1rem', paddingRight: '1rem', margin: '0 -1rem' };

export const Contact: FC<{ contactData: ContactData; hoursData: Hours; businessId: string }> = ({ contactData, hoursData, businessId }) => {
  const { ref, isVisible } = useScrollAnimation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  const today = new Date().toLocaleString('en-US', { weekday: 'long' });

  useEffect(() => {
    const siteKey = getRecaptchaSiteKey();
    if (!siteKey) {
      console.error('reCAPTCHA site key is not configured.');
      return;
    }
    const interval = setInterval(() => {
      if (window.grecaptcha?.render && recaptchaRef.current && recaptchaWidgetId.current === null) {
        clearInterval(interval);
        recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, { sitekey: siteKey });
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
      await submitContactForm({ businessId, formType: 'contact', formData: { name, email, message }, captchaToken: token });
      setStatus('success');
      setResponseMessage('Thank you! Your message has been sent.');
      setName(''); setEmail(''); setMessage('');
      if (recaptchaWidgetId.current !== null) window.grecaptcha.reset(recaptchaWidgetId.current);
    } catch (error) {
      setStatus('error');
      setResponseMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
    }
  };

  return (
    <section id="contact" style={sectionStyles} ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center' }} className={`fade-in ${isVisible ? 'visible' : ''}`}>
          <h2>Get in Touch</h2>
          <div className="section-line" />
          <p className="section-subtitle">Have a question or want to book a large party? Send us a message and we'll get back to you soon.</p>
        </div>
        <div className={`contact-grid-responsive stagger-children ${isVisible ? 'visible' : ''}`}>
          <div style={formContainerStyles} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
            <h3 style={{ marginBottom: '2rem', fontFamily: 'var(--font-family-serif)' }}>Send a Message</h3>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="input-group">
                <span className="input-icon">{UserIcon}</span>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">{EmailIcon}</span>
                <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon textarea-icon">{MessageIcon}</span>
                <textarea placeholder="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>
              <div ref={recaptchaRef} style={{ transform: 'scale(0.95)', transformOrigin: '0 0', marginBottom: '1rem' }}></div>
              <button type="submit" className="btn btn-primary" disabled={status === 'submitting'} style={{ width: '100%' }}>
                {status === 'submitting' ? 'Sending...' : 'Send Message'}
              </button>
              {responseMessage && <div className={`form-message ${status === 'success' ? 'success' : 'error'}`}>{responseMessage}</div>}
            </form>
          </div>
          <div style={infoContainerStyles}>
            <div style={infoBoxStyles}>
              <h3 style={{ marginBottom: '2rem', fontFamily: 'var(--font-family-serif)' }}>Contact Details</h3>
              <div style={contactItemStyles}>
                <div style={contactIconWrapperStyles}>{AddressIcon}</div>
                <div style={contactTextStyles}><strong style={{ color: 'var(--primary-color)' }}>Address</strong><p style={{ color: 'var(--text-light)', margin: 0 }}>{contactData.address}</p></div>
              </div>
              <div style={contactItemStyles}>
                <div style={contactIconWrapperStyles}>{PhoneIcon}</div>
                <div style={contactTextStyles}><strong style={{ color: 'var(--primary-color)' }}>Phone</strong><p style={{ margin: 0 }}><a href={`tel:${contactData.phone}`}>{contactData.phone}</a></p></div>
              </div>
              <div style={{ ...contactItemStyles, marginBottom: 0 }}>
                <div style={contactIconWrapperStyles}>{ContactEmailIcon}</div>
                <div style={contactTextStyles}><strong style={{ color: 'var(--primary-color)' }}>Email</strong><p style={{ margin: 0 }}><a href={`mailto:${contactData.email}`}>{contactData.email}</a></p></div>
              </div>
            </div>
            <div style={infoBoxStyles}>
              <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-family-serif)' }}>Opening Hours</h3>
              <ul style={hoursListStyles}>
                {Object.entries(hoursData).map(([day, hours]) => (
                  <li key={day} style={day === today ? { ...hourItemStyles, ...currentDayStyles } : hourItemStyles}>
                    <span>{day}</span>
                    <strong style={{ color: day === today ? 'var(--accent-dark)' : 'var(--text-color)' }}>{hours}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .contact-grid-responsive {
          display: grid;
          gap: 3rem;
          align-items: start;
          margin-top: 4rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 992px) {
          .contact-grid-responsive {
            grid-template-columns: 1.1fr 1fr;
          }
        }
      `}</style>
    </section>
  );
};