import type { FC } from 'react';

const aboutStyles: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '700px',
  margin: '0 auto',
};

export const About: FC<{ description: string }> = ({ description }) => {
  return (
    <section id="about" className="container">
      <div style={aboutStyles}>
        <h2>About Us</h2>
        <p>{description}</p>
      </div>
    </section>
  );
};