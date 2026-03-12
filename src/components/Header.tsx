import type { FC } from 'react';

const headerStyles: React.CSSProperties = {
  background: '#fff',
  padding: '1rem 0',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logoStyles: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '1.5rem',
  color: 'var(--primary-color)',
  textDecoration: 'none',
};

const navLinksStyles: React.CSSProperties = {
  listStyle: 'none',
  display: 'flex',
  gap: '1.5rem',
};

const navLinkStyles: React.CSSProperties = {
  color: 'var(--primary-color)',
  fontWeight: 'bold',
};

export const Header: FC<{ businessName: string }> = ({ businessName }) => {
  return (
    <header style={headerStyles}>
      <div className="container">
        <nav style={navStyles}>
          <a href="#" style={logoStyles}>{businessName}</a>
          <ul style={navLinksStyles}>
            <li><a href="#about" style={navLinkStyles}>About</a></li>
            <li><a href="#menu" style={navLinkStyles}>Menu</a></li>
            <li><a href="#contact" style={navLinkStyles}>Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};