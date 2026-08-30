-- AlterTable: tautkan payment ke grup pembayaran (banyak tagihan dalam satu transaksi Midtrans)
ALTER TABLE "payments" ADD COLUMN     "payment_group_id" TEXT;

-- CreateTable: grup pembayaran online
CREATE TABLE "payment_groups" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "snap_token" TEXT,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "transaction_id" TEXT,
    "payment_type" TEXT,
    "transaction_status" TEXT,
    "paid_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_groups_order_id_key" ON "payment_groups"("order_id");

-- CreateIndex
CREATE INDEX "payment_groups_order_id_idx" ON "payment_groups"("order_id");

-- CreateIndex
CREATE INDEX "payments_payment_group_id_idx" ON "payments"("payment_group_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_group_id_fkey" FOREIGN KEY ("payment_group_id") REFERENCES "payment_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
