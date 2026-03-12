import type { FC } from 'react';
import type { MenuCategory } from '../types';

const menuSectionStyles: React.CSSProperties = {
  background: 'var(--secondary-color)',
};

const menuGridStyles: React.CSSProperties = {
  display: 'grid',
  gap: '2rem',
};

const categoryTitleStyles: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: '1.75rem',
  borderBottom: '2px solid var(--accent-color)',
  paddingBottom: '0.5rem',
  marginBottom: '1.5rem',
};

const itemStyles: React.CSSProperties = {
  marginBottom: '1rem',
};

const itemNameStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: 'bold',
};

const itemDescriptionStyles: React.CSSProperties = {
  color: '#666',
  marginTop: '0.25rem',
};

export const Menu: FC<{ menuData: MenuCategory[] }> = ({ menuData }) => {
  return (
    <section id="menu" style={menuSectionStyles}>
      <div className="container">
        <h2>Our Menu</h2>
        <div style={menuGridStyles}>
          {menuData.map((category) => (
            <div key={category.category}>
              <h3 style={categoryTitleStyles}>{category.category}</h3>
              {category.items.map((item) => (
                <div key={item.name} style={itemStyles}>
                  <div style={itemNameStyles}>
                    <span>{item.name}</span>
                    <span>{item.price}</span>
                  </div>
                  <p style={itemDescriptionStyles}>{item.description}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};