-- CreateTable: Asignaciones de libros a diferentes entidades
CREATE TABLE "book_assignments" (
    "id" TEXT NOT NULL,
    "bookSanityId" TEXT NOT NULL,
    "assignedToType" TEXT NOT NULL, -- 'school', 'grade', 'group', 'teacher', 'student'
    "assignedToId" TEXT NOT NULL, -- ID de la entidad (schoolId, gradeId, etc)
    "assignedBy" TEXT NOT NULL, -- userId que hizo la asignación
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Comentarios en guías (foro)
CREATE TABLE "guide_comments" (
    "id" TEXT NOT NULL,
    "guideSanityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrls" TEXT[], -- Array de URLs de imágenes
    "parentId" TEXT, -- Para respuestas anidadas
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reviews de libros
CREATE TABLE "book_reviews" (
    "id" TEXT NOT NULL,
    "bookSanityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL, -- 1-5 estrellas
    "comment" TEXT,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Reportes de comentarios inapropiados
CREATE TABLE "comment_reports" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_assignments_bookSanityId_idx" ON "book_assignments"("bookSanityId");
CREATE INDEX "book_assignments_assignedToType_idx" ON "book_assignments"("assignedToType");
CREATE INDEX "book_assignments_assignedToId_idx" ON "book_assignments"("assignedToId");
CREATE INDEX "book_assignments_assignedBy_idx" ON "book_assignments"("assignedBy");
CREATE INDEX "book_assignments_isActive_idx" ON "book_assignments"("isActive");

CREATE INDEX "guide_comments_guideSanityId_idx" ON "guide_comments"("guideSanityId");
CREATE INDEX "guide_comments_userId_idx" ON "guide_comments"("userId");
CREATE INDEX "guide_comments_parentId_idx" ON "guide_comments"("parentId");
CREATE INDEX "guide_comments_createdAt_idx" ON "guide_comments"("createdAt");

CREATE INDEX "book_reviews_bookSanityId_idx" ON "book_reviews"("bookSanityId");
CREATE INDEX "book_reviews_userId_idx" ON "book_reviews"("userId");
CREATE INDEX "book_reviews_rating_idx" ON "book_reviews"("rating");
CREATE UNIQUE INDEX "book_reviews_bookSanityId_userId_key" ON "book_reviews"("bookSanityId", "userId");

CREATE INDEX "comment_reports_commentId_idx" ON "comment_reports"("commentId");
CREATE INDEX "comment_reports_reportedBy_idx" ON "comment_reports"("reportedBy");
CREATE INDEX "comment_reports_status_idx" ON "comment_reports"("status");

-- AddForeignKey
ALTER TABLE "book_assignments" ADD CONSTRAINT "book_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "guide_comments" ADD CONSTRAINT "guide_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guide_comments" ADD CONSTRAINT "guide_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "book_reviews" ADD CONSTRAINT "book_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
