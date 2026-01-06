-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_groups_userId_idx" ON "user_groups"("userId");

-- CreateIndex
CREATE INDEX "user_groups_groupId_idx" ON "user_groups"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_userId_groupId_key" ON "user_groups"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
