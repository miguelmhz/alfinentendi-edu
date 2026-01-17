"use client";

import { useState, useEffect } from "react";
import { BookOpen, ShoppingCart, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

interface FeaturedBook {
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
  categories?: { title: string }[];
  price?: number;
  status: string;
  isPublic?: boolean;
}

export function FeaturedBooks() {
  const [books, setBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  const fetchFeaturedBooks = async () => {
    try {
      const response = await fetch("/api/books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books?.slice(0, 8) || []);
      }
    } catch (error) {
      console.error("Error fetching featured books:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Catálogo Destacado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-64 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Catálogo Destacado</h2>
        <Button variant="ghost" asChild>
          <Link href="/libros">
            Ver todo el catálogo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {books.map((book) => (
          <Card key={book._id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-4 flex flex-col h-full">
              <Link href={`/libros/${book.slug.current}`}>
                <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-md bg-muted">
                  {book.coverImage?.asset?.url ? (
                    <Image
                      src={book.coverImage.asset.url}
                      alt={book.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {book.isPublic ? (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                      GRATIS
                    </div>
                  ) : book.price ? (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-semibold">
                      ${book.price}
                    </div>
                  ) : null}
                </div>
                
                <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {book.name}
                </h3>
                
                {book.authors && book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {book.authors.map((a) => a.name).join(", ")}
                  </p>
                )}

                {book.categories && book.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {book.categories.slice(0, 2).map((cat) => (
                      <Badge key={cat.title} variant="secondary" className="text-xs">
                        {cat.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </Link>

              <div className="flex gap-2 mt-auto">
                <Button className="flex-1" size="sm" asChild>
                  <Link href={`/libros/${book.slug.current}`}>
                    Ver detalles
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
