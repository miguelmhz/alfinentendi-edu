-- CreateTable
CREATE TABLE "guide_comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guide_comment_likes_commentId_idx" ON "guide_comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "guide_comment_likes_userId_idx" ON "guide_comment_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guide_comment_likes_commentId_userId_key" ON "guide_comment_likes"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "guide_comment_likes" ADD CONSTRAINT "guide_comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_comment_likes" ADD CONSTRAINT "guide_comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
