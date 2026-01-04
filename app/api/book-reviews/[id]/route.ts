import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const params = await context.params;
    const reviewId = params.id;

    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.userId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para editar esta review" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "La calificación debe estar entre 1 y 5" },
        { status: 400 }
      );
    }

    const review = await prisma.bookReview.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment: comment || null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Error actualizando review:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
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

    const params = await context.params;
    const reviewId = params.id;

    const existingReview = await prisma.bookReview.findUnique({
      where: { id: reviewId },
      select: { userId: true },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.userId !== user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar esta review" },
        { status: 403 }
      );
    }

    await prisma.bookReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando review:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
