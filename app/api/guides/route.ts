import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    // Verificar autenticación y rol
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { roles: true },
    });

    // Solo profesores, coordinadores y admins pueden ver guías
    if (!user?.roles.some(role => ["TEACHER", "COORDINATOR", "ADMIN"].includes(role))) {
      return NextResponse.json(
        { error: "Solo los profesores pueden acceder a las guías" },
        { status: 403 }
      );
    }

    // Si hay bookId, filtrar por libro específico, sino traer todas las guías
    const query = bookId
      ? `*[_type == "guide" && references($bookId) && isPublished == true] | order(order asc, publishedAt desc) {
          _id,
          title,
          slug,
          description,
          coverImage {
            asset-> {
              url
            }
          },
          "book": books[0]->{ _id, name, slug },
          difficulty,
          estimatedTime,
          isPublic,
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
          publishedAt
        }`
      : `*[_type == "guide" && isPublished == true] | order(publishedAt desc) {
          _id,
          title,
          slug,
          description,
          coverImage {
            asset-> {
              url
            }
          },
          "book": books[0]->{ _id, name, slug },
          difficulty,
          estimatedTime,
          isPublic,
          publishedAt
        }`;

    const guides = bookId 
      ? await client.fetch(query, { bookId })
      : await client.fetch(query);

    return NextResponse.json({ guides });
  } catch (error) {
    console.error("Error obteniendo guías:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
