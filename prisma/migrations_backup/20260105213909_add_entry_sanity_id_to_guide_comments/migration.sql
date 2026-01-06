-- AlterTable
ALTER TABLE "guide_comments" ADD COLUMN     "entrySanityId" TEXT;

-- CreateIndex
CREATE INDEX "guide_comments_entrySanityId_idx" ON "guide_comments"("entrySanityId");
