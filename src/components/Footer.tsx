import type { FC } from 'react';
import { NewsletterForm } from './NewsletterForm';

const newsletterSectionStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, #fdf6f0 0%, #fef9f5 40%, #f5ece4 100%)',
  padding: '5rem 0 3rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
};

const newsletterDecoCircle: React.CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  border: '1px solid rgba(200, 169, 110, 0.15)',
  pointerEvents: 'none',
};

const newsletterHeadingStyles: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
  color: 'var(--primary-color)',
  marginBottom: '0.5rem',
  fontWeight: 600,
};

const newsletterSubtitleStyles: React.CSSProperties = {
  color: 'var(--text-light)',
  fontSize: '1.05rem',
  maxWidth: '480px',
  margin: '0 auto',
  lineHeight: 1.7,
};

const newsletterIconStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(192,57,43,0.08), rgba(200,169,110,0.12))',
  marginBottom: '1.25rem',
  fontSize: '1.75rem',
};

const dividerLineStyles: React.CSSProperties = {
  width: '60px',
  height: '3px',
  background: 'linear-gradient(90deg, var(--accent-color), var(--gold))',
  margin: '1.5rem auto 0',
  borderRadius: '2px',
};

const copyrightBarStyles: React.CSSProperties = {
  backgroundColor: 'var(--primary-color)',
  color: 'rgba(255,255,255,0.7)',
  padding: '1.25rem 0',
  textAlign: 'center',
  fontSize: '0.875rem',
};

export const Footer: FC<{ businessName: string; businessId: string }> = ({ businessName, businessId }) => {
  return (
    <footer>
      {/* Newsletter section – light warm palette */}
      <div style={newsletterSectionStyles}>
        {/* Decorative circles */}
        <div style={{ ...newsletterDecoCircle, width: '300px', height: '300px', top: '-100px', right: '-80px' }} />
        <div style={{ ...newsletterDecoCircle, width: '200px', height: '200px', bottom: '-60px', left: '-40px' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={newsletterIconStyles}>✉️</div>
          <h3 style={newsletterHeadingStyles}>Stay in the Loop</h3>
          <div style={dividerLineStyles} />
          <p style={{ ...newsletterSubtitleStyles, marginTop: '1.25rem' }}>
            Be the first to hear about new dishes, special offers, and upcoming events at Heights Pizza Company.
          </p>
          <NewsletterForm businessId={businessId} />
        </div>
      </div>

      {/* Slim copyright bar */}
      <div style={copyrightBarStyles}>
        <div className="container">
          &copy; {new Date().getFullYear()} {businessName}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};