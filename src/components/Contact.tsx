import type { FC } from 'react';
import type { ContactData, Hours } from '../types';

const contactGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '3rem',
  alignItems: 'start',
};

const infoBoxStyles: React.CSSProperties = {
  lineHeight: 1.8,
};

const hoursBoxStyles: React.CSSProperties = {
  background: 'var(--secondary-color)',
  padding: '2rem',
  borderRadius: '5px',
};

const hoursListStyles: React.CSSProperties = {
  listStyle: 'none',
};

const hourItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: '1px solid #ddd',
};

export const Contact: FC<{ contactData: ContactData; hoursData: Hours }> = ({ contactData, hoursData }) => {
  return (
    <section id="contact" className="container">
      <h2>Visit Us</h2>
      <div style={contactGridStyles}>
        <div style={infoBoxStyles}>
          <h3>Contact & Location</h3>
          <p>
            <strong>Address:</strong><br />
            {contactData.address}
          </p>
          <p>
            <strong>Phone:</strong><br />
            <a href={`tel:${contactData.phone}`}>{contactData.phone}</a>
          </p>
          <p>
            <strong>Email:</strong><br />
            <a href={`mailto:${contactData.email}`}>{contactData.email}</a>
          </p>
        </div>
        <div style={hoursBoxStyles}>
          <h3>Opening Hours</h3>
          <ul style={hoursListStyles}>
            {Object.entries(hoursData).map(([day, hours]) => (
              <li key={day} style={hourItemStyles}>
                <span>{day}</span>
                <span>{hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};