DROP INDEX "idx_habit_user";--> statement-breakpoint
CREATE INDEX "idx_habits_user_archived_order" ON "habits" USING btree ("user_id","is_archived","sort_order","created_at");