import type { FC } from 'react';
import { NewsletterForm } from './NewsletterForm';

const footerStyles: React.CSSProperties = {
  backgroundColor: 'var(--primary-color)',
  color: '#fff',
  padding: '3rem 0',
  textAlign: 'center',
};

const copyrightStyles: React.CSSProperties = {
  marginTop: '2rem',
  fontSize: '0.9rem',
  opacity: 0.7,
};

export const Footer: FC<{ businessName: string; businessId: string }> = ({ businessName, businessId }) => {
  return (
    <footer style={footerStyles}>
      <div className="container">
        <h3>Join Our Newsletter</h3>
        <p>Get updates on specials and events.</p>
        <NewsletterForm businessId={businessId} />
        <div style={copyrightStyles}>
          &copy; {new Date().getFullYear()} {businessName}. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};