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
      "category": "Pizzas",
      "items": [
        { "name": "Margherita", "description": "Fresh mozzarella, San Marzano tomatoes, basil, and extra virgin olive oil.", "price": "$14.00" },
        { "name": "Pepperoni", "description": "Classic pepperoni pizza with a zesty tomato sauce and mozzarella cheese.", "price": "$16.00" },
        { "name": "Veggie Supreme", "description": "Bell peppers, onions, mushrooms, olives, and fresh tomatoes.", "price": "$17.00" }
      ]
    },
    {
      "category": "Pastas",
      "items": [
        { "name": "Spaghetti Carbonara", "description": "Pasta with eggs, cheese, pancetta, and black pepper.", "price": "$18.00" },
        { "name": "Fettuccine Alfredo", "description": "Creamy Alfredo sauce with fettuccine pasta.", "price": "$17.00" }
      ]
    },
    {
      "category": "Sandwiches",
      "items": [
        { "name": "Italian Combo", "description": "Ham, salami, provolone, lettuce, tomato, and Italian dressing.", "price": "$12.00" },
        { "name": "Meatball Parmigiana", "description": "Homemade meatballs, marinara sauce, and melted mozzarella.", "price": "$13.00" }
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