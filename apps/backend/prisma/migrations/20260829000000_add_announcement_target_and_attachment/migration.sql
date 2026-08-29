-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "target_scope" TEXT NOT NULL DEFAULT 'all';
