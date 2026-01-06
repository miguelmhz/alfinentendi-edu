import { client } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { GuideForum } from "@/components/guides/guide-forum";
import { GuideContent } from "@/components/guides/guide-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string; guideSlug: string }>;
}

export default async function GuidePage({ params }: PageProps) {
  const { slug, guideSlug } = await params;

  // Verificar autenticación
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true, roles: true, name: true, email: true },
  });

  // Verificar que sea profesor
  const isTeacher = currentUser?.roles.some(role => 
    ["TEACHER", "COORDINATOR", "ADMIN"].includes(role)
  );

  if (!isTeacher) {
    redirect(`/libros/${slug}`);
  }

  // Obtener guía desde Sanity con estructura jerárquica
  const query = `*[_type == "guide" && slug.current == $guideSlug][0] {
    _id,
    title,
    slug,
    description,
    "books": books[]->{ _id, name, slug },
    coverImage {
      asset-> {
        _id,
        url
      }
    },
    sections[]->{
      _id,
      title,
      slug,
      order,
      description,
      isPublished,
      entries[]->{
        _id,
        title,
        slug,
        order,
        content[] {
          ...,
          _type == "image" => {
            ...,
            asset-> {
              _id,
              url
            }
          },
          _type == "file" => {
            ...,
            asset-> {
              _id,
              url,
              originalFilename
            }
          }
        },
        attachments[] {
          ...,
          asset-> {
            _id,
            url,
            originalFilename
          }
        },
        links,
        isPublished
      }
    } | order(order asc),
    targetAudience,
    tags,
    publishedAt,
    isPublished
  }`;

  const guide = await client.fetch(query, { guideSlug });

  if (!guide || !guide.isPublished) {
    notFound();
  }

  // Obtener comentarios del foro agrupados por entrada
  const allComments = await prisma.guideComment.findMany({
    where: {
      guideSanityId: guide._id,
      parentId: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          school: {
            select: {
              name: true,
            },
          },
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: true,
              school: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Separar comentarios generales de la guía y comentarios por entrada
  const guideGeneralComments: any[] = [];
  const entryComments: Record<string, any[]> = {};
  
  allComments.forEach((comment) => {
    const commentData = {
      id: comment.id,
      content: comment.content,
      imageUrls: comment.imageUrls,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
      replies: comment.replies.map((r) => ({
        id: r.id,
        content: r.content,
        imageUrls: r.imageUrls,
        isEdited: r.isEdited,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    };

    if (!comment.entrySanityId) {
      // Comentarios generales de la guía (sin entrada específica)
      guideGeneralComments.push(commentData);
    } else {
      // Comentarios específicos de entrada
      if (!entryComments[comment.entrySanityId]) {
        entryComments[comment.entrySanityId] = [];
      }
      entryComments[comment.entrySanityId].push(commentData);
    }
  });

  // Filtrar solo secciones y entradas publicadas
  const publishedSections = guide.sections
    ?.filter((section: any) => section.isPublished)
    .map((section: any) => ({
      ...section,
      entries: section.entries?.filter((entry: any) => entry.isPublished) || [],
    }))
    .filter((section: any) => section.entries.length > 0) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/libros/${slug}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al libro
        </Link>
      </div>

      {/* Header de la guía */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
        {guide.coverImage?.asset?.url && (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-blue-700 relative">
            <img
              src={guide.coverImage.asset.url}
              alt={guide.title}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3 text-gray-900">{guide.title}</h1>
              
              {guide.description && (
                <p className="text-gray-600 text-lg mb-4 leading-relaxed">{guide.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                {guide.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(guide.publishedAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}

                {guide.targetAudience && (
                  <Badge variant="outline">
                    {guide.targetAudience === "teachers" ? "Profesores" : "Profesores y Coordinadores"}
                  </Badge>
                )}

                {guide.tags && guide.tags.length > 0 && (
                  <div className="flex gap-2">
                    {guide.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {guide.books && guide.books.length > 0 && (
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Libros relacionados:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {guide.books.map((book: any) => (
                  <Link
                    key={book._id}
                    href={`/libros/${book.slug.current}`}
                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors"
                  >
                    {book.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido de la guía con estructura jerárquica */}
      {publishedSections.length > 0 ? (
        <>
          <GuideContent 
            sections={publishedSections}
            guideSanityId={guide._id}
            currentUserId={currentUser?.id}
            entryComments={entryComments}
          />
          <Separator className="my-8" />
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8 text-center">
          <p className="text-gray-500">Esta guía aún no tiene contenido disponible.</p>
        </div>
      )}

      {/* Foro de discusión general de la guía */}
      <div className="mt-8">
        <GuideForum
          guideSanityId={guide._id}
          comments={guideGeneralComments}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}
