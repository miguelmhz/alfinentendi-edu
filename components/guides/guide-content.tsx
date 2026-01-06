"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { GuideForum } from "./guide-forum";

interface GuideEntry {
  _id: string;
  title: string;
  slug: { current: string };
  order: number;
  content: any[];
  attachments?: any[];
  links?: Array<{
    url: string;
    title: string;
    description?: string;
  }>;
  isPublished: boolean;
}

interface GuideSection {
  _id: string;
  title: string;
  slug: { current: string };
  order: number;
  description?: string;
  entries: GuideEntry[];
  isPublished: boolean;
}

interface Comment {
  id: string;
  content: string;
  imageUrls: string[];
  isEdited: boolean;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    roles?: string[];
    school?: {
      name: string;
    } | null;
  };
  replies?: Comment[];
}

interface GuideContentProps {
  sections: GuideSection[];
  guideSanityId: string;
  currentUserId?: string;
  entryComments: Record<string, Comment[]>;
}

export function GuideContent({ sections, guideSanityId, currentUserId, entryComments }: GuideContentProps) {
  const [activeSection, setActiveSection] = useState<string | null>(
    sections[0]?._id || null
  );
  const [activeEntry, setActiveEntry] = useState<string | null>(
    sections[0]?.entries[0]?._id || null
  );

  const handleSectionClick = (sectionId: string) => {
    if (activeSection === sectionId) {
      // Si la sección ya está activa, cerrarla
      setActiveSection(null);
      setActiveEntry(null);
    } else {
      // Si es una sección diferente, abrirla y seleccionar la primera entrada
      setActiveSection(sectionId);
      const section = sections.find((s) => s._id === sectionId);
      setActiveEntry(section?.entries[0]?._id || null);
    }
  };

  const currentSection = sections.find((s) => s._id === activeSection);
  const currentEntry = currentSection?.entries.find((e) => e._id === activeEntry);
  const currentEntryComments = currentEntry ? (entryComments[currentEntry._id] || []) : [];

  const renderContent = (content: any[]) => {
    if (!content || content.length === 0) return null;

    return content.map((block: any, index: number) => {
      if (block._type === "block") {
        const children = block.children?.map((child: any, childIndex: number) => {
          let text = child.text || "";
          
          if (child.marks?.includes("strong")) {
            return <strong key={childIndex}>{text}</strong>;
          }
          if (child.marks?.includes("em")) {
            return <em key={childIndex}>{text}</em>;
          }
          if (child.marks?.includes("underline")) {
            return <u key={childIndex}>{text}</u>;
          }
          
          return <span key={childIndex}>{text}</span>;
        });

        if (block.style === "h1") {
          return (
            <h1 key={index} className="text-3xl font-bold mb-4 mt-8">
              {children}
            </h1>
          );
        }
        if (block.style === "h2") {
          return (
            <h2 key={index} className="text-2xl font-bold mb-3 mt-6">
              {children}
            </h2>
          );
        }
        if (block.style === "h3") {
          return (
            <h3 key={index} className="text-xl font-bold mb-2 mt-4">
              {children}
            </h3>
          );
        }
        if (block.style === "h4") {
          return (
            <h4 key={index} className="text-lg font-bold mb-2 mt-3">
              {children}
            </h4>
          );
        }
        if (block.listItem === "bullet") {
          return (
            <li key={index} className="ml-6 mb-2">
              {children}
            </li>
          );
        }
        if (block.listItem === "number") {
          return (
            <li key={index} className="ml-6 mb-2 list-decimal">
              {children}
            </li>
          );
        }
        
        return (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {children}
          </p>
        );
      }

      if (block._type === "image" && block.asset) {
        return (
          <div key={index} className="my-6">
            <img
              src={block.asset.url}
              alt={block.alt || ""}
              className="rounded-lg max-w-full shadow-md"
            />
            {block.caption && (
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                {block.caption}
              </p>
            )}
          </div>
        );
      }

      if (block._type === "file" && block.asset) {
        return (
          <div key={index} className="my-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <a
              href={block.asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <FileText className="w-5 h-5" />
              <span>{block.title || "Descargar archivo adjunto"}</span>
              <Download className="w-4 h-4 ml-auto" />
            </a>
            {block.description && (
              <p className="text-sm text-gray-600 mt-2">{block.description}</p>
            )}
          </div>
        );
      }

      if (block._type === "video" && block.url) {
        const getEmbedUrl = (url: string) => {
          if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = url.includes("youtu.be")
              ? url.split("/").pop()
              : new URL(url).searchParams.get("v");
            return `https://www.youtube.com/embed/${videoId}`;
          }
          if (url.includes("vimeo.com")) {
            const videoId = url.split("/").pop();
            return `https://player.vimeo.com/video/${videoId}`;
          }
          return url;
        };

        return (
          <div key={index} className="my-6">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                src={getEmbedUrl(block.url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            {block.caption && (
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                {block.caption}
              </p>
            )}
          </div>
        );
      }

      if (block._type === "link") {
        return (
          <div key={index} className="my-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <a
              href={block.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              <span>{block.title}</span>
            </a>
            {block.description && (
              <p className="text-sm text-gray-600 mt-2">{block.description}</p>
            )}
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar de navegación */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          <h3 className="font-bold text-lg mb-4">Contenido</h3>
          <nav className="space-y-2">
            {sections.map((section) => (
              <div key={section._id}>
                <button
                  onClick={() => handleSectionClick(section._id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    activeSection === section._id
                      ? "bg-blue-100 text-blue-900"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {activeSection === section._id ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="flex-1">{section.title}</span>
                </button>
                
                {activeSection === section._id && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.entries.map((entry) => (
                      <button
                        key={entry._id}
                        onClick={() => setActiveEntry(entry._id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                          activeEntry === entry._id
                            ? "bg-blue-50 text-blue-900 font-medium"
                            : "hover:bg-gray-50 text-gray-600"
                        )}
                      >
                        {entry.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:col-span-3">
        {currentEntry ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span>{currentSection?.title}</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-700 font-medium">{currentEntry.title}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentEntry.title}
              </h1>
            </div>

            <div className="prose prose-lg max-w-none">
              {renderContent(currentEntry.content)}
            </div>

            {/* Archivos adjuntos adicionales */}
            {currentEntry.attachments && currentEntry.attachments.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-bold mb-4">Archivos adjuntos</h3>
                <div className="space-y-2">
                  {currentEntry.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <a
                        href={attachment.asset?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <FileText className="w-5 h-5" />
                        <span>{attachment.title || "Archivo adjunto"}</span>
                        <Download className="w-4 h-4 ml-auto" />
                      </a>
                      {attachment.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {attachment.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enlaces adicionales */}
            {currentEntry.links && currentEntry.links.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-bold mb-4">Enlaces relacionados</h3>
                <div className="space-y-2">
                  {currentEntry.links.map((link, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>{link.title}</span>
                      </a>
                      {link.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {link.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegación entre entradas */}
            <div className="mt-8 pt-6 border-t flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  const currentSectionIndex = sections.findIndex(
                    (s) => s._id === activeSection
                  );
                  const currentEntryIndex = currentSection?.entries.findIndex(
                    (e) => e._id === activeEntry
                  );

                  if (currentEntryIndex !== undefined && currentEntryIndex > 0) {
                    setActiveEntry(currentSection!.entries[currentEntryIndex - 1]._id);
                  } else if (currentSectionIndex > 0) {
                    const prevSection = sections[currentSectionIndex - 1];
                    setActiveSection(prevSection._id);
                    setActiveEntry(
                      prevSection.entries[prevSection.entries.length - 1]._id
                    );
                  }
                }}
                disabled={
                  sections.findIndex((s) => s._id === activeSection) === 0 &&
                  currentSection?.entries.findIndex((e) => e._id === activeEntry) === 0
                }
              >
                ← Anterior
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const currentSectionIndex = sections.findIndex(
                    (s) => s._id === activeSection
                  );
                  const currentEntryIndex = currentSection?.entries.findIndex(
                    (e) => e._id === activeEntry
                  );

                  if (
                    currentEntryIndex !== undefined &&
                    currentSection &&
                    currentEntryIndex < currentSection.entries.length - 1
                  ) {
                    setActiveEntry(currentSection.entries[currentEntryIndex + 1]._id);
                  } else if (currentSectionIndex < sections.length - 1) {
                    const nextSection = sections[currentSectionIndex + 1];
                    setActiveSection(nextSection._id);
                    setActiveEntry(nextSection.entries[0]._id);
                  }
                }}
                disabled={
                  sections.findIndex((s) => s._id === activeSection) ===
                    sections.length - 1 &&
                  currentSection?.entries.findIndex((e) => e._id === activeEntry) ===
                    (currentSection?.entries.length || 0) - 1
                }
              >
                Siguiente →
              </Button>
            </div>

            {/* Foro de discusión específico de la entrada */}
            <div className="mt-6">
              <Separator className="mb-8" />
              <GuideForum
                guideSanityId={guideSanityId}
                entrySanityId={currentEntry._id}
                comments={currentEntryComments}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            Selecciona una entrada del menú para ver su contenido
          </div>
        )}
      </div>
    </div>
  );
}
