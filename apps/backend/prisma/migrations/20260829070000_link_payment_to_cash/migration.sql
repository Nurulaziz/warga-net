-- AlterTable
ALTER TABLE "cash_transactions" ADD COLUMN     "payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cash_transactions_payment_id_key" ON "cash_transactions"("payment_id");

-- AddForeignKey
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
