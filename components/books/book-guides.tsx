"use client";

import Link from "next/link";
import { FileText, Lock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Guide {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
  content?: any[];
  pdfFile?: {
    asset: {
      url: string;
    };
  };
  order?: number;
  targetAudience: string;
  tags?: string[];
  publishedAt: string;
}

interface BookGuidesProps {
  bookSlug: string;
  guides: Guide[];
  isTeacher: boolean;
}

export function BookGuides({ bookSlug, guides, isTeacher }: BookGuidesProps) {
  if (!isTeacher) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Guías para Profesores</h3>
        <p className="text-gray-600">
          Las guías educativas están disponibles exclusivamente para profesores y coordinadores.
        </p>
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No hay guías disponibles</h3>
        <p className="text-gray-600">
          Aún no se han publicado guías para este libro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Guías Educativas</h2>
        <Badge variant="secondary">{guides.length} guías</Badge>
      </div>

      <div className="grid gap-4">
        {guides.map((guide, index) => (
          <Link
            key={guide._id}
            href={`/libros/${bookSlug}/guias/${guide.slug.current}`}
            className="group block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                {guide.order !== undefined ? guide.order : index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                  {guide.title}
                </h3>

                {guide.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {guide.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(guide.publishedAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {guide.pdfFile && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      PDF
                    </Badge>
                  )}

                  {guide.content && guide.content.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Contenido interactivo
                    </Badge>
                  )}

                  {guide.tags && guide.tags.length > 0 && (
                    <>
                      {guide.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {guide.tags.length > 2 && (
                        <span className="text-xs">+{guide.tags.length - 2}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="flex-shrink-0">
                Ver guía →
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
