/* Demo data for Delhi NCR (Delhi, Noida, Gurugram). Every demo account uses the password set in lib/seed.ts. */

const U = (id: string, w = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

export const DEMO_VENDORS = [
  { email: "vendor1@zepkart.demo", name: "Ramesh Gupta", phone: "9810011001" },
  { email: "vendor2@zepkart.demo", name: "Priya Nair", phone: "9810011002" },
  { email: "vendor3@zepkart.demo", name: "Arif Khan", phone: "9810011003" },
  { email: "vendor4@zepkart.demo", name: "Meera Joshi", phone: "9810011004" },
  { email: "vendor5@zepkart.demo", name: "Vikram Singh", phone: "9810011005" },
  { email: "vendor6@zepkart.demo", name: "Neha Kapoor", phone: "9810011006" },
];

export const DEMO_CUSTOMERS = [
  { email: "customer@zepkart.demo", name: "Aarav Sharma", phone: "9871122001" },
  { email: "sara@zepkart.demo", name: "Sara Thomas", phone: "9871122002" },
  { email: "arjun@zepkart.demo", name: "Arjun Mehta", phone: "9871122003" },
];

/** Wholesalers and dealers across Delhi, Noida, and Gurugram. Catalogs match out-of-stock vendor items. */
export type DemoCatalogItem = { name: string; category: string; weightValue: number; weightUnit: string; price: number; moq: number; stockQty: number; grade: "A" | "B" | "C" };
export type DemoWholesaler = { email: string; name: string; phone: string; businessName: string; city: "Delhi" | "Noida" | "Gurugram"; locality: string; pincode: string; description: string; rating: number; ratingCount: number; gstin: string; catalog: DemoCatalogItem[] };

export const DEMO_WHOLESALERS: DemoWholesaler[] = [
  {
    email: "wholesaler1@zepkart.demo",
    name: "Sunil Aggarwal",
    phone: "9811033001",
    businessName: "Chandni Chowk Wholesale Mart",
    city: "Delhi",
    locality: "Chandni Chowk",
    pincode: "110006",
    description: "Fruit, vegetable and grocery wholesale for Old Delhi and Central Delhi retailers.",
    rating: 4.4,
    ratingCount: 218,
    gstin: "07AAACC1206D1ZM",
    catalog: [
      { name: "Robusta Bananas", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 38, moq: 10, stockQty: 400, grade: "A" },
      { name: "Onion", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 22, moq: 25, stockQty: 1200, grade: "B" },
      { name: "Potato", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 19, moq: 25, stockQty: 1500, grade: "B" },
      { name: "Desi Tomatoes", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 28, moq: 20, stockQty: 600, grade: "A" },
      { name: "Green Chilli", category: "Fruits & Vegetables", weightValue: 250, weightUnit: "g", price: 14, moq: 20, stockQty: 300, grade: "B" },
      { name: "Ginger", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 90, moq: 5, stockQty: 120, grade: "A" },
      { name: "Chana Dal", category: "Staples", weightValue: 1, weightUnit: "kg", price: 82, moq: 10, stockQty: 260, grade: "A" },
      { name: "Handwash Refill", category: "Personal Care", weightValue: 250, weightUnit: "ml", price: 96, moq: 24, stockQty: 180, grade: "A" },
    ],
  },
  {
    email: "wholesaler2@zepkart.demo",
    name: "Kavita Bhardwaj",
    phone: "9811033002",
    businessName: "Sector 15 Bulk Foods",
    city: "Noida",
    locality: "Sector 15",
    pincode: "201301",
    description: "Dairy, eggs and packaged staples for Noida kirana and dairy shops.",
    rating: 4.1,
    ratingCount: 134,
    gstin: "09AAACS4321K1Z8",
    catalog: [
      { name: "Robusta Bananas", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 42, moq: 5, stockQty: 250, grade: "B" },
      { name: "Country Eggs", category: "Meat & Eggs", weightValue: 6, weightUnit: "pc", price: 49, moq: 12, stockQty: 600, grade: "A" },
      { name: "Brown Eggs", category: "Meat & Eggs", weightValue: 6, weightUnit: "pc", price: 46, moq: 12, stockQty: 420, grade: "A" },
      { name: "Basmati Rice Premium", category: "Staples", weightValue: 5, weightUnit: "kg", price: 560, moq: 4, stockQty: 60, grade: "A" },
      { name: "Toor Dal", category: "Staples", weightValue: 1, weightUnit: "kg", price: 150, moq: 10, stockQty: 200, grade: "B" },
      { name: "Cold-Pressed Mustard Oil", category: "Staples", weightValue: 1, weightUnit: "l", price: 168, moq: 12, stockQty: 150, grade: "A" },
      { name: "Fresh Cream", category: "Dairy & Bakery", weightValue: 200, weightUnit: "ml", price: 62, moq: 24, stockQty: 140, grade: "B" },
      { name: "Handwash Refill", category: "Personal Care", weightValue: 250, weightUnit: "ml", price: 110, moq: 12, stockQty: 90, grade: "B" },
    ],
  },
  {
    email: "wholesaler3@zepkart.demo",
    name: "Harpreet Singh",
    phone: "9811033003",
    businessName: "Sohna Road Farm Supplies",
    city: "Gurugram",
    locality: "Sohna Road",
    pincode: "122018",
    description: "Farm-direct produce, eggs and dairy for Gurugram retail.",
    rating: 3.9,
    ratingCount: 76,
    gstin: "06AAACH9911Q1Z2",
    catalog: [
      { name: "Robusta Bananas", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 35, moq: 20, stockQty: 500, grade: "C" },
      { name: "Country Eggs", category: "Meat & Eggs", weightValue: 6, weightUnit: "pc", price: 41, moq: 30, stockQty: 900, grade: "C" },
      { name: "Fresh Spinach", category: "Fruits & Vegetables", weightValue: 250, weightUnit: "g", price: 12, moq: 30, stockQty: 300, grade: "B" },
      { name: "Fresh Paneer", category: "Dairy & Bakery", weightValue: 200, weightUnit: "g", price: 74, moq: 10, stockQty: 80, grade: "B" },
      { name: "A2 Cow Milk", category: "Dairy & Bakery", weightValue: 1, weightUnit: "l", price: 58, moq: 20, stockQty: 400, grade: "A" },
      { name: "Handwash Refill", category: "Personal Care", weightValue: 250, weightUnit: "ml", price: 88, moq: 36, stockQty: 260, grade: "C" },
    ],
  },
  {
    email: "wholesaler4@zepkart.demo",
    name: "Deepak Malhotra",
    phone: "9811033004",
    businessName: "Rohini Dairy & Staples Co.",
    city: "Delhi",
    locality: "Rohini Sector 7",
    pincode: "110085",
    description: "Premium staples, dairy and personal care wholesale for NCR retailers.",
    rating: 4.6,
    ratingCount: 302,
    gstin: "07AAACR7788L1ZP",
    catalog: [
      { name: "Robusta Bananas", category: "Fruits & Vegetables", weightValue: 1, weightUnit: "kg", price: 40, moq: 10, stockQty: 320, grade: "A" },
      { name: "Basmati Rice Premium", category: "Staples", weightValue: 5, weightUnit: "kg", price: 585, moq: 2, stockQty: 120, grade: "A" },
      { name: "Country Eggs", category: "Meat & Eggs", weightValue: 6, weightUnit: "pc", price: 46, moq: 12, stockQty: 360, grade: "B" },
      { name: "Whole Wheat Atta", category: "Staples", weightValue: 5, weightUnit: "kg", price: 232, moq: 6, stockQty: 300, grade: "A" },
      { name: "Filter Coffee Powder", category: "Beverages", weightValue: 500, weightUnit: "g", price: 245, moq: 6, stockQty: 90, grade: "A" },
      { name: "Handwash Refill", category: "Personal Care", weightValue: 250, weightUnit: "ml", price: 102, moq: 24, stockQty: 220, grade: "A" },
    ],
  },
];

export type DemoProduct = {
  name: string;
  description: string;
  category: string;
  price: number;
  mrp: number;
  weightValue: number;
  weightUnit: string;
  stockQty: number;
  inStock?: boolean;
  costPrice?: number; // last price paid to a wholesaler
  bargain?: { floor: number };
  gstRate: number;
  image: string | null;
};

export type DemoService = { title: string; description: string; price: number; unitLabel: string; gstRate: number };

export type DemoStore = {
  owner: number; // index into DEMO_VENDORS
  shopName: string;
  description: string;
  dp: string;
  locality: string;
  city: "Delhi" | "Noida" | "Gurugram";
  pincode: string;
  address: string;
  category: string;
  rating: number;
  schedule: "open" | "closing-tonight" | "closed-until-tomorrow";
  deliveryFee: number;
  freeDeliveryAbove: number;
  minOrder: number;
  etaMinutes: number;
  products: DemoProduct[];
  services: DemoService[];
};

export const DEMO_STORES: DemoStore[] = [
  {
    owner: 0,
    shopName: "FreshDaily Kirana",
    description: "Neighbourhood kirana in Lajpat Nagar Central Market. Farm vegetables every morning, A2 milk, staples and daily essentials at honest prices.",
    dp: U("1542838132-92c53300491e"),
    locality: "Lajpat Nagar",
    city: "Delhi",
    pincode: "110024",
    address: "Shop 14, Central Market, Lajpat Nagar-II, New Delhi 110024",
    category: "Grocery",
    rating: 4.7,
    schedule: "open",
    deliveryFee: 29,
    freeDeliveryAbove: 499,
    minOrder: 99,
    etaMinutes: 25,
    products: [
      { name: "Desi Tomatoes", description: "Firm, red and farm fresh. Picked this morning.", category: "Fruits & Vegetables", price: 39, mrp: 49, weightValue: 1, weightUnit: "kg", stockQty: 60, bargain: { floor: 30 }, gstRate: 0, image: U("1592924357228-91a4daadcfea") },
      { name: "A2 Cow Milk", description: "Full cream A2 milk, delivered chilled.", category: "Grocery", price: 74, mrp: 78, weightValue: 1, weightUnit: "l", stockQty: 40, gstRate: 0, image: U("1550583724-b2692b85b150") },
      { name: "Whole Wheat Atta", description: "Stone-ground chakki atta for soft rotis.", category: "Staples", price: 285, mrp: 320, weightValue: 5, weightUnit: "kg", stockQty: 25, bargain: { floor: 260 }, gstRate: 5, image: U("1574323347407-f5e1ad6d020b") },
      { name: "Basmati Rice Premium", description: "Long grain aged basmati.", category: "Staples", price: 649, mrp: 720, weightValue: 5, weightUnit: "kg", stockQty: 0, inStock: false, costPrice: 560, bargain: { floor: 600 }, gstRate: 5, image: U("1586201375761-83865001e31c") },
      { name: "Brown Eggs", description: "Free-range brown eggs.", category: "Meat & Eggs", price: 96, mrp: 110, weightValue: 12, weightUnit: "pc", stockQty: 30, gstRate: 0, image: U("1582722872445-44dc5f7e3c8f") },
      { name: "Robusta Bananas", description: "Ripe and sweet, sold by the dozen.", category: "Fruits & Vegetables", price: 49, mrp: 55, weightValue: 1, weightUnit: "kg", stockQty: 0, costPrice: 34, gstRate: 0, image: U("1571771894821-ce9b6c11b08e") },
      { name: "Cold-Pressed Mustard Oil", description: "Kachi ghani mustard oil.", category: "Staples", price: 189, mrp: 210, weightValue: 1, weightUnit: "l", stockQty: 18, gstRate: 5, image: U("1474979266404-7eaacbcd87c5") },
      { name: "Multigrain Cookies", description: "Baked with oats, ragi and jowar.", category: "Snacks", price: 149, mrp: 175, weightValue: 300, weightUnit: "g", stockQty: 22, gstRate: 18, image: U("1499636136210-6f4ee915583e") },
      { name: "Filter Coffee Powder", description: "Dark roast coffee with chicory.", category: "Beverages", price: 325, mrp: 360, weightValue: 500, weightUnit: "g", stockQty: 9, gstRate: 5, image: U("1559056199-641a0ac8b55e") },
    ],
    services: [
      { title: "Gift packing", description: "Wrapped in kraft paper with a ribbon.", price: 49, unitLabel: "per booking", gstRate: 18 },
      { title: "Bulk bagging", description: "Re-bagged into family-size packs.", price: 19, unitLabel: "per bag", gstRate: 18 },
      { title: "Festive hamper packing", description: "Dry fruits and sweets packed in a gift box.", price: 199, unitLabel: "per hamper", gstRate: 18 },
    ],
  },
  {
    owner: 1,
    shopName: "Sharma Dairy & Bakery",
    description: "Fresh paneer made every morning, warm-baked sourdough and buttermilk from our own dairy in Karol Bagh.",
    dp: U("1578916171728-46686eac8d58"),
    locality: "Karol Bagh",
    city: "Delhi",
    pincode: "110005",
    address: "18/2 Bank Street, Karol Bagh, New Delhi 110005",
    category: "Dairy & Bakery",
    rating: 4.6,
    schedule: "closing-tonight",
    deliveryFee: 25,
    freeDeliveryAbove: 399,
    minOrder: 80,
    etaMinutes: 30,
    products: [
      { name: "Fresh Paneer", description: "Soft, milky paneer cut to order.", category: "Dairy & Bakery", price: 99, mrp: 110, weightValue: 200, weightUnit: "g", stockQty: 14, bargain: { floor: 85 }, gstRate: 5, image: U("1631452180519-c014fe946bc7") },
      { name: "Sourdough Loaf", description: "Slow-fermented, baked each morning.", category: "Dairy & Bakery", price: 180, mrp: 199, weightValue: 400, weightUnit: "g", stockQty: 8, gstRate: 5, image: U("1509440159596-0249088772ff") },
      { name: "Masala Buttermilk", description: "Chaas with roasted cumin and mint.", category: "Beverages", price: 35, mrp: 40, weightValue: 500, weightUnit: "ml", stockQty: 30, gstRate: 5, image: U("1626200419199-391ae4be7a41") },
      { name: "Country Eggs", description: "Pasture-raised, six to a pack.", category: "Meat & Eggs", price: 58, mrp: 65, weightValue: 6, weightUnit: "pc", stockQty: 0, inStock: false, gstRate: 0, image: U("1582722872445-44dc5f7e3c8f") },
      { name: "Fresh Cream", description: "Thick cream from the same dairy.", category: "Dairy & Bakery", price: 70, mrp: 80, weightValue: 200, weightUnit: "ml", stockQty: 10, gstRate: 5, image: U("1550583724-b2692b85b150") },
    ],
    services: [
      { title: "Cake box & ribbon", description: "Padded box with ribbon for celebrations.", price: 25, unitLabel: "per box", gstRate: 18 },
      { title: "Weekly milk subscription setup", description: "Set up a daily or alternate-day milk plan.", price: 99, unitLabel: "per month", gstRate: 18 },
    ],
  },
  {
    owner: 2,
    shopName: "Noida Sector 18 Fresh Basket",
    description: "Sector 18 Atta Market favourite for fresh fruit, crisp vegetables and personal care. Quick pickup from the market lane.",
    dp: U("1553163147-622ab57be1c7"),
    locality: "Sector 18",
    city: "Noida",
    pincode: "201301",
    address: "Shop 27, Atta Market, Sector 18, Noida 201301",
    category: "Fruits & Vegetables",
    rating: 4.5,
    schedule: "open",
    deliveryFee: 35,
    freeDeliveryAbove: 599,
    minOrder: 149,
    etaMinutes: 35,
    products: [
      { name: "Organic Veggie Box", description: "Seasonal organic vegetables, about 2 kg.", category: "Fruits & Vegetables", price: 399, mrp: 449, weightValue: 2, weightUnit: "kg", stockQty: 10, bargain: { floor: 340 }, gstRate: 0, image: U("1540420773420-3366772f4999") },
      { name: "Red Apples Shimla", description: "Crisp Shimla apples.", category: "Fruits & Vegetables", price: 189, mrp: 210, weightValue: 1, weightUnit: "kg", stockQty: 20, gstRate: 0, image: U("1560806887-1e4cd0b6cbd6") },
      { name: "Alphonso Mangoes", description: "Hand-picked Alphonso, ripe for eating.", category: "Fruits & Vegetables", price: 599, mrp: 699, weightValue: 1, weightUnit: "kg", stockQty: 5, gstRate: 0, image: U("1553279768-865429fa0078") },
      { name: "Herbal Soap Combo", description: "Pack of four neem and tulsi soaps.", category: "Personal Care", price: 249, mrp: 299, weightValue: 4, weightUnit: "pc", stockQty: 15, gstRate: 18, image: U("1600857544200-b2f666a9a2ec") },
      { name: "Farm Chicken (Skinless)", description: "Cut and cleaned on the same day.", category: "Meat & Eggs", price: 229, mrp: 249, weightValue: 500, weightUnit: "g", stockQty: 12, bargain: { floor: 200 }, gstRate: 0, image: U("1587593810167-a84920ea0781") },
    ],
    services: [
      { title: "Home delivery slot booking", description: "Pick a two-hour delivery window.", price: 15, unitLabel: "per booking", gstRate: 18 },
      { title: "Veggie cutting & cleaning", description: "Washed, peeled and chopped.", price: 39, unitLabel: "per booking", gstRate: 18 },
      { title: "Festive fruit basket", description: "Assorted fruits in a woven basket.", price: 149, unitLabel: "per basket", gstRate: 18 },
    ],
  },
  {
    owner: 3,
    shopName: "Sector 62 Daily Needs",
    description: "Everyday staples, dals, cleaning supplies and snacks for Sector 62 and Sector 76 families.",
    dp: U("1500937386664-56d1dfef3854"),
    locality: "Sector 62",
    city: "Noida",
    pincode: "201309",
    address: "C-9, Block C Market, Sector 62, Noida 201309",
    category: "Grocery",
    rating: 4.4,
    schedule: "closed-until-tomorrow",
    deliveryFee: 30,
    freeDeliveryAbove: 449,
    minOrder: 99,
    etaMinutes: 40,
    products: [
      { name: "Chana Dal", description: "Split Bengal gram, cleaned.", category: "Staples", price: 139, mrp: 160, weightValue: 1, weightUnit: "kg", stockQty: 30, gstRate: 5, image: null },
      { name: "Toor Dal", description: "Premium arhar dal.", category: "Staples", price: 165, mrp: 185, weightValue: 1, weightUnit: "kg", stockQty: 4, gstRate: 5, image: null },
      { name: "Coconut Oil", description: "Cold-pressed coconut oil for cooking and hair.", category: "Staples", price: 215, mrp: 240, weightValue: 500, weightUnit: "ml", stockQty: 12, gstRate: 5, image: U("1474979266404-7eaacbcd87c5") },
      { name: "Banana Chips", description: "Crisp, lightly salted.", category: "Snacks", price: 89, mrp: 99, weightValue: 200, weightUnit: "g", stockQty: 25, gstRate: 12, image: U("1613919113640-25732ec5e61f") },
      { name: "Dishwash Bar Pack of 3", description: "Lemon-fresh dishwash bars.", category: "Household", price: 99, mrp: 120, weightValue: 3, weightUnit: "pc", stockQty: 40, gstRate: 18, image: null },
      { name: "Handwash Refill", description: "Gentle handwash, 250 ml refill.", category: "Personal Care", price: 149, mrp: 170, weightValue: 250, weightUnit: "ml", stockQty: 0, gstRate: 18, image: null },
    ],
    services: [
      { title: "Monthly grocery subscription", description: "We set up a recurring monthly grocery list.", price: 99, unitLabel: "per month", gstRate: 18 },
      { title: "Gift packing", description: "Wrapped in kraft paper with a ribbon.", price: 49, unitLabel: "per booking", gstRate: 18 },
    ],
  },
  {
    owner: 4,
    shopName: "Gurugram Greens",
    description: "Sector 56 market's fresh produce stall. Onions, potatoes, tomatoes and greens picked the same morning.",
    dp: U("1506617564039-2f3b650b7010"),
    locality: "Sector 56",
    city: "Gurugram",
    pincode: "122011",
    address: "Shop 6, Sector 56 Market, Gurugram 122011",
    category: "Fruits & Vegetables",
    rating: 4.6,
    schedule: "open",
    deliveryFee: 29,
    freeDeliveryAbove: 399,
    minOrder: 99,
    etaMinutes: 25,
    products: [
      { name: "Onion", description: "Medium red onions, sold by the kilo.", category: "Fruits & Vegetables", price: 42, mrp: 50, weightValue: 1, weightUnit: "kg", stockQty: 80, bargain: { floor: 35 }, gstRate: 0, image: null },
      { name: "Potato", description: "Fresh potatoes from the mandi.", category: "Fruits & Vegetables", price: 36, mrp: 45, weightValue: 1, weightUnit: "kg", stockQty: 100, gstRate: 0, image: null },
      { name: "Desi Tomatoes", description: "Ripe tomatoes for curry and salad.", category: "Fruits & Vegetables", price: 40, mrp: 48, weightValue: 1, weightUnit: "kg", stockQty: 55, bargain: { floor: 32 }, gstRate: 0, image: U("1592924357228-91a4daadcfea") },
      { name: "Fresh Spinach", description: "Tender palak bunch.", category: "Fruits & Vegetables", price: 20, mrp: 25, weightValue: 250, weightUnit: "g", stockQty: 35, gstRate: 0, image: null },
      { name: "Ginger", description: "Fresh adrak, juicy and sharp.", category: "Fruits & Vegetables", price: 45, mrp: 55, weightValue: 250, weightUnit: "g", stockQty: 20, gstRate: 0, image: null },
      { name: "Green Chilli", description: "Hot green chillies.", category: "Fruits & Vegetables", price: 12, mrp: 15, weightValue: 100, weightUnit: "g", stockQty: 60, gstRate: 0, image: null },
    ],
    services: [
      { title: "Veggie cutting & cleaning", description: "Washed, peeled and chopped.", price: 39, unitLabel: "per booking", gstRate: 18 },
      { title: "Weekend farm box", description: "A curated box of seasonal produce.", price: 249, unitLabel: "per box", gstRate: 18 },
    ],
  },
  {
    owner: 5,
    shopName: "DLF Phase 3 Organic Pantry",
    description: "Certified-style organic pantry near DLF Phase 3. Cold-pressed oils, organic atta, eggs and healthy snacks.",
    dp: U("1542838132-92c53300491e"),
    locality: "DLF Phase 3",
    city: "Gurugram",
    pincode: "122002",
    address: "Unit 4, Galleria Market, DLF Phase 3, Gurugram 122002",
    category: "Grocery",
    rating: 4.8,
    schedule: "open",
    deliveryFee: 39,
    freeDeliveryAbove: 699,
    minOrder: 149,
    etaMinutes: 30,
    products: [
      { name: "Organic Atta", description: "Organic whole wheat atta, stone ground.", category: "Staples", price: 399, mrp: 450, weightValue: 5, weightUnit: "kg", stockQty: 16, bargain: { floor: 350 }, gstRate: 5, image: U("1574323347407-f5e1ad6d020b") },
      { name: "Cold-Pressed Mustard Oil", description: "Small batch, cold pressed.", category: "Staples", price: 219, mrp: 240, weightValue: 500, weightUnit: "ml", stockQty: 14, gstRate: 5, image: U("1474979266404-7eaacbcd87c5") },
      { name: "Organic Veggie Box", description: "Certified organic seasonal box, about 2 kg.", category: "Fruits & Vegetables", price: 449, mrp: 499, weightValue: 2, weightUnit: "kg", stockQty: 8, gstRate: 0, image: U("1540420773420-3366772f4999") },
      { name: "Organic Brown Eggs", description: "Six organic eggs from free-range hens.", category: "Meat & Eggs", price: 119, mrp: 135, weightValue: 6, weightUnit: "pc", stockQty: 20, gstRate: 0, image: U("1582722872445-44dc5f7e3c8f") },
      { name: "Multigrain Cookies", description: "Oats, ragi and jowar, no maida.", category: "Snacks", price: 149, mrp: 175, weightValue: 300, weightUnit: "g", stockQty: 22, gstRate: 18, image: U("1499636136210-6f4ee915583e") },
      { name: "Masala Buttermilk", description: "Chaas with roasted cumin.", category: "Beverages", price: 35, mrp: 40, weightValue: 500, weightUnit: "ml", stockQty: 25, gstRate: 5, image: U("1626200419199-391ae4be7a41") },
    ],
    services: [
      { title: "Organic gift hamper", description: "Assorted organic pantry items in a gift box.", price: 349, unitLabel: "per hamper", gstRate: 18 },
      { title: "Recipe kit packing", description: "Ingredients for one recipe, pre-measured.", price: 79, unitLabel: "per kit", gstRate: 18 },
    ],
  },
];

/** Live ad campaigns shown on the home carousel (sample videos hosted publicly). */
/** Demo admin. Signs in on /auth like any account; signup as admin needs the admin access password. */
export const DEMO_ADMIN = { email: "admin@zepkart.demo", name: "ZepKart Admin", phone: "9810000000" };

/** Three featured clips shipped in public/demo-ads (12 seconds each). */
export const DEMO_CAMPAIGNS = [
  { store: 0, title: "Atta & rice pre-festive offers", description: "Stock up on 5 kg atta and basmati this week.", videoUrl: "/demo-ads/clip-fresh-produce.mp4", durationSec: 12, planDays: 7, daysAgo: 2 },
  { store: 1, title: "Fresh paneer every morning", description: "Soft paneer cut to order from our Karol Bagh dairy.", videoUrl: "/demo-ads/clip-dairy-bakery.mp4", durationSec: 12, planDays: 15, daysAgo: 4 },
  { store: 4, title: "Weekend farm box", description: "Seasonal produce from Sector 56, delivered Saturday morning.", videoUrl: "/demo-ads/clip-weekend-deals.mp4", durationSec: 12, planDays: 30, daysAgo: 6 },
];
