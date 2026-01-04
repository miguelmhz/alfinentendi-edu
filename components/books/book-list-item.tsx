"use client";

import Image from "next/image";
import Link from "next/link";
import { BookCoverFallback } from "./book-cover-fallback";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, FileText } from "lucide-react";

interface BookListItemProps {
  book: {
    _id: string;
    name: string;
    slug: { current: string };
    description?: any;
    authors?: { name: string; slug: { current: string } }[];
    categories?: { name: string; slug: { current: string } }[];
    coverImage?: {
      asset: {
        url: string;
      };
    };
    format: string;
    status: string;
    price?: number;
    pages?: number;
    publishedDate?: string;
    isPublic?: boolean;
  };
  averageRating?: number;
  totalReviews?: number;
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

export function BookListItem({ book, averageRating, totalReviews }: BookListItemProps) {
  // Extraer texto plano de la descripción si existe
  const getDescriptionText = () => {
    if (!book.description || !Array.isArray(book.description)) return "";
    const firstBlock = book.description.find((block: any) => block._type === "block");
    if (!firstBlock || !firstBlock.children) return "";
    return firstBlock.children
      .map((child: any) => child.text)
      .join("")
      .slice(0, 150);
  };

  return (
    <Link
      href={`/libros/${book.slug.current}`}
      className="group flex gap-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex-shrink-0 w-24 h-32 relative bg-gray-100 rounded overflow-hidden">
        {book.coverImage?.asset?.url ? (
          <Image
            src={book.coverImage.asset.url}
            alt={book.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <BookCoverFallback title={book.name} className="w-full h-full text-xs" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
              {book.name}
            </h3>
            {book.authors && book.authors.length > 0 && (
              <p className="text-sm text-gray-600">
                {book.authors.map((a) => a.name).join(", ")}
              </p>
            )}
          </div>

          {book.price !== undefined && book.price > 0 && (
            <p className="font-semibold text-lg text-blue-600 flex-shrink-0">
              ${book.price.toFixed(2)}
            </p>
          )}
        </div>

        {getDescriptionText() && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {getDescriptionText()}...
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          {averageRating !== undefined && totalReviews !== undefined && totalReviews > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">{averageRating.toFixed(1)}</span>
              <span>({totalReviews})</span>
            </div>
          )}

          {book.pages && (
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{book.pages} páginas</span>
            </div>
          )}

          {book.publishedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(book.publishedDate).getFullYear()}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {formatLabels[book.format] || book.format}
          </Badge>
          <Badge className={`text-xs ${statusColors[book.status]}`}>
            {statusLabels[book.status] || book.status}
          </Badge>
          {book.isPublic && (
            <Badge className="text-xs bg-green-500 text-white">
              Público
            </Badge>
          )}
          {book.categories && book.categories.slice(0, 3).map((cat) => (
            <Badge key={cat.slug.current} variant="secondary" className="text-xs">
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
