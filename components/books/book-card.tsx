"use client";

import Image from "next/image";
import Link from "next/link";
import { BookCoverFallback } from "./book-cover-fallback";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface BookCardProps {
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

export function BookCard({ book, averageRating, totalReviews }: BookCardProps) {
  return (
    <Link
      href={`/libros/${book.slug.current}`}
      className="group block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      <div className="aspect-[3/4] relative bg-gray-100">
        {book.coverImage?.asset?.url ? (
          <Image
            src={book.coverImage.asset.url}
            alt={book.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <BookCoverFallback title={book.name} className="w-full h-full" />
        )}
        
        {book.isPublic && (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white">
            Público
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
          {book.name}
        </h3>

        {book.authors && book.authors.length > 0 && (
          <p className="text-sm text-gray-600 mb-2">
            {book.authors.map((a) => a.name).join(", ")}
          </p>
        )}

        {averageRating !== undefined && totalReviews !== undefined && totalReviews > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({totalReviews})</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {formatLabels[book.format] || book.format}
          </Badge>
          <Badge className={`text-xs ${statusColors[book.status]}`}>
            {statusLabels[book.status] || book.status}
          </Badge>
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.categories.slice(0, 2).map((cat) => (
              <span
                key={cat.slug.current}
                className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
              >
                {cat.name}
              </span>
            ))}
            {book.categories.length > 2 && (
              <span className="text-xs text-gray-500">
                +{book.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {book.price !== undefined && book.price > 0 && (
          <p className="mt-3 font-semibold text-lg text-blue-600">
            ${book.price.toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}
