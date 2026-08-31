CREATE TABLE "post_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "post_id" TEXT,
    "comment_id" TEXT,
    "target_type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "post_reports_target_check" CHECK (
      ("target_type" = 'POST' AND "post_id" IS NOT NULL AND "comment_id" IS NULL) OR
      ("target_type" = 'COMMENT' AND "comment_id" IS NOT NULL AND "post_id" IS NULL)
    )
);

CREATE UNIQUE INDEX "post_reports_reporter_id_post_id_key" ON "post_reports"("reporter_id", "post_id");
CREATE UNIQUE INDEX "post_reports_reporter_id_comment_id_key" ON "post_reports"("reporter_id", "comment_id");
CREATE INDEX "post_reports_status_created_at_idx" ON "post_reports"("status", "created_at");
CREATE INDEX "post_reports_post_id_idx" ON "post_reports"("post_id");
CREATE INDEX "post_reports_comment_id_idx" ON "post_reports"("comment_id");

ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
