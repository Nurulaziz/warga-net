-- CreateTable
CREATE TABLE "letter_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "letter_number" TEXT NOT NULL,
    "resident_id" TEXT,
    "recipient_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issued_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "group" TEXT NOT NULL DEFAULT 'general',

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter_templates_name_key" ON "letter_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "letters_letter_number_key" ON "letters"("letter_number");

-- CreateIndex
CREATE INDEX "letters_template_id_idx" ON "letters"("template_id");

-- CreateIndex
CREATE INDEX "letters_resident_id_idx" ON "letters"("resident_id");

-- CreateIndex
CREATE INDEX "letters_status_idx" ON "letters"("status");

-- CreateIndex
CREATE INDEX "letters_created_at_idx" ON "letters"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_group_idx" ON "system_settings"("group");

-- AddForeignKey
ALTER TABLE "letters" ADD CONSTRAINT "letters_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "letter_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
