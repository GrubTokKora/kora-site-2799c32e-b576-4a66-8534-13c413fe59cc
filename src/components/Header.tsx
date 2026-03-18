import { useState, useEffect } from 'react';
import type { FC } from 'react';

export const Header: FC<{ businessName: string }> = ({ businessName }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'About', href: '#about' },
    { label: 'Menu', href: '#menu' },
    { label: 'Hours', href: '#contact' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: scrolled ? '0.75rem 0' : '1.25rem 0',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        boxShadow: scrolled ? '0 1px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a
          href="#"
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: scrolled ? 'var(--primary-color)' : '#fff',
            textDecoration: 'none',
            transition: 'color 0.4s ease',
            letterSpacing: '-0.02em',
          }}
        >
          {businessName}
        </a>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="desktop-nav">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                color: scrolled ? 'var(--text-color)' : 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-color)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = scrolled ? 'var(--text-color)' : 'rgba(255,255,255,0.9)'; }}
            >
              {link.label}
            </a>
          ))}
          <a href="#" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}>
            Order Online
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            zIndex: 1001,
          }}
        >
          <div style={{
            width: '24px',
            height: '2px',
            background: scrolled ? 'var(--primary-color)' : '#fff',
            transition: 'all 0.3s ease',
            transform: mobileOpen ? 'rotate(45deg) translateY(8px)' : 'none',
          }} />
          <div style={{
            width: '24px',
            height: '2px',
            background: scrolled ? 'var(--primary-color)' : '#fff',
            margin: '6px 0',
            transition: 'all 0.3s ease',
            opacity: mobileOpen ? 0 : 1,
          }} />
          <div style={{
            width: '24px',
            height: '2px',
            background: scrolled ? 'var(--primary-color)' : '#fff',
            transition: 'all 0.3s ease',
            transform: mobileOpen ? 'rotate(-45deg) translateY(-8px)' : 'none',
          }} />
        </button>

        {/* Mobile menu overlay */}
        {mobileOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2rem',
              zIndex: 999,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: 'var(--primary-color)',
                  fontFamily: 'var(--font-family-serif)',
                  fontSize: '1.75rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
            <a href="#" className="btn btn-primary" onClick={() => setMobileOpen(false)}>
              Order Online
            </a>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </header>
  );
};