"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface LatestBook {
  _id: string;
  name: string;
  slug: { current: string };
  description?: any;
  coverImage?: {
    asset: {
      url: string;
    };
  };
  authors?: { name: string }[];
  publishedDate?: string;
  price?: number;
}

export function LatestBooks() {
  const [books, setBooks] = useState<LatestBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestBooks();
  }, []);

  const fetchLatestBooks = async () => {
    try {
      const response = await fetch("/api/books?isPublic=true&status=published");
      if (response.ok) {
        const data = await response.json();
        const sortedBooks = (data.books || [])
          .filter((book: LatestBook) => book.publishedDate)
          .sort((a: LatestBook, b: LatestBook) => 
            new Date(b.publishedDate!).getTime() - new Date(a.publishedDate!).getTime()
          )
          .slice(0, 6);
        setBooks(sortedBooks);
      }
    } catch (error) {
      console.error("Error fetching latest books:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Novedades
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Novedades
        </h2>
        <Button variant="ghost" asChild>
          <Link href="/libros?sort=latest">
            Ver más
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <Card key={book._id} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <Link href={`/libros/${book.slug.current}`} className="flex gap-4">
                <div className="relative w-20 h-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {book.coverImage?.asset?.url ? (
                    <Image
                      src={book.coverImage.asset.url}
                      alt={book.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    Nuevo
                  </Badge>
                  <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {book.name}
                  </h3>
                  {book.authors && book.authors.length > 0 && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {book.authors.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  {book.publishedDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(book.publishedDate), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </div>
                  )}
                  {book.price && (
                    <p className="text-sm font-semibold text-primary mt-2">
                      ${book.price}
                    </p>
                  )}
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
