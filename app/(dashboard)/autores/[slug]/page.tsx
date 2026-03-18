import { client } from "@/lib/sanity/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { BookCoverFallback } from "@/components/books/book-cover-fallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AutorPage({ params }: PageProps) {
  const { slug } = await params;

  const query = `*[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    bio,
    image {
      asset-> {
        _id,
        url
      }
    },
    "books": *[_type == "book" && references(^._id)] | order(publishedDate desc) {
      _id,
      name,
      slug,
      coverImage {
        asset-> {
          _id,
          url
        }
      },
      "categories": categories[]->{ title },
      publishedDate,
      status
    }
  }`;

  const author = await client.fetch(query, { slug });

  if (!author) {
    notFound();
  }

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href="/libros">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a libros
        </Link>
      </Button>

      {/* Perfil del autor */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Foto */}
          <div className="shrink-0">
            {author.image?.asset?.url ? (
              <div className="w-36 h-36 rounded-full overflow-hidden relative border border-gray-200">
                <Image
                  src={author.image.asset.url}
                  alt={author.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <span className="text-4xl font-bold text-gray-400">
                  {author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{author.name}</h1>
            {author.books?.length > 0 && (
              <p className="text-muted-foreground mb-4">
                {author.books.length}{" "}
                {author.books.length === 1 ? "libro publicado" : "libros publicados"}
              </p>
            )}
            {author.bio && (
              <div className="prose prose-sm max-w-none text-gray-700">
                <PortableText value={author.bio} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Libros del autor */}
      {author.books?.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Libros de {author.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {author.books.map((book: any) => (
              <Link
                key={book._id}
                href={`/libros/${book.slug.current}`}
                className="group flex flex-col"
              >
                <div className="aspect-[3/4] relative bg-gray-100 rounded-lg overflow-hidden mb-3 border border-gray-200 group-hover:shadow-md transition-shadow">
                  {book.coverImage?.asset?.url ? (
                    <Image
                      src={book.coverImage.asset.url}
                      alt={book.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <BookCoverFallback title={book.name} className="w-full h-full" />
                  )}
                </div>
                <h3 className="text-sm font-medium leading-snug group-hover:underline underline-offset-2 line-clamp-2 mb-1">
                  {book.name}
                </h3>
                {book.status && (
                  <Badge
                    className={`text-xs w-fit ${statusColors[book.status]}`}
                    variant="outline"
                  >
                    {statusLabels[book.status] || book.status}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(!author.books || author.books.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>Este autor no tiene libros publicados aún.</p>
        </div>
      )}
    </div>
  );
}
