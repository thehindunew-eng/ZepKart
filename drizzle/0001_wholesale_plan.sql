CREATE TABLE "restock_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"product_id" uuid,
	"item_name" varchar(160) NOT NULL,
	"weight_label" varchar(40),
	"qty" integer NOT NULL,
	"last_cost" numeric(12, 2),
	"quote_price" numeric(12, 2),
	"quote_qty" integer,
	"status" varchar(12) DEFAULT 'requested' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"wholesaler_id" uuid NOT NULL,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesaler_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wholesaler_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(60) DEFAULT 'Grocery' NOT NULL,
	"image_url" text,
	"weight_value" numeric(10, 3) DEFAULT '1' NOT NULL,
	"weight_unit" varchar(10) DEFAULT 'pc' NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"moq" integer DEFAULT 1 NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"grade" varchar(2) DEFAULT 'A' NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wholesalers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(160) NOT NULL,
	"description" text,
	"dp_url" text,
	"gstin" varchar(20),
	"phone" varchar(20),
	"address" text,
	"locality" varchar(120),
	"city" varchar(40) DEFAULT 'Delhi' NOT NULL,
	"pincode" varchar(6),
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"rating" numeric(2, 1) DEFAULT '4.2' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lat" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lng" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "plan" varchar(12) DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "restock_lines" ADD CONSTRAINT "restock_lines_request_id_restock_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."restock_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_lines" ADD CONSTRAINT "restock_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_requests" ADD CONSTRAINT "restock_requests_wholesaler_id_wholesalers_id_fk" FOREIGN KEY ("wholesaler_id") REFERENCES "public"."wholesalers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesaler_products" ADD CONSTRAINT "wholesaler_products_wholesaler_id_wholesalers_id_fk" FOREIGN KEY ("wholesaler_id") REFERENCES "public"."wholesalers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wholesalers" ADD CONSTRAINT "wholesalers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "restock_lines_request_idx" ON "restock_lines" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "restock_lines_product_idx" ON "restock_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "restock_requests_store_idx" ON "restock_requests" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "restock_requests_wh_idx" ON "restock_requests" USING btree ("wholesaler_id");--> statement-breakpoint
CREATE INDEX "wholesaler_products_wh_idx" ON "wholesaler_products" USING btree ("wholesaler_id");--> statement-breakpoint
CREATE INDEX "wholesaler_products_name_idx" ON "wholesaler_products" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "wholesalers_user_uidx" ON "wholesalers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wholesalers_city_idx" ON "wholesalers" USING btree ("city");