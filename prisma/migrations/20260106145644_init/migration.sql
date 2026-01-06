-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINATOR', 'TEACHER', 'STUDENT', 'PUBLIC');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('INVITED', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AnnotationVisibility" AS ENUM ('PRIVATE', 'TEACHER', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCESS_GRANTED', 'ACCESS_EXPIRING', 'ACCESS_EXPIRED', 'STUDENT_ADDED', 'NEW_RESOURCE', 'SYSTEM');

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contact" TEXT,
    "coordinatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoUrl" TEXT,
    "slug" TEXT NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "roles" "UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "schoolId" TEXT,
    "createdBy" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "schoolId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gradeId" TEXT,
    "subject" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "isDownloadable" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "accessType" TEXT NOT NULL DEFAULT 'restricted',
    "targetAudience" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_accesses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "AccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "groupId" TEXT,
    "gradeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_accesses_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "annotations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "color" TEXT,
    "position" JSONB,
    "visibility" "AnnotationVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL DEFAULT 'teacher',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "additional_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_assignments" (
    "id" TEXT NOT NULL,
    "bookSanityId" TEXT NOT NULL,
    "assignedToType" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_comments" (
    "id" TEXT NOT NULL,
    "guideSanityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entrySanityId" TEXT,

    CONSTRAINT "guide_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_reviews" (
    "id" TEXT NOT NULL,
    "bookSanityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_reports" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_coordinatorId_key" ON "schools"("coordinatorId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_coordinatorId_idx" ON "schools"("coordinatorId");

-- CreateIndex
CREATE INDEX "schools_slug_idx" ON "schools"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_schoolId_idx" ON "users"("schoolId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "grades_schoolId_idx" ON "grades"("schoolId");

-- CreateIndex
CREATE INDEX "groups_gradeId_idx" ON "groups"("gradeId");

-- CreateIndex
CREATE INDEX "groups_teacherId_idx" ON "groups"("teacherId");

-- CreateIndex
CREATE INDEX "user_groups_userId_idx" ON "user_groups"("userId");

-- CreateIndex
CREATE INDEX "user_groups_groupId_idx" ON "user_groups"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_userId_groupId_key" ON "user_groups"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "books_sanityId_key" ON "books"("sanityId");

-- CreateIndex
CREATE INDEX "books_sanityId_idx" ON "books"("sanityId");

-- CreateIndex
CREATE INDEX "books_gradeId_idx" ON "books"("gradeId");

-- CreateIndex
CREATE INDEX "books_isActive_idx" ON "books"("isActive");

-- CreateIndex
CREATE INDEX "book_accesses_userId_idx" ON "book_accesses"("userId");

-- CreateIndex
CREATE INDEX "book_accesses_bookId_idx" ON "book_accesses"("bookId");

-- CreateIndex
CREATE INDEX "book_accesses_status_idx" ON "book_accesses"("status");

-- CreateIndex
CREATE INDEX "book_accesses_endDate_idx" ON "book_accesses"("endDate");

-- CreateIndex
CREATE INDEX "book_accesses_groupId_idx" ON "book_accesses"("groupId");

-- CreateIndex
CREATE INDEX "book_accesses_gradeId_idx" ON "book_accesses"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "book_accesses_userId_bookId_startDate_key" ON "book_accesses"("userId", "bookId", "startDate");

-- CreateIndex
CREATE INDEX "school_book_licenses_schoolId_idx" ON "school_book_licenses"("schoolId");

-- CreateIndex
CREATE INDEX "school_book_licenses_bookId_idx" ON "school_book_licenses"("bookId");

-- CreateIndex
CREATE INDEX "school_book_licenses_isActive_idx" ON "school_book_licenses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "school_book_licenses_schoolId_bookId_key" ON "school_book_licenses"("schoolId", "bookId");

-- CreateIndex
CREATE INDEX "annotations_userId_idx" ON "annotations"("userId");

-- CreateIndex
CREATE INDEX "annotations_bookId_idx" ON "annotations"("bookId");

-- CreateIndex
CREATE INDEX "annotations_page_idx" ON "annotations"("page");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "additional_resources_targetRole_idx" ON "additional_resources"("targetRole");

-- CreateIndex
CREATE INDEX "additional_resources_isActive_idx" ON "additional_resources"("isActive");

-- CreateIndex
CREATE INDEX "book_assignments_bookSanityId_idx" ON "book_assignments"("bookSanityId");

-- CreateIndex
CREATE INDEX "book_assignments_assignedToType_idx" ON "book_assignments"("assignedToType");

-- CreateIndex
CREATE INDEX "book_assignments_assignedToId_idx" ON "book_assignments"("assignedToId");

-- CreateIndex
CREATE INDEX "book_assignments_assignedBy_idx" ON "book_assignments"("assignedBy");

-- CreateIndex
CREATE INDEX "book_assignments_isActive_idx" ON "book_assignments"("isActive");

-- CreateIndex
CREATE INDEX "guide_comments_guideSanityId_idx" ON "guide_comments"("guideSanityId");

-- CreateIndex
CREATE INDEX "guide_comments_entrySanityId_idx" ON "guide_comments"("entrySanityId");

-- CreateIndex
CREATE INDEX "guide_comments_userId_idx" ON "guide_comments"("userId");

-- CreateIndex
CREATE INDEX "guide_comments_parentId_idx" ON "guide_comments"("parentId");

-- CreateIndex
CREATE INDEX "guide_comments_createdAt_idx" ON "guide_comments"("createdAt");

-- CreateIndex
CREATE INDEX "book_reviews_bookSanityId_idx" ON "book_reviews"("bookSanityId");

-- CreateIndex
CREATE INDEX "book_reviews_userId_idx" ON "book_reviews"("userId");

-- CreateIndex
CREATE INDEX "book_reviews_rating_idx" ON "book_reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "book_reviews_bookSanityId_userId_key" ON "book_reviews"("bookSanityId", "userId");

-- CreateIndex
CREATE INDEX "comment_reports_commentId_idx" ON "comment_reports"("commentId");

-- CreateIndex
CREATE INDEX "comment_reports_reportedBy_idx" ON "comment_reports"("reportedBy");

-- CreateIndex
CREATE INDEX "comment_reports_status_idx" ON "comment_reports"("status");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_accesses" ADD CONSTRAINT "book_accesses_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_accesses" ADD CONSTRAINT "book_accesses_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_accesses" ADD CONSTRAINT "book_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_book_licenses" ADD CONSTRAINT "school_book_licenses_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_assignments" ADD CONSTRAINT "book_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_comments" ADD CONSTRAINT "guide_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_comments" ADD CONSTRAINT "guide_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
