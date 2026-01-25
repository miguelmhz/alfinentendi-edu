import { client } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookCoverFallback } from "@/components/books/book-cover-fallback";
import { BookReviews } from "@/components/books/book-reviews";
import { BookGuides } from "@/components/books/book-guides";
import { BookPurchaseButton } from "@/components/books/book-purchase-button";
import { BookStats } from "@/components/books/book-stats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, ShoppingCart, Download, Eye, BookOpen } from "lucide-react";
import { PortableText } from "@portabletext/react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const formatLabels: Record<string, string> = {
  physical: "Físico",
  digital: "Digital",
  both: "Físico y Digital",
};

const statusLabels: Record<string, string> = {
  available: "Disponible",
  out_of_stock: "Agotado",
  coming_soon: "Próximamente",
};

const statusColors: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  out_of_stock: "bg-red-100 text-red-800",
  coming_soon: "bg-blue-100 text-blue-800",
};

export default async function BookPage({ params }: PageProps) {
  const { slug } = await params;

  // Obtener libro desde Sanity
  const query = `*[_type == "book" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    "authors": authors[]->{ name, slug, bio, image },
    "categories": categories[]->{ title, slug },
    coverImage {
      asset-> {
        _id,
        url
      }
    },
    file {
      asset-> {
        _id,
        url
      }
    },
    preview {
      asset-> {
        _id,
        url
      }
    },
    isbn,
    publishedDate,
    pages,
    format,
    status,
    price,
    purchaseLink,
    isPublic
  }`;

  const book = await client.fetch(query, { slug });

  if (!book) {
    notFound();
  }

  // Obtener usuario actual
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let currentUser = null;
  let isTeacher = false;
  let hasAccess = false;
  let isPublicUser = false;
  let isAdmin = false;

  if (authUser) {
    currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, roles: true, name: true, email: true },
    });

    isTeacher = currentUser?.roles.some(role => 
      ["TEACHER", "COORDINATOR", "ADMIN"].includes(role)
    ) || false;

    isAdmin = currentUser?.roles.includes("ADMIN") || false;

    isPublicUser = currentUser?.roles.includes("PUBLIC") || false;

    // Check if user has access to this book
    if (currentUser && book._id) {
      const bookRecord = await prisma.book.findUnique({
        where: { sanityId: book._id },
        select: { id: true },
      });

      if (bookRecord) {
        const now = new Date();
        const bookAccess = await prisma.bookAccess.findFirst({
          where: {
            userId: currentUser.id,
            bookId: bookRecord.id,
            isActive: true,
            status: "ACTIVE",
            endDate: { gte: now },
          },
        });

        hasAccess = !!bookAccess;
      } else {
        hasAccess = false;
      }
    }
  }

  // Obtener reviews
  const reviewsData = await prisma.bookReview.findMany({
    where: { bookSanityId: book._id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = await prisma.bookReview.aggregate({
    where: { bookSanityId: book._id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const userReview = currentUser
    ? reviewsData.find((r) => r.userId === currentUser.id)
    : undefined;

  // Debug: verificar condiciones para mostrar botón
  console.log("Debug - Botón Obtener Gratis:", {
    hasFile: !!book.file?.asset?.url,
    hasPreview: !!book.preview?.asset?.url,
    hasAccess,
    hasCurrentUser: !!currentUser,
    isPublic: book.isPublic,
    shouldShowButton: (book.file?.asset?.url || book.preview?.asset?.url) && !hasAccess && currentUser && book.isPublic,
  });

  // Obtener estadísticas si es admin
  let bookStats = null;
  let bookRecord = null;
  
  if (isAdmin && book._id) {
    bookRecord = await prisma.book.findUnique({
      where: { sanityId: book._id },
      select: { id: true },
    });

    if (bookRecord) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Total de usuarios con acceso
      const totalUsers = await prisma.bookAccess.count({
        where: {
          bookId: bookRecord.id,
          isActive: true,
          status: "ACTIVE",
        },
      });

      // Usuarios activos (últimos 30 días)
      const activeUsers = await prisma.bookAccess.count({
        where: {
          bookId: bookRecord.id,
          isActive: true,
          status: "ACTIVE",
          updatedAt: { gte: thirtyDaysAgo },
        },
      });

      // Sesiones de lectura
      const readingSessions = await prisma.bookReadingLog.aggregate({
        where: {
          bookId: bookRecord.id,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
        _avg: { duration: true },
        _sum: { pagesViewed: true },
      });

      // Último acceso
      const lastAccess = await prisma.bookReadingLog.findFirst({
        where: { bookId: bookRecord.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      // Usuarios que completaron el libro (basado en lastPage >= totalPages * 0.9)
      // Asumimos que el libro tiene 200 páginas como promedio para este cálculo
      const totalPagesEstimate = 200;
      const completedUsers = await prisma.bookReadingLog.groupBy({
        by: ['userId'],
        where: {
          bookId: bookRecord.id,
          lastPage: { gte: Math.floor(totalPagesEstimate * 0.9) },
        },
        _count: { userId: true },
      });

      // Estadísticas de ventas
      const salesStats = await prisma.purchase.aggregate({
        where: {
          bookSanityId: book._id,
          status: "COMPLETED",
        },
        _count: { id: true },
        _sum: { price: true },
      });

      // Usuarios únicos que compraron
      const uniqueBuyers = await prisma.purchase.groupBy({
        by: ['userId'],
        where: {
          bookSanityId: book._id,
          status: "COMPLETED",
        },
        _count: { userId: true },
      });

      // Ventas recientes (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentSales = await prisma.purchase.count({
        where: {
          bookSanityId: book._id,
          status: "COMPLETED",
          createdAt: { gte: sixMonthsAgo },
        },
      });

      bookStats = {
        totalUsers,
        activeUsers,
        totalReadingSessions: readingSessions._count.id || 0,
        averageReadingTime: (readingSessions._avg.duration || 0) / 60, // Convertir a minutos
        totalPagesRead: readingSessions._sum.pagesViewed || 0,
        completionRate: totalUsers > 0 ? (completedUsers.length / totalUsers) * 100 : 0,
        lastAccessed: lastAccess?.createdAt?.toISOString() || null,
        // Estadísticas de ventas
        totalSales: salesStats._count.id || 0,
        totalRevenue: salesStats._sum.price || 0,
        uniqueBuyers: uniqueBuyers.length,
        recentSales: recentSales,
      };
    }
  }

  // Obtener guías si es profesor
  let guides = [];
  if (isTeacher) {
    const guidesQuery = `*[_type == "guide" && references($bookId) && isPublished == true] | order(order asc, publishedAt desc) {
      _id,
      title,
      slug,
      description,
      content,
      pdfFile {
        asset-> {
          _id,
          url
        }
      },
      order,
      targetAudience,
      tags,
      publishedAt
    }`;

    guides = await client.fetch(guidesQuery, { bookId: book._id });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header del libro */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="grid md:grid-cols-[300px,1fr] gap-8">
          {/* Portada */}
          <div className="aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden">
            {book.coverImage?.asset?.url ? (
              <Image
                src={book.coverImage.asset.url}
                alt={book.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <BookCoverFallback title={book.name} className="w-full h-full" />
            )}
          </div>

          {/* Información del libro */}
          <div className="flex flex-col">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{book.name}</h1>

              {book.authors && book.authors.length > 0 && (
                <p className="text-lg text-gray-600 mb-4">
                  Por {book.authors.map((a: any) => a.name).join(", ")}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline">{formatLabels[book.format]}</Badge>
                <Badge className={statusColors[book.status]}>
                  {statusLabels[book.status]}
                </Badge>
                {book.isPublic && (
                  <Badge className="bg-green-500 text-white">Público</Badge>
                )}
              </div>

              {book.description && (
                <div className="prose prose-sm max-w-none mb-6">
                  <PortableText value={book.description} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                {book.isbn && (
                  <div>
                    <span className="text-gray-500">ISBN:</span>
                    <p className="font-medium">{book.isbn}</p>
                  </div>
                )}
                {book.pages && (
                  <div>
                    <span className="text-gray-500">Páginas:</span>
                    <p className="font-medium">{book.pages}</p>
                  </div>
                )}
                {book.publishedDate && (
                  <div>
                    <span className="text-gray-500">Publicación:</span>
                    <p className="font-medium">
                      {new Date(book.publishedDate).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {book.categories && book.categories.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-2">Categorías:</span>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((cat: any) => (
                        <Badge key={cat.slug.current} variant="secondary">
                          {cat.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3 pt-6 border-t">
              {book.preview?.asset?.url && (
                <Button variant="outline" asChild>
                  <Link href={`/libros/${slug}/vista?type=preview`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Vista Previa
                  </Link>
                </Button>
              )}

              {(book.file?.asset?.url || book.preview?.asset?.url) && (hasAccess || isAdmin) && (
                <Button asChild>
                  <Link href={`/libros/${slug}/vista`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Leer Libro
                    {isAdmin && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </Link>
                </Button>
              )}

              {(book.file?.asset?.url || book.preview?.asset?.url) && !hasAccess && !isAdmin && currentUser && book.isPublic && (
                <BookPurchaseButton
                  bookSlug={slug}
                  price={0}
                  subscriptionPlan="lifetime"
                  isFree={true}
                />
              )}

              {(book.file?.asset?.url || book.preview?.asset?.url) && !hasAccess && !isAdmin && currentUser && !book.isPublic && (
                <BookPurchaseButton
                  bookSlug={slug}
                  price={book.price}
                  subscriptionPlan="lifetime"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas (solo para admins) */}
      {isAdmin && bookStats && bookRecord && (
        <BookStats
          bookId={bookRecord.id}
          bookSanityId={book._id}
          stats={bookStats}
          sanityProjectId="oFrlvZc3p3"
          sanityDataset="cyabp7izwldtnjp6bjo9haiw"
        />
      )}

      {/* Guías (solo para profesores) */}
      {(isTeacher || guides.length > 0) && (
        <>
          <BookGuides
            bookSlug={slug}
            guides={guides}
            isTeacher={isTeacher}
          />
          <Separator className="my-8" />
        </>
      )}

      {/* Reseñas */}
      <BookReviews
        bookSanityId={book._id}
        reviews={reviewsData.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || undefined,
          createdAt: r.createdAt.toISOString(),
          user: r.user,
        }))}
        stats={{
          averageRating: stats._avg.rating || 0,
          totalReviews: stats._count.rating || 0,
        }}
        currentUserId={currentUser?.id}
        userReview={
          userReview
            ? {
                id: userReview.id,
                rating: userReview.rating,
                comment: userReview.comment || undefined,
                createdAt: userReview.createdAt.toISOString(),
                user: userReview.user,
              }
            : undefined
        }
      />
    </div>
  );
}
