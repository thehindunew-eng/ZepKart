/** Serviceable NCR cities, areas and pincodes. */
export const CITIES = ["Delhi", "Noida", "Gurugram"] as const;
export type City = (typeof CITIES)[number];

export const AREAS: Record<City, string[]> = {
  Delhi: ["Lajpat Nagar", "Karol Bagh", "Connaught Place", "Dwarka Sector 10", "Saket", "Rohini Sector 7", "Chandni Chowk", "Janakpuri"],
  Noida: ["Sector 18", "Sector 62", "Sector 15", "Sector 76", "Greater Noida West", "Sector 50"],
  Gurugram: ["DLF Phase 3", "Sector 56", "Cyber City", "Sector 49", "Golf Course Road", "Sohna Road"],
};

export const WEIGHT_UNITS = ["g", "kg", "ml", "l", "pc"] as const;
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export const CATEGORIES = ["Grocery", "Dairy & Bakery", "Fruits & Vegetables", "Staples", "Beverages", "Snacks", "Personal Care", "Household", "Meat & Eggs"] as const;

/** Delhi 110xxx, Noida 201xxx, Gurugram 122xxx. */
export function isNcrPincode(pin: string) {
  return /^(110\d{3}|201\d{3}|122\d{3})$/.test(pin);
}

export function cityFromPincode(pin: string): City | null {
  if (/^110\d{3}$/.test(pin)) return "Delhi";
  if (/^201\d{3}$/.test(pin)) return "Noida";
  if (/^122\d{3}$/.test(pin)) return "Gurugram";
  return null;
}
