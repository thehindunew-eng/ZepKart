CREATE TABLE "ad_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"duration_sec" integer NOT NULL,
	"plan_days" integer NOT NULL,
	"season_name" varchar(80) NOT NULL,
	"season_multiplier" numeric(5, 2) NOT NULL,
	"demand_multiplier" numeric(5, 3) NOT NULL,
	"length_factor" numeric(5, 2) NOT NULL,
	"plan_discount_pct" numeric(5, 2) NOT NULL,
	"base_amount" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"taxable_amount" numeric(12, 2) NOT NULL,
	"gst_amount" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extra_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"image_url" text,
	"price" numeric(12, 2) NOT NULL,
	"unit_label" varchar(60) DEFAULT 'per booking' NOT NULL,
	"gst_rate" integer DEFAULT 18 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid,
	"kind" varchar(20) DEFAULT 'text' NOT NULL,
	"content" text,
	"price" numeric(12, 2),
	"mode" varchar(10),
	"state" varchar(20) DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"name" varchar(160) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"list_price" numeric(12, 2) NOT NULL,
	"qty" integer NOT NULL,
	"gst_rate" integer NOT NULL,
	"gst_amount" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"agreed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"service_id" uuid,
	"title" varchar(160) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"qty" integer NOT NULL,
	"gst_rate" integer NOT NULL,
	"gst_amount" numeric(12, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"customer_id" uuid,
	"customer_name" varchar(120) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"fulfillment" varchar(10) NOT NULL,
	"address" text,
	"pincode" varchar(6),
	"note" text,
	"status" varchar(24) DEFAULT 'new' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"services_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"delivery_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gst_amount" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"reject_reason" text,
	"eta_minutes" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"store_id" uuid,
	"campaign_id" uuid,
	"purpose" varchar(20) DEFAULT 'ad' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" varchar(10) NOT NULL,
	"reference" varchar(40) NOT NULL,
	"masked_details" varchar(80) NOT NULL,
	"status" varchar(20) DEFAULT 'succeeded' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text,
	"image_url" text,
	"category" varchar(60) DEFAULT 'Grocery' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"mrp" numeric(12, 2) NOT NULL,
	"weight_value" numeric(10, 3) DEFAULT '1' NOT NULL,
	"weight_unit" varchar(10) DEFAULT 'pc' NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"bargain_enabled" boolean DEFAULT false NOT NULL,
	"floor_price" numeric(12, 2),
	"gst_rate" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"shop_name" varchar(160) NOT NULL,
	"description" text,
	"dp_url" text,
	"cover_url" text,
	"phone" varchar(20),
	"whatsapp" varchar(20),
	"address" text,
	"locality" varchar(120),
	"city" varchar(40) DEFAULT 'Delhi' NOT NULL,
	"pincode" varchar(6),
	"category" varchar(60) DEFAULT 'Grocery' NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"next_opening_at" timestamp with time zone,
	"next_closing_at" timestamp with time zone,
	"opening_hours" varchar(120) DEFAULT '8:00 AM – 10:00 PM',
	"pickup_available" boolean DEFAULT true NOT NULL,
	"delivery_available" boolean DEFAULT true NOT NULL,
	"delivery_fee" numeric(12, 2) DEFAULT '29' NOT NULL,
	"free_delivery_above" numeric(12, 2) DEFAULT '499' NOT NULL,
	"min_order" numeric(12, 2) DEFAULT '99' NOT NULL,
	"eta_minutes" integer DEFAULT 30 NOT NULL,
	"rating" numeric(2, 1) DEFAULT '4.5',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"agreed_price" numeric(12, 2),
	"agreed_until" timestamp with time zone,
	"fulfillment" varchar(10),
	"customer_unread" integer DEFAULT 0 NOT NULL,
	"vendor_unread" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"phone" varchar(20),
	"role" varchar(20) DEFAULT 'customer' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extra_services" ADD CONSTRAINT "extra_services_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_services" ADD CONSTRAINT "order_services_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_services" ADD CONSTRAINT "order_services_service_id_extra_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."extra_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_store_idx" ON "ad_campaigns" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "ads_status_idx" ON "ad_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "services_store_idx" ON "extra_services" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "messages_thread_idx" ON "messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_store_idx" ON "orders" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "products_store_idx" ON "products" USING btree ("store_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_owner_uidx" ON "stores" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "stores_city_idx" ON "stores" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "threads_product_customer_uidx" ON "threads" USING btree ("product_id","customer_id");--> statement-breakpoint
CREATE INDEX "threads_store_idx" ON "threads" USING btree ("store_id");