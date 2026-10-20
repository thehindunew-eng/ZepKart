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

/** Approximate centre of each NCR locality. Used for distances and map links (demo accuracy). */
export const AREA_GEO: Record<string, [number, number]> = {
  "Lajpat Nagar": [28.5677, 77.2433],
  "Karol Bagh": [28.6514, 77.1907],
  "Connaught Place": [28.6315, 77.2167],
  "Dwarka Sector 10": [28.5823, 77.05],
  Saket: [28.5244, 77.2066],
  "Rohini Sector 7": [28.7041, 77.1025],
  "Chandni Chowk": [28.6506, 77.2303],
  Janakpuri: [28.6219, 77.0878],
  "Sector 18": [28.5706, 77.3219],
  "Sector 62": [28.6272, 77.3648],
  "Sector 15": [28.583, 77.319],
  "Sector 76": [28.5716, 77.377],
  "Greater Noida West": [28.62, 77.4],
  "Sector 50": [28.57, 77.35],
  "DLF Phase 3": [28.4947, 77.0967],
  "Sector 56": [28.418, 77.09],
  "Cyber City": [28.495, 77.089],
  "Sector 49": [28.437, 77.048],
  "Golf Course Road": [28.442, 77.099],
  "Sohna Road": [28.418, 77.049],
};

const CITY_CENTRE: Record<City, [number, number]> = { Delhi: [28.6139, 77.209], Noida: [28.5355, 77.391], Gurugram: [28.4595, 77.0266] };

/** Coordinates for a locality, falling back to the city centre. Small jitter keeps pins apart. */
export function geoFor(city: string, locality: string | null | undefined, jitter = 0): { lat: number; lng: number } {
  const base = (locality && AREA_GEO[locality]) || CITY_CENTRE[(CITIES as readonly string[]).includes(city) ? (city as City) : "Delhi"];
  return { lat: Number((base[0] + jitter * 0.0013).toFixed(6)), lng: Number((base[1] - jitter * 0.0011).toFixed(6)) };
}

/** Main pincode for each serviceable locality. */
export const AREA_PIN: Record<string, string> = {
  "Lajpat Nagar": "110024",
  "Karol Bagh": "110005",
  "Connaught Place": "110001",
  "Dwarka Sector 10": "110075",
  Saket: "110017",
  "Rohini Sector 7": "110085",
  "Chandni Chowk": "110006",
  Janakpuri: "110058",
  "Sector 18": "201301",
  "Sector 62": "201309",
  "Sector 15": "201301",
  "Sector 76": "201301",
  "Greater Noida West": "201306",
  "Sector 50": "201301",
  "DLF Phase 3": "122002",
  "Sector 56": "122011",
  "Cyber City": "122002",
  "Sector 49": "122018",
  "Golf Course Road": "122002",
  "Sohna Road": "122018",
};

export type PincodeLocation = { pincode: string; city: City; locality: string; lat: number; lng: number; exact: boolean };

/**
 * Resolves an NCR pincode to a city, locality and coordinates. Pincodes that aren't mapped to a
 * locality fall back to the city centre (exact = false). Returns null outside NCR.
 */
export function locateByPincode(pin: string): PincodeLocation | null {
  const city = cityFromPincode(pin);
  if (!city) return null;
  const match = Object.entries(AREA_PIN).find(([, p]) => p === pin);
  const locality = match ? match[0] : AREAS[city][0];
  const geo = geoFor(city, locality);
  return { pincode: pin, city, locality, lat: geo.lat, lng: geo.lng, exact: Boolean(match) };
}
