/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `schools` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `schools` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_slug_idx" ON "schools"("slug");
