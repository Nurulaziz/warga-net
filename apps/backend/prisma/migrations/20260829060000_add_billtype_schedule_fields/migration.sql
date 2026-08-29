-- AlterTable
ALTER TABLE "bill_types" ADD COLUMN     "auto_generate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "due_day" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "generate_day" INTEGER NOT NULL DEFAULT 1;
