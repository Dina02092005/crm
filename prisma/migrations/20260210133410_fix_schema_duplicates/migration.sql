-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_leadId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "savedAddresses" JSONB,
ALTER COLUMN "leadId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageUrl" TEXT;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
