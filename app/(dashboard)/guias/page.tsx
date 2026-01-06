"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface Guide {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  coverImage?: {
    asset: {
      url: string;
    };
  };
  book?: {
    name: string;
    slug: { current: string };
  };
  difficulty?: string;
  estimatedTime?: number;
  isPublic?: boolean;
}

export default function GuiasPage() {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGuides();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [guides, searchTerm]);

  const fetchGuides = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/guides");
      const data = await response.json();
      setGuides(data.guides || []);
      setFilteredGuides(data.guides || []);
    } catch (error) {
      console.error("Error fetching guides:", error);
      toast.error("Error al cargar las guías");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...guides];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (guide) =>
          guide.title.toLowerCase().includes(searchLower) ||
          guide.description?.toLowerCase().includes(searchLower) ||
          guide.book?.name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredGuides(filtered);
  };

  const handleGuideClick = (guide: Guide) => {
    router.push(`/guias/${guide.slug.current}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Guías Didácticas</h1>
        <p className="text-gray-600">
          Explora nuestras guías educativas interactivas
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar guías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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

        <p className="text-sm text-gray-600 mt-4">
          {loading ? (
            "Cargando..."
          ) : (
            <>
              Mostrando <span className="font-semibold">{filteredGuides.length}</span> de{" "}
              <span className="font-semibold">{guides.length}</span> guías
            </>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredGuides.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No se encontraron guías</p>
          <p className="text-gray-400 text-sm">
            {searchTerm ? "Intenta ajustar tu búsqueda" : "No hay guías disponibles"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide._id}
              onClick={() => handleGuideClick(guide)}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {guide.coverImage?.asset?.url ? (
                <img
                  src={guide.coverImage.asset.url}
                  alt={guide.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-4xl">📚</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{guide.title}</h3>
                {guide.book && (
                  <p className="text-sm text-gray-500 mb-2">📖 {guide.book.name}</p>
                )}
                {guide.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {guide.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {guide.difficulty && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {guide.difficulty}
                    </span>
                  )}
                  {guide.estimatedTime && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      ⏱️ {guide.estimatedTime} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGuides.map((guide) => (
            <div
              key={guide._id}
              onClick={() => handleGuideClick(guide)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex gap-4">
                {guide.coverImage?.asset?.url ? (
                  <img
                    src={guide.coverImage.asset.url}
                    alt={guide.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded flex items-center justify-center">
                    <span className="text-2xl">📚</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{guide.title}</h3>
                  {guide.book && (
                    <p className="text-sm text-gray-500 mb-2">📖 {guide.book.name}</p>
                  )}
                  {guide.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {guide.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    {guide.difficulty && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {guide.difficulty}
                      </span>
                    )}
                    {guide.estimatedTime && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        ⏱️ {guide.estimatedTime} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
