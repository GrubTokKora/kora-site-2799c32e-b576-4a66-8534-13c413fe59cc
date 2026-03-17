import { useState, useEffect } from 'react';
import type { FC } from 'react';
import type { HeroData, Actions } from '../types';

interface HeroProps {
  heroData: HeroData;
  actions: Actions;
}

export const Hero: FC<HeroProps> = ({ heroData, actions }) => {
  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const parallaxOffset = scrollY * 0.4;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {/* Parallax background */}
      <div
        style={{
          position: 'absolute',
          inset: '-10%',
          backgroundImage: `url(${heroData.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `translateY(${parallaxOffset}px) scale(1.1)`,
          transition: 'transform 0.1s linear',
          willChange: 'transform',
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          color: '#fff',
          maxWidth: '800px',
          padding: '0 2rem',
        }}
      >
        {/* Small label */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
          }}
        >
          <span style={{ color: 'var(--gold-light)' }}>★</span>
          Est. in Darien, CT
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
          }}
        >
          {heroData.title}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s',
          }}
        >
          {heroData.subtitle}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s',
          }}
        >
          <a href={actions.primaryCtaUrl} className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
            {actions.primaryCtaLabel}
          </a>
          <a href={actions.secondaryCtaUrl} className="btn btn-secondary" style={{ padding: '1rem 2.5rem' }}>
            {actions.secondaryCtaLabel}
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: loaded ? 0.6 : 0,
          transition: 'opacity 1s ease 1.2s',
          animation: 'bounce 2s infinite 2s',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Scroll
        </span>
        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)',
        }} />
      </div>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-8px); }
          60% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </section>
  );
};