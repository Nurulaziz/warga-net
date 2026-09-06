CREATE INDEX IF NOT EXISTS "mentions_comment_id_idx" ON "mentions"("comment_id");

ALTER TABLE "mentions"
ADD CONSTRAINT "mentions_comment_id_fkey"
FOREIGN KEY ("comment_id") REFERENCES "comments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
