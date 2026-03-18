-- CreateTable
CREATE TABLE "book_reading_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "bookSanityId" TEXT NOT NULL,
    "sessionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEnd" TIMESTAMP(3),
    "duration" INTEGER,
    "pagesViewed" INTEGER,
    "lastPage" INTEGER,
    "deviceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reading_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_reading_logs_userId_idx" ON "book_reading_logs"("userId");

-- CreateIndex
CREATE INDEX "book_reading_logs_bookId_idx" ON "book_reading_logs"("bookId");

-- CreateIndex
CREATE INDEX "book_reading_logs_bookSanityId_idx" ON "book_reading_logs"("bookSanityId");

-- CreateIndex
CREATE INDEX "book_reading_logs_sessionStart_idx" ON "book_reading_logs"("sessionStart");

-- AddForeignKey
ALTER TABLE "book_reading_logs" ADD CONSTRAINT "book_reading_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reading_logs" ADD CONSTRAINT "book_reading_logs_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
