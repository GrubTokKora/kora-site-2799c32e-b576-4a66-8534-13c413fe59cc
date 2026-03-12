export interface Business {
  name: string;
  description: string;
  address: string;
  website: string;
}

export interface Hours {
  [key: string]: string;
}

export interface HeroData {
  title: string;
  subtitle: string;
  backgroundImage: string;
}

export interface MenuItem {
  name: string;
  description: string;
  price: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface ContactData {
  address: string;
  phone: string;
  email: string;
}

export interface Actions {
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
}

export interface Design {
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface SiteData {
  business: Business;
  hours: Hours;
  hero: HeroData;
  menu: MenuCategory[];
  contact: ContactData;
  actions: Actions;
  design: Design;
}