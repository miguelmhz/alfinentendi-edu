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
  params: Promise<{ slug: string }>;
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;

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

  // Verificar que sea profesor, coordinador o admin
  const isTeacher = currentUser?.roles.some(role => 
    ["TEACHER", "COORDINATOR", "ADMIN"].includes(role)
  );

  if (!isTeacher) {
    redirect("/guias");
  }

  // Obtener guía desde Sanity con estructura jerárquica
  const query = `*[_type == "guide" && slug.current == $slug][0] {
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

  const guide = await client.fetch(query, { slug });

  if (!guide || !guide.isPublished) {
    notFound();
  }

  // Obtener comentarios del foro agrupados por entrada usando Prisma
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
      likes: {
        select: {
          userId: true,
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
          likes: {
            select: {
              userId: true,
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
      likesCount: comment.likes.length,
      isLikedByCurrentUser: comment.likes.some((like) => like.userId === currentUser?.id),
      replies: comment.replies.map((r) => ({
        id: r.id,
        content: r.content,
        imageUrls: r.imageUrls,
        isEdited: r.isEdited,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
        likesCount: r.likes.length,
        isLikedByCurrentUser: r.likes.some((like) => like.userId === currentUser?.id),
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/guias">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Guías
              </Button>
            </Link>
          </div>

          <div className="flex items-start gap-6">
            {guide.coverImage?.asset?.url && (
              <img
                src={guide.coverImage.asset.url}
                alt={guide.title}
                className="w-32 h-32 object-cover rounded-lg shadow-md"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {guide.title}
              </h1>
              {guide.description && (
                <p className="text-gray-600 mb-4">{guide.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {guide.books && guide.books.length > 0 && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <Link
                      href={`/libros/${guide.books[0].slug.current}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {guide.books[0].name}
                    </Link>
                  </div>
                )}
                {guide.publishedAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(guide.publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              {guide.tags && guide.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
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
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <GuideContent
              sections={guide.sections || []}
              guideSanityId={guide._id}
              currentUserId={currentUser?.id}
              entryComments={entryComments}
            />

            <Separator className="my-8" />

            {/* Forum */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Foro de Discusión</h2>
              <GuideForum
                guideSanityId={guide._id}
                comments={guideGeneralComments}
                currentUserId={currentUser?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
