import { client } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { GuideForum } from "@/components/guides/guide-forum";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, FileText, Calendar } from "lucide-react";

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

  // Obtener guía desde Sanity
  const query = `*[_type == "guide" && slug.current == $guideSlug][0] {
    _id,
    title,
    slug,
    description,
    "books": books[]->{ _id, name, slug },
    content,
    pdfFile {
      asset-> {
        _id,
        url
      }
    },
    order,
    targetAudience,
    tags,
    publishedAt,
    isPublished
  }`;

  const guide = await client.fetch(query, { guideSlug });

  if (!guide || !guide.isPublished) {
    notFound();
  }

  // Obtener comentarios del foro
  const comments = await prisma.guideComment.findMany({
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
        },
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Renderizar contenido de Sanity
  const renderContent = (content: any[]) => {
    if (!content || content.length === 0) return null;

    return content.map((block: any, index: number) => {
      if (block._type === "block") {
        const text = block.children?.map((child: any) => child.text).join("") || "";
        
        if (block.style === "h1") {
          return <h1 key={index} className="text-3xl font-bold mb-4">{text}</h1>;
        }
        if (block.style === "h2") {
          return <h2 key={index} className="text-2xl font-bold mb-3">{text}</h2>;
        }
        if (block.style === "h3") {
          return <h3 key={index} className="text-xl font-bold mb-2">{text}</h3>;
        }
        return <p key={index} className="mb-4 text-gray-700">{text}</p>;
      }

      if (block._type === "image" && block.asset) {
        return (
          <div key={index} className="my-6">
            <img
              src={block.asset.url}
              alt={block.alt || ""}
              className="rounded-lg max-w-full"
            />
            {block.caption && (
              <p className="text-sm text-gray-500 mt-2 text-center">{block.caption}</p>
            )}
          </div>
        );
      }

      if (block._type === "file" && block.asset) {
        return (
          <div key={index} className="my-4 p-4 bg-gray-50 rounded-lg border">
            <a
              href={block.asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <FileText className="w-5 h-5" />
              <span>Descargar archivo adjunto</span>
            </a>
          </div>
        );
      }

      if (block._type === "video" && block.url) {
        return (
          <div key={index} className="my-6">
            <div className="aspect-video">
              <iframe
                src={block.url}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
            {block.caption && (
              <p className="text-sm text-gray-500 mt-2 text-center">{block.caption}</p>
            )}
          </div>
        );
      }

      return null;
    });
  };

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
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {guide.order !== undefined && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-3">
                Guía #{guide.order}
              </span>
            )}
            <h1 className="text-3xl font-bold mb-3">{guide.title}</h1>
            
            {guide.description && (
              <p className="text-gray-600 text-lg mb-4">{guide.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
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

          {guide.pdfFile?.asset?.url && (
            <Button asChild>
              <a href={guide.pdfFile.asset.url} target="_blank" rel="noopener noreferrer">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </a>
            </Button>
          )}
        </div>

        {guide.books && guide.books.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Libros relacionados:</p>
            <div className="flex flex-wrap gap-2">
              {guide.books.map((book: any) => (
                <Link
                  key={book._id}
                  href={`/libros/${book.slug.current}`}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {book.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contenido de la guía */}
      {guide.content && guide.content.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <div className="prose prose-lg max-w-none">
              {renderContent(guide.content)}
            </div>
          </div>
          <Separator className="my-8" />
        </>
      )}

      {/* Foro de discusión */}
      <GuideForum
        guideSanityId={guide._id}
        comments={comments.map((c) => ({
          id: c.id,
          content: c.content,
          imageUrls: c.imageUrls,
          isEdited: c.isEdited,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
          replies: c.replies.map((r) => ({
            id: r.id,
            content: r.content,
            imageUrls: r.imageUrls,
            isEdited: r.isEdited,
            createdAt: r.createdAt.toISOString(),
            user: r.user,
          })),
        }))}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
