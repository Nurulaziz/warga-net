-- AlterTable: Tambah field payment gateway Midtrans ke payments
ALTER TABLE "payments" ADD COLUMN "transaction_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "order_id" TEXT;
ALTER TABLE "payments" ADD COLUMN "snap_token" TEXT;
ALTER TABLE "payments" ADD COLUMN "payment_type" TEXT;
ALTER TABLE "payments" ADD COLUMN "transaction_status" TEXT;
ALTER TABLE "payments" ADD COLUMN "reference_no" TEXT;

-- CreateIndex: order_id unik untuk mencegah duplikasi transaksi Midtrans
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex: index untuk lookup by order_id (webhook handler)
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
