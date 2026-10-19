import {
  pgTable,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  shopName: varchar("shop_name", { length: 160 }).notNull(),
  description: text("description"),
  dpUrl: text("dp_url"),
  phone: varchar("phone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  address: text("address"),
  city: varchar("city", { length: 80 }),
  category: varchar("category", { length: 60 }).default("Grocery"),
  isOpen: boolean("is_open").default(true).notNull(),
  nextOpeningAt: varchar("next_opening_at", { length: 80 }),
  nextClosingAt: varchar("next_closing_at", { length: 80 }),
  openingHours: varchar("opening_hours", { length: 120 }).default("9:00 AM – 10:00 PM"),
  deliveryAvailable: boolean("delivery_available").default(true).notNull(),
  pickupAvailable: boolean("pickup_available").default(true).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("29"),
  deliveryRadiusKm: numeric("delivery_radius_km", { precision: 6, scale: 2 }).default("5"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.5"),
  totalOrders: integer("total_orders").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  mrp: numeric("mrp", { precision: 10, scale: 2 }).default("0"),
  weight: varchar("weight", { length: 40 }).default("500g"),
  weightUnit: varchar("weight_unit", { length: 20 }).default("g"),
  stockQty: integer("stock_qty").default(50).notNull(),
  status: varchar("status", { length: 20 }).default("available").notNull(),
  category: varchar("category", { length: 60 }).default("Staples"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 40 }).default("per visit"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promos = pgTable("promos", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  durationSec: integer("duration_sec").default(60).notNull(),
  season: varchar("season", { length: 30 }).default("Normal").notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  startsAt: timestamp("starts_at").defaultNow(),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "cascade",
  }),
  storeId: uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  customerId: uuid("customer_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  type: varchar("type", { length: 30 }).default("general").notNull(),
  offerPrice: numeric("offer_price", { precision: 10, scale: 2 }),
  fulfillment: varchar("fulfillment", { length: 20 }).default("delivery"),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id")
    .references(() => threads.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  offerPrice: numeric("offer_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id")
    .references(() => stores.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  facilityId: uuid("facility_id").references(() => facilities.id, {
    onDelete: "set null",
  }),
  customerId: uuid("customer_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  customerName: varchar("customer_name", { length: 120 }),
  qty: integer("qty").default(1).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).default("0"),
  fulfillment: varchar("fulfillment", { length: 20 }).default("delivery").notNull(),
  status: varchar("status", { length: 30 }).default("pending").notNull(),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type Promo = typeof promos.$inferSelect;
export type Thread = typeof threads.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Order = typeof orders.$inferSelect;
