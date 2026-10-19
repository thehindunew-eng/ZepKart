import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  avatarUrl: text("avatar_url"),
  createdAt: ts("created_at").defaultNow().notNull(),
});

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shopName: varchar("shop_name", { length: 160 }).notNull(),
    description: text("description"),
    dpUrl: text("dp_url"),
    coverUrl: text("cover_url"),
    phone: varchar("phone", { length: 20 }),
    whatsapp: varchar("whatsapp", { length: 20 }),
    address: text("address"),
    locality: varchar("locality", { length: 120 }),
    city: varchar("city", { length: 40 }).notNull().default("Delhi"),
    pincode: varchar("pincode", { length: 6 }),
    category: varchar("category", { length: 60 }).notNull().default("Grocery"),
    // Open / close state. nextOpeningAt / nextClosingAt drive automatic flips.
    isOpen: boolean("is_open").notNull().default(true),
    nextOpeningAt: ts("next_opening_at"),
    nextClosingAt: ts("next_closing_at"),
    openingHours: varchar("opening_hours", { length: 120 }).default("8:00 AM – 10:00 PM"),
    pickupAvailable: boolean("pickup_available").notNull().default(true),
    deliveryAvailable: boolean("delivery_available").notNull().default(true),
    deliveryFee: money("delivery_fee").notNull().default("29"),
    freeDeliveryAbove: money("free_delivery_above").notNull().default("499"),
    minOrder: money("min_order").notNull().default("99"),
    etaMinutes: integer("eta_minutes").notNull().default(30),
    rating: numeric("rating", { precision: 2, scale: 1 }).default("4.5"),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("stores_owner_uidx").on(t.ownerId), index("stores_city_idx").on(t.city)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    category: varchar("category", { length: 60 }).notNull().default("Grocery"),
    price: money("price").notNull(),
    mrp: money("mrp").notNull(),
    weightValue: numeric("weight_value", { precision: 10, scale: 3 }).notNull().default("1"),
    weightUnit: varchar("weight_unit", { length: 10 }).notNull().default("pc"),
    stockQty: integer("stock_qty").notNull().default(0),
    inStock: boolean("in_stock").notNull().default(true),
    bargainEnabled: boolean("bargain_enabled").notNull().default(false),
    // Hidden from customers. Offers at or above this price are accepted automatically.
    floorPrice: money("floor_price"),
    gstRate: integer("gst_rate").notNull().default(5),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("products_store_idx").on(t.storeId)],
);

export const extraServices = pgTable(
  "extra_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: money("price").notNull(),
    unitLabel: varchar("unit_label", { length: 60 }).notNull().default("per booking"),
    gstRate: integer("gst_rate").notNull().default(18),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("services_store_idx").on(t.storeId)],
);

// One chat thread per item per customer.
export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("open"), // open | agreed
    agreedPrice: money("agreed_price"),
    agreedUntil: ts("agreed_until"),
    fulfillment: varchar("fulfillment", { length: 10 }), // pickup | delivery
    customerUnread: integer("customer_unread").notNull().default(0),
    vendorUnread: integer("vendor_unread").notNull().default(0),
    lastMessageAt: ts("last_message_at").defaultNow().notNull(),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("threads_product_customer_uidx").on(t.productId, t.customerId), index("threads_store_idx").on(t.storeId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
    kind: varchar("kind", { length: 20 }).notNull().default("text"), // text | offer | fulfillment | system
    content: text("content"),
    price: money("price"),
    mode: varchar("mode", { length: 10 }), // pickup | delivery
    state: varchar("state", { length: 20 }).notNull().default("none"), // none | pending | accepted | declined | countered
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId, t.createdAt)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => users.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    fulfillment: varchar("fulfillment", { length: 10 }).notNull(), // pickup | delivery
    address: text("address"),
    pincode: varchar("pincode", { length: 6 }),
    note: text("note"),
    // new | accepted | preparing | ready | out_for_delivery | completed | rejected | cancelled
    status: varchar("status", { length: 24 }).notNull().default("new"),
    subtotal: money("subtotal").notNull(),
    servicesTotal: money("services_total").notNull().default("0"),
    deliveryFee: money("delivery_fee").notNull().default("0"),
    gstAmount: money("gst_amount").notNull(),
    total: money("total").notNull(),
    rejectReason: text("reject_reason"),
    etaMinutes: integer("eta_minutes").notNull().default(30),
    createdAt: ts("created_at").defaultNow().notNull(),
    updatedAt: ts("updated_at").defaultNow().notNull(),
  },
  (t) => [index("orders_store_idx").on(t.storeId, t.status), index("orders_customer_idx").on(t.customerId)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  unitPrice: money("unit_price").notNull(),
  listPrice: money("list_price").notNull(),
  qty: integer("qty").notNull(),
  gstRate: integer("gst_rate").notNull(),
  gstAmount: money("gst_amount").notNull(),
  lineTotal: money("line_total").notNull(),
  agreed: boolean("agreed").notNull().default(false),
});

export const orderServices = pgTable("order_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => extraServices.id, { onDelete: "set null" }),
  title: varchar("title", { length: 160 }).notNull(),
  unitPrice: money("unit_price").notNull(),
  qty: integer("qty").notNull(),
  gstRate: integer("gst_rate").notNull(),
  gstAmount: money("gst_amount").notNull(),
  lineTotal: money("line_total").notNull(),
});

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    videoUrl: text("video_url").notNull(),
    durationSec: integer("duration_sec").notNull(),
    planDays: integer("plan_days").notNull(),
    seasonName: varchar("season_name", { length: 80 }).notNull(),
    seasonMultiplier: numeric("season_multiplier", { precision: 5, scale: 2 }).notNull(),
    demandMultiplier: numeric("demand_multiplier", { precision: 5, scale: 3 }).notNull(),
    lengthFactor: numeric("length_factor", { precision: 5, scale: 2 }).notNull(),
    planDiscountPct: numeric("plan_discount_pct", { precision: 5, scale: 2 }).notNull(),
    baseAmount: money("base_amount").notNull(),
    discountAmount: money("discount_amount").notNull(),
    taxableAmount: money("taxable_amount").notNull(),
    gstAmount: money("gst_amount").notNull(),
    total: money("total").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | active | expired
    startsAt: ts("starts_at"),
    endsAt: ts("ends_at"),
    createdAt: ts("created_at").defaultNow().notNull(),
  },
  (t) => [index("ads_store_idx").on(t.storeId), index("ads_status_idx").on(t.status)],
);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => adCampaigns.id, { onDelete: "set null" }),
  purpose: varchar("purpose", { length: 20 }).notNull().default("ad"),
  amount: money("amount").notNull(),
  method: varchar("method", { length: 10 }).notNull(), // upi | card
  reference: varchar("reference", { length: 40 }).notNull().unique(),
  // Only masked details are stored (never card numbers or CVV).
  maskedDetails: varchar("masked_details", { length: 80 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("succeeded"),
  createdAt: ts("created_at").defaultNow().notNull(),
});
