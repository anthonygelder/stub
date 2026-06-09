-- CreateTable
CREATE TABLE "collection_stubs" (
    "collection_id" TEXT NOT NULL,
    "stub_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_stubs_pkey" PRIMARY KEY ("collection_id","stub_id")
);

-- AddForeignKey
ALTER TABLE "collection_stubs" ADD CONSTRAINT "collection_stubs_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_stubs" ADD CONSTRAINT "collection_stubs_stub_id_fkey" FOREIGN KEY ("stub_id") REFERENCES "stubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
