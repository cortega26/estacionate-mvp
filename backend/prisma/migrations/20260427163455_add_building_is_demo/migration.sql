-- AlterTable
ALTER TABLE "buildings" ADD COLUMN     "is_demo" BOOLEAN NOT NULL DEFAULT false;

UPDATE "buildings"
SET "is_demo" = true
WHERE "id" = '478c9ef2-7087-42cc-a255-70200d1e7618'
	OR "name" ILIKE '%demo%'
	OR "contact_email" ILIKE '%@demo.%';
