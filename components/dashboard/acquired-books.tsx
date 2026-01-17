"use client";

import { useState, useEffect } from "react";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

interface AcquiredBook {
  _id: string;
  name: string;
  slug: { current: string };
  coverImage?: {
    asset: {
      url: string;
    };
  };
  authors?: { name: string }[];
  purchaseDate?: string;
  expiresAt?: string;
  accessType: "purchase" | "subscription";
}

export function AcquiredBooks() {
  const [books, setBooks] = useState<AcquiredBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcquiredBooks();
  }, []);

  const fetchAcquiredBooks = async () => {
    try {
      const response = await fetch("/api/user/acquired-books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error("Error fetching acquired books:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Mis Libros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Mis Libros</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tienes libros aún</h3>
            <p className="text-muted-foreground text-center mb-6">
              Explora nuestro catálogo y adquiere tu primer libro
            </p>
            <Button asChild>
              <Link href="/libros">Ver Catálogo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mis Libros</h2>
        <Button variant="ghost" asChild>
          <Link href="/mis-libros">
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {books.slice(0, 4).map((book) => (
          <Card key={book._id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
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
                </div>
                <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {book.name}
                </h3>
                {book.authors && book.authors.length > 0 && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {book.authors.map((a) => a.name).join(", ")}
                  </p>
                )}
                {book.expiresAt && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Expira: {new Date(book.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </Link>
              <Button className="w-full mt-3" size="sm" asChild>
                <Link href={`/libros/${book.slug.current}/vista`}>
                  Leer ahora
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
