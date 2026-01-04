"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookFiltersProps {
  onFilterChange: (filters: BookFilters) => void;
  categories?: { name: string; slug: { current: string } }[];
  authors?: { name: string; slug: { current: string } }[];
}

export interface BookFilters {
  search: string;
  category: string;
  author: string;
  format: string;
  status: string;
}

export function BookFilters({ onFilterChange, categories = [], authors = [] }: BookFiltersProps) {
  const [filters, setFilters] = useState<BookFilters>({
    search: "",
    category: "",
    author: "",
    format: "",
    status: "",
  });

  const handleFilterChange = (key: keyof BookFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: BookFilters = {
      search: "",
      category: "",
      author: "",
      format: "",
      status: "",
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar libros..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Categoría */}
        {categories.length > 0 && (
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug.current} value={cat.slug.current}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Autor */}
        {authors.length > 0 && (
          <Select
            value={filters.author || "all"}
            onValueChange={(value) => handleFilterChange("author", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los autores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los autores</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author.slug.current} value={author.slug.current}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Formato */}
        <Select
          value={filters.format || "all"}
          onValueChange={(value) => handleFilterChange("format", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos los formatos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los formatos</SelectItem>
            <SelectItem value="physical">Físico</SelectItem>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="both">Físico y Digital</SelectItem>
          </SelectContent>
        </Select>

        {/* Estado */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="out_of_stock">Agotado</SelectItem>
            <SelectItem value="coming_soon">Próximamente</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
