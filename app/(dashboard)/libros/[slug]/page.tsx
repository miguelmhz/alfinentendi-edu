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

  if (authUser) {
    currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, roles: true, name: true, email: true },
    });

    isTeacher = currentUser?.roles.some(role => 
      ["TEACHER", "COORDINATOR", "ADMIN"].includes(role)
    ) || false;

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

        hasAccess = !!bookAccess || book.isPublic;
      } else {
        hasAccess = book.isPublic;
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

              {book.file?.asset?.url && hasAccess && (
                <Button asChild>
                  <Link href={`/libros/${slug}/vista`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Leer Libro
                  </Link>
                </Button>
              )}

              {book.file?.asset?.url && !hasAccess && isPublicUser && !book.isPublic && (
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
