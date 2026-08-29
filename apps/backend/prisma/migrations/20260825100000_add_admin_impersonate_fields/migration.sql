-- AlterTable: Tambah field admin plugin ke ba_user
ALTER TABLE "ba_user" ADD COLUMN "role" TEXT;
ALTER TABLE "ba_user" ADD COLUMN "banned" BOOLEAN;
ALTER TABLE "ba_user" ADD COLUMN "ban_reason" TEXT;
ALTER TABLE "ba_user" ADD COLUMN "ban_expires" TIMESTAMP(3);

-- AlterTable: Tambah field impersonatedBy ke ba_session
ALTER TABLE "ba_session" ADD COLUMN "impersonated_by" TEXT;
