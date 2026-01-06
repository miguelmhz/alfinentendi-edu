/*
  Warnings:

  - You are about to drop the column `page` on the `annotations` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `annotations` table. All the data in the column will be lost.
  - Added the required column `pageIndex` to the `annotations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rect` to the `annotations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."annotations_page_idx";

-- AlterTable
ALTER TABLE "annotations" DROP COLUMN "page",
DROP COLUMN "position",
ADD COLUMN     "blendMode" TEXT DEFAULT 'Normal',
ADD COLUMN     "customData" JSONB,
ADD COLUMN     "inkPaths" JSONB,
ADD COLUMN     "lineCoordinates" JSONB,
ADD COLUMN     "opacity" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN     "pageIndex" INTEGER NOT NULL,
ADD COLUMN     "rect" JSONB NOT NULL,
ADD COLUMN     "segmentRects" JSONB,
ADD COLUMN     "strokeWidth" DOUBLE PRECISION,
ADD COLUMN     "vertices" JSONB;

-- CreateTable
CREATE TABLE "annotation_comments" (
    "id" TEXT NOT NULL,
    "annotationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotation_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annotation_comments_annotationId_idx" ON "annotation_comments"("annotationId");

-- CreateIndex
CREATE INDEX "annotation_comments_userId_idx" ON "annotation_comments"("userId");

-- CreateIndex
CREATE INDEX "annotations_pageIndex_idx" ON "annotations"("pageIndex");

-- CreateIndex
CREATE INDEX "annotations_type_idx" ON "annotations"("type");

-- AddForeignKey
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_annotationId_fkey" FOREIGN KEY ("annotationId") REFERENCES "annotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotation_comments" ADD CONSTRAINT "annotation_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
