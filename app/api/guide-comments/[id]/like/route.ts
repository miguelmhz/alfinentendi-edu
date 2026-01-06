import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const commentId = params.id;

    // Verificar autenticación
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el comentario existe
    const comment = await prisma.guideComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comentario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya existe un like
    const existingLike = await prisma.guideCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Si ya existe, eliminar el like (toggle)
      await prisma.guideCommentLike.delete({
        where: { id: existingLike.id },
      });

      // Contar likes actualizados
      const likesCount = await prisma.guideCommentLike.count({
        where: { commentId },
      });

      return NextResponse.json({
        liked: false,
        likesCount,
      });
    } else {
      // Si no existe, crear el like
      await prisma.guideCommentLike.create({
        data: {
          commentId,
          userId: user.id,
        },
      });

      // Contar likes actualizados
      const likesCount = await prisma.guideCommentLike.count({
        where: { commentId },
      });

      return NextResponse.json({
        liked: true,
        likesCount,
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Error al procesar el like" },
      { status: 500 }
    );
  }
}
