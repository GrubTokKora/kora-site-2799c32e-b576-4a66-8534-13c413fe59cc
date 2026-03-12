import type { FC } from 'react';
import type { HeroData, Actions } from '../types';

interface HeroProps {
  heroData: HeroData;
  actions: Actions;
}

export const Hero: FC<HeroProps> = ({ heroData, actions }) => {
  const heroStyles: React.CSSProperties = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroData.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: '#fff',
    textAlign: 'center',
    padding: '8rem 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const heroContentStyles: React.CSSProperties = {
    maxWidth: '800px',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '3.5rem',
    marginBottom: '1rem',
    fontFamily: 'var(--font-family-serif)',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: '1.25rem',
    marginBottom: '2rem',
  };

  const ctaContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  };

  return (
    <section style={heroStyles}>
      <div style={heroContentStyles}>
        <h1 style={titleStyles}>{heroData.title}</h1>
        <p style={subtitleStyles}>{heroData.subtitle}</p>
        <div style={ctaContainerStyles}>
          <a href={actions.primaryCtaUrl} className="btn btn-primary">{actions.primaryCtaLabel}</a>
          <a href={actions.secondaryCtaUrl} className="btn btn-secondary" style={{color: '#fff', borderColor: '#fff'}}>{actions.secondaryCtaLabel}</a>
        </div>
      </div>
    </section>
  );
};