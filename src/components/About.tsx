import type { FC } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const About: FC<{ description: string }> = ({ description }) => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" style={{ background: 'var(--background-color)' }}>
      <div className="container" ref={ref}>
        <div
          className={`fade-in ${isVisible ? 'visible' : ''}`}
          style={{
            textAlign: 'center',
            maxWidth: '750px',
            margin: '0 auto',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--accent-color)',
              marginBottom: '1rem',
            }}
          >
            Our Story
          </span>
          <h2 style={{ marginBottom: '0.5rem' }}>About Heights Pizza</h2>
          <div className="section-line" />
          <p
            style={{
              fontSize: '1.125rem',
              lineHeight: 1.8,
              color: 'var(--text-light)',
              marginTop: '1.5rem',
            }}
          >
            {description}
          </p>

          {/* Decorative icons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              marginTop: '3rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: '🍕', label: 'Fresh Dough Daily' },
              { icon: '🧀', label: 'Premium Ingredients' },
              { icon: '👨‍🍳', label: 'Expert Chefs' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '2.5rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};