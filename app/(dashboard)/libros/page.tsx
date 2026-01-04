"use client";

import { useEffect, useState } from "react";
import { BookCard } from "@/components/books/book-card";
import { BookListItem } from "@/components/books/book-list-item";
import { BookFilters, BookFilters as BookFiltersType } from "@/components/books/book-filters";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Loader2 } from "lucide-react";

interface Book {
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
}

export default function LibrosPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: { current: string } }[]>([]);
  const [authors, setAuthors] = useState<{ name: string; slug: { current: string } }[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BookFiltersType>({
    search: "",
    category: "",
    author: "",
    format: "",
    status: "",
  });

  useEffect(() => {
    fetchBooks();
    fetchFiltersData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [books, filters]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/books");
      const data = await response.json();
      setBooks(data.books || []);
      setFilteredBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltersData = async () => {
    try {
      // Obtener categorías y autores únicos
      const response = await fetch("/api/books");
      const data = await response.json();
      
      if (data.books) {
        const uniqueCategories = new Map();
        const uniqueAuthors = new Map();

        data.books.forEach((book: Book) => {
          book.categories?.forEach((cat) => {
            uniqueCategories.set(cat.slug.current, cat);
          });
          book.authors?.forEach((author) => {
            uniqueAuthors.set(author.slug.current, author);
          });
        });

        setCategories(Array.from(uniqueCategories.values()));
        setAuthors(Array.from(uniqueAuthors.values()));
      }
    } catch (error) {
      console.error("Error fetching filters data:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...books];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.name.toLowerCase().includes(searchLower) ||
          book.authors?.some((a) => a.name.toLowerCase().includes(searchLower))
      );
    }

    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter((book) =>
        book.categories?.some((cat) => cat.slug.current === filters.category)
      );
    }

    // Filtro de autor
    if (filters.author) {
      filtered = filtered.filter((book) =>
        book.authors?.some((author) => author.slug.current === filters.author)
      );
    }

    // Filtro de formato
    if (filters.format) {
      filtered = filtered.filter((book) => book.format === filters.format);
    }

    // Filtro de estado
    if (filters.status) {
      filtered = filtered.filter((book) => book.status === filters.status);
    }

    setFilteredBooks(filtered);
  };

  const handleFilterChange = (newFilters: BookFiltersType) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Libros</h1>
        <p className="text-gray-600">
          Explora nuestra colección de libros educativos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de filtros */}
        <aside className="lg:col-span-1">
          <BookFilters
            onFilterChange={handleFilterChange}
            categories={categories}
            authors={authors}
          />
        </aside>

        {/* Contenido principal */}
        <main className="lg:col-span-3">
          {/* Header con toggle de vista y contador */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-600">
              {loading ? (
                "Cargando..."
              ) : (
                <>
                  Mostrando <span className="font-semibold">{filteredBooks.length}</span> de{" "}
                  <span className="font-semibold">{books.length}</span> libros
                </>
              )}
            </p>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contenido de libros */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-2">No se encontraron libros</p>
              <p className="text-gray-400 text-sm">
                Intenta ajustar los filtros de búsqueda
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <BookListItem key={book._id} book={book} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
