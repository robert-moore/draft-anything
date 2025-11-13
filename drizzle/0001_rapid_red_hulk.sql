CREATE SCHEMA "da";
--> statement-breakpoint
CREATE TYPE "da"."draft_state" AS ENUM('setting_up', 'active', 'completed', 'errored', 'paused', 'canceled', 'challenge', 'challenge_window');--> statement-breakpoint
CREATE TABLE "da"."draft_challenge_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"voter_user_id" uuid NOT NULL,
	"vote" boolean NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "unique_challenge_vote" UNIQUE("challenge_id","voter_user_id")
);
--> statement-breakpoint
CREATE TABLE "da"."draft_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"challenged_pick_number" smallint NOT NULL,
	"challenged_user_id" uuid NOT NULL,
	"challenger_user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "da"."draft_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"message_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "da"."draft_curated_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "da"."draft_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"draft_id" integer NOT NULL,
	"pick_number" smallint NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "da"."draft_selections" (
	"draft_id" integer,
	"user_id" uuid,
	"pick_number" smallint NOT NULL,
	"created_at" timestamp NOT NULL,
	"payload" text,
	"curated_option_id" integer,
	"was_auto_pick" boolean DEFAULT false,
	"time_taken_seconds" numeric,
	CONSTRAINT "unique_draft_pick_number" UNIQUE("draft_id","pick_number")
);
--> statement-breakpoint
CREATE TABLE "da"."draft_users" (
	"draft_id" integer,
	"user_id" uuid,
	"draft_username" text NOT NULL,
	"position" smallint,
	"is_ready" boolean NOT NULL,
	"is_guest" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "da"."drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guid" uuid NOT NULL,
	"admin_user_id" uuid,
	"name" text NOT NULL,
	"draft_state" "da"."draft_state" NOT NULL,
	"max_drafters" smallint NOT NULL,
	"sec_per_round" numeric NOT NULL,
	"num_rounds" smallint NOT NULL,
	"current_position_on_clock" smallint,
	"turn_started_at" timestamp,
	"timer_paused" boolean DEFAULT false,
	"is_freeform" boolean DEFAULT true NOT NULL,
	"join_code" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "drafts_guid_unique" UNIQUE("guid")
);
--> statement-breakpoint
CREATE TABLE "da"."profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "da"."draft_challenge_votes" ADD CONSTRAINT "draft_challenge_votes_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "da"."draft_challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_challenges" ADD CONSTRAINT "draft_challenges_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "da"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_messages" ADD CONSTRAINT "draft_messages__draft_fkey" FOREIGN KEY ("draft_id") REFERENCES "da"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_messages" ADD CONSTRAINT "draft_messages_user_fkey" FOREIGN KEY ("user_id") REFERENCES "da"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_curated_options" ADD CONSTRAINT "draft_curated_options_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "da"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_reactions" ADD CONSTRAINT "draft_reactions_selection_fkey" FOREIGN KEY ("draft_id","pick_number") REFERENCES "da"."draft_selections"("draft_id","pick_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_selections" ADD CONSTRAINT "draft_selections_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "da"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_selections" ADD CONSTRAINT "draft_selections_curated_option_id_fkey" FOREIGN KEY ("curated_option_id") REFERENCES "da"."draft_curated_options"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "da"."draft_users" ADD CONSTRAINT "draft_users_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "da"."drafts"("id") ON DELETE no action ON UPDATE no action;