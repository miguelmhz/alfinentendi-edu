-- AlterEnum
ALTER TYPE "AccessStatus" ADD VALUE 'REVOKED';

-- CreateTable
CREATE TABLE "school_book_licenses" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "totalLicenses" INTEGER NOT NULL,
    "usedLicenses" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_book_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_book_licenses_schoolId_idx" ON "school_book_licenses"("schoolId");

-- CreateIndex
CREATE INDEX "school_book_licenses_bookId_idx" ON "school_book_licenses"("bookId");

-- CreateIndex
CREATE INDEX "school_book_licenses_isActive_idx" ON "school_book_licenses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "school_book_licenses_schoolId_bookId_key" ON "school_book_licenses"("schoolId", "bookId");

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
