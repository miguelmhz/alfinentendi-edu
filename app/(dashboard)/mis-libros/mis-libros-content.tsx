"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

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
  expiresAt?: string;
  accessType: "purchase" | "subscription";
}

export function MisLibrosContent() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<AcquiredBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    
    if (paymentStatus === "success") {
      toast.success("¡Pago exitoso! Ya tienes acceso al libro.", {
        duration: 5000,
      });
    } else if (paymentStatus === "cancelled") {
      toast.error("Pago cancelado. Puedes intentar nuevamente cuando quieras.", {
        duration: 5000,
      });
    }

    fetchAcquiredBooks();
  }, [searchParams]);

  const fetchAcquiredBooks = async () => {
    try {
      const response = await fetch("/api/user/acquired-books");
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error("Error fetching acquired books:", error);
      toast.error("Error al cargar tus libros");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Mis Libros</h1>
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Libros</h1>
        <Button variant="outline" asChild>
          <Link href="/libros">Explorar más libros</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
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
                {book.expiresAt && new Date(book.expiresAt) < new Date("2099-01-01") && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Expira: {new Date(book.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
              <Button className="w-full mt-3" asChild>
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
