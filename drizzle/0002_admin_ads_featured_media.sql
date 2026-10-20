CREATE TABLE "featured_clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(160) NOT NULL,
	"subtitle" varchar(160),
	"video_url" text NOT NULL,
	"duration_sec" integer DEFAULT 10 NOT NULL,
	"store_id" uuid,
	"campaign_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"name" varchar(80) PRIMARY KEY NOT NULL,
	"mime" varchar(40) NOT NULL,
	"size" integer NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(120) NOT NULL,
	"contact" varchar(160) NOT NULL,
	"topic" varchar(40) NOT NULL,
	"order_ref" varchar(40),
	"message" text NOT NULL,
	"status" varchar(12) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_campaigns" ALTER COLUMN "store_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD COLUMN "wholesaler_id" uuid;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD COLUMN "requester_id" uuid;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD COLUMN "reject_reason" text;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dest_lat" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dest_lng" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rider_name" varchar(80);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rider_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "rider_vehicle" varchar(40);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dispatched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "featured_clips" ADD CONSTRAINT "featured_clips_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_clips" ADD CONSTRAINT "featured_clips_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "featured_sort_idx" ON "featured_clips" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "support_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_wholesaler_id_wholesalers_id_fk" FOREIGN KEY ("wholesaler_id") REFERENCES "public"."wholesalers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ads_wh_idx" ON "ad_campaigns" USING btree ("wholesaler_id");