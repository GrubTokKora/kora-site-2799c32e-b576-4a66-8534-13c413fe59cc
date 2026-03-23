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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Center vignette for extra text contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
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
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.25)',
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '2rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1) 0.2s',
          }}
        >
          <span style={{ color: 'var(--gold-light)', filter: 'drop-shadow(0 0 4px rgba(200,169,110,0.6))' }}>★</span>
          Est. in Darien, CT
        </div>

        <h1
          className="hero-title"
          style={{
            fontFamily: 'var(--font-family-serif)',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.1)',
            WebkitTextStroke: '0.3px rgba(255,255,255,0.3)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1) 0.4s',
          }}
        >
          {heroData.title}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
            lineHeight: 1.8,
            marginBottom: '2.5rem',
            color: '#ffffff',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.8), 0 4px 25px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
            fontWeight: 400,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1) 0.6s',
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
            transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1) 0.8s',
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

      <style>{`
        @keyframes heroGlow {
          0%, 100% { text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.08); }
          50% { text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6), 0 8px 40px rgba(0,0,0,0.4), 0 0 80px rgba(255,255,255,0.15), 0 0 120px rgba(200,169,110,0.1); }
        }
        .hero-title {
          animation: heroGlow 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};