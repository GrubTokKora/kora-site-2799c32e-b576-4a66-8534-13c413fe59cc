import type { SiteData } from './types';

export const siteData: SiteData = {
  business: {
    name: "Heights Pizza Company",
    description: "Pizza-&-pasta restaurant with a wide-ranging menu including Italian sandwiches in strip-mall digs. We pride ourselves on using the freshest ingredients to bring you the authentic taste of Italy right here in Darien.",
    address: "882 Post Rd, Darien, CT 06820, USA",
    website: "https://www.heightspizzacompany.com/"
  },
  hours: {
    "Monday": "11:00 AM - 9:00 PM",
    "Tuesday": "11:00 AM - 9:00 PM",
    "Wednesday": "11:00 AM - 9:00 PM",
    "Thursday": "11:00 AM - 9:00 PM",
    "Friday": "11:00 AM - 10:00 PM",
    "Saturday": "11:00 AM - 10:00 PM",
    "Sunday": "12:00 PM - 9:00 PM"
  },
  hero: {
    title: "Heights Pizza Company",
    subtitle: "Fresh ingredients, classic recipes. Taste the tradition at Heights Pizza Company.",
    backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop"
  },
  menu: [
    {
      "category": "MAIN COURSE",
      "items": [
        { "name": "Cheeseburger", "description": "", "price": "$35" },
        { "name": "Cheese Sandwich", "description": "", "price": "$22" },
        { "name": "Chicken Burgers", "description": "", "price": "$24" },
        { "name": "Spicy Chicken", "description": "", "price": "$33" },
        { "name": "Hot Dog", "description": "", "price": "$23" }
      ]
    },
    {
      "category": "APPETIZERS",
      "items": [
        { "name": "Fruit Salad", "description": "", "price": "$13" },
        { "name": "Cocktails", "description": "", "price": "$12" },
        { "name": "Nuggets", "description": "", "price": "$14" },
        { "name": "Sandwich", "description": "", "price": "$13" },
        { "name": "French Fries", "description": "", "price": "$15" }
      ]
    },
    {
      "category": "BEVERAGE",
      "items": [
        { "name": "Milk Shake", "description": "", "price": "$35" },
        { "name": "Iced Tea", "description": "", "price": "$22" },
        { "name": "Orange Juice", "description": "", "price": "$24" },
        { "name": "Lemon Tea", "description": "", "price": "$33" },
        { "name": "Iced Coffee", "description": "", "price": "$23" }
      ]
    }
  ],
  contact: {
    address: "882 Post Rd, Darien, CT 06820, USA",
    phone: "(203) 555-1234",
    email: "contact@heightspizzacompany.com"
  },
  actions: {
    primaryCtaLabel: "Order Online",
    primaryCtaUrl: "#",
    secondaryCtaLabel: "View Menu",
    secondaryCtaUrl: "#menu"
  },
  design: {
    palette: {
      primary: "#1a1a1a",
      secondary: "#f9f9f9",
      accent: "#d9534f"
    }
  }
};