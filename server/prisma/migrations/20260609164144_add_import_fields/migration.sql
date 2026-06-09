-- AlterTable
ALTER TABLE "stubs" ADD COLUMN     "import_data" JSONB,
ADD COLUMN     "import_source" TEXT,
ADD COLUMN     "is_draft" BOOLEAN NOT NULL DEFAULT false;
