CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'cliente' NOT NULL,
	"cpf" text,
	"phone" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"city" text,
	"alias" text,
	"status" text DEFAULT 'active' NOT NULL,
	"suspension_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_city" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_item" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_highlight" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"professional_name" text NOT NULL,
	"cover_url" text NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"kind" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professional_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"artistic_name" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"neighborhood" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"short_description" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"service_description" text DEFAULT '' NOT NULL,
	"starting_price" numeric(10, 2) DEFAULT 0 NOT NULL,
	"age" smallint DEFAULT 0 NOT NULL,
	"height_cm" smallint DEFAULT 0 NOT NULL,
	"weight_kg" smallint DEFAULT 0 NOT NULL,
	"ethnicity" text DEFAULT '' NOT NULL,
	"eye_color" text DEFAULT '' NOT NULL,
	"hair_type" text DEFAULT '' NOT NULL,
	"hair_color" text DEFAULT '' NOT NULL,
	"services" text[] DEFAULT '{}'::text[] NOT NULL,
	"service_options" text[] DEFAULT '{}'::text[] NOT NULL,
	"fetish_options" text[] DEFAULT '{}'::text[] NOT NULL,
	"fetish_custom" text DEFAULT '' NOT NULL,
	"pricing_table" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payment_methods" text[] DEFAULT '{}'::text[] NOT NULL,
	"availability_status" text DEFAULT 'livre' NOT NULL,
	"ad_tier" text DEFAULT 'normal' NOT NULL,
	"listing_status" text DEFAULT 'Pausado' NOT NULL,
	"verification_status" text DEFAULT 'pending_review' NOT NULL,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspension_reason" text,
	"profile_image_asset_id" text,
	"external_images" text[] DEFAULT '{}'::text[] NOT NULL,
	"external_profile_image" text,
	"external_profile_image_index" smallint,
	"rating" numeric(3, 2) DEFAULT 0 NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"whatsapp_number" text,
	"telegram_username" text,
	"draft" jsonb,
	"draft_saved_at" timestamp with time zone,
	"search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce("artistic_name", '') || ' ' || coalesce("display_name", '') || ' ' || coalesce("city", '') || ' ' || coalesce("neighborhood", '') || ' ' || coalesce("category", '') || ' ' || coalesce("short_description", ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_asset" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"profile_id" text,
	"kind" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending_upload' NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"file_name" text,
	"storage_key" text NOT NULL,
	"thumbnail_key" text,
	"width" integer,
	"height" integer,
	"position" smallint,
	"moderation_reason" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_participant" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"alias" text,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"deleted_from_inbox_at" timestamp with time zone,
	"last_read_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"client_user_id" text NOT NULL,
	"professional_user_id" text NOT NULL,
	"last_message_preview" text DEFAULT '' NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender_user_id" text NOT NULL,
	"sender_role" text NOT NULL,
	"message_type" text NOT NULL,
	"content" text,
	"media_asset_id" text,
	"is_view_once" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp with time zone,
	"brief" jsonb,
	"client_message_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone,
	"edited_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "admin_activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"target_name" text NOT NULL,
	"target_id" text,
	"admin_email" text,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"href" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"reporter_user_id" text,
	"reporter_name" text NOT NULL,
	"reporter_role" text NOT NULL,
	"reported_user_id" text,
	"reported_name" text NOT NULL,
	"reported_role" text NOT NULL,
	"conversation_id" text,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"client_user_id" text NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"conversation_id" text,
	"author_user_id" text,
	"author_name" text NOT NULL,
	"score" smallint NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"is_seed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_event" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"cycle" text NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_channel" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel" text NOT NULL,
	"target" text NOT NULL,
	"code_hash" text,
	"code_sent_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_account" ADD CONSTRAINT "admin_account_user_id_admin_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_user_id_admin_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_profile" ADD CONSTRAINT "professional_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_profile_id_professional_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professional_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_profile_id_professional_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professional_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_professional_user_id_user_id_fk" FOREIGN KEY ("professional_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_media_asset_id_media_asset_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reported_user_id_user_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_invite" ADD CONSTRAINT "review_invite_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_invite" ADD CONSTRAINT "review_invite_profile_id_professional_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professional_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_invite" ADD CONSTRAINT "review_invite_client_user_id_user_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_profile_id_professional_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professional_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_event" ADD CONSTRAINT "subscription_event_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_channel" ADD CONSTRAINT "verification_channel_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_account_user_id_idx" ON "admin_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_session_token_key" ON "admin_session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "admin_session_user_id_idx" ON "admin_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admin_verification_identifier_idx" ON "admin_verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_city_city_state_key" ON "catalog_city" USING btree ("city","state");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_item_kind_label_key" ON "catalog_item" USING btree ("kind","label");--> statement-breakpoint
CREATE INDEX "catalog_item_kind_idx" ON "catalog_item" USING btree ("kind","position");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_profile_user_id_key" ON "professional_profile" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_profile_slug_key" ON "professional_profile" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "professional_profile_feed_idx" ON "professional_profile" USING btree ("verification_status","listing_status","is_suspended","city","ad_tier");--> statement-breakpoint
CREATE INDEX "professional_profile_starting_price_idx" ON "professional_profile" USING btree ("starting_price");--> statement-breakpoint
CREATE INDEX "professional_profile_category_idx" ON "professional_profile" USING btree ("category");--> statement-breakpoint
CREATE INDEX "professional_profile_rating_idx" ON "professional_profile" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "professional_profile_views_idx" ON "professional_profile" USING btree ("profile_views");--> statement-breakpoint
CREATE INDEX "professional_profile_search_idx" ON "professional_profile" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "professional_profile_artistic_name_trgm_idx" ON "professional_profile" USING gin ("artistic_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "media_asset_owner_idx" ON "media_asset" USING btree ("owner_user_id","purpose","status");--> statement-breakpoint
CREATE INDEX "media_asset_profile_gallery_idx" ON "media_asset" USING btree ("profile_id","purpose","position");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_participant_key" ON "conversation_participant" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "conversation_participant_user_idx" ON "conversation_participant" USING btree ("user_id","deleted_from_inbox_at");--> statement-breakpoint
CREATE UNIQUE INDEX "conversation_profile_client_key" ON "conversation" USING btree ("profile_id","client_user_id");--> statement-breakpoint
CREATE INDEX "conversation_client_idx" ON "conversation" USING btree ("client_user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversation_professional_idx" ON "conversation" USING btree ("professional_user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "message_conversation_sent_idx" ON "message" USING btree ("conversation_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "message_client_id_key" ON "message" USING btree ("conversation_id","sender_user_id","client_message_id");--> statement-breakpoint
CREATE INDEX "admin_activity_log_created_idx" ON "admin_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_user_key" ON "notification" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_invite_conversation_key" ON "review_invite" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "review_invite_client_idx" ON "review_invite" USING btree ("client_user_id");--> statement-breakpoint
CREATE INDEX "review_invite_expires_idx" ON "review_invite" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "review_profile_idx" ON "review" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "review_conversation_key" ON "review" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_event_idempotency_key" ON "subscription_event" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "subscription_event_subscription_idx" ON "subscription_event" USING btree ("subscription_id","occurred_at");--> statement-breakpoint
CREATE INDEX "subscription_user_idx" ON "subscription" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "subscription_status_period_idx" ON "subscription" USING btree ("status","current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_channel_user_channel_key" ON "verification_channel" USING btree ("user_id","channel");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_delivery_provider_external_key" ON "webhook_delivery" USING btree ("provider","external_id");