import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { bookSanityId, rating, comment } = body;

    if (!bookSanityId || !rating) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "La calificación debe estar entre 1 y 5" },
        { status: 400 }
      );
    }

    const review = await prisma.bookReview.create({
      data: {
        bookSanityId,
        userId: user.id,
        rating,
        comment: comment || null,
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

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Ya has dejado una review para este libro" },
        { status: 409 }
      );
    }
    console.error("Error creando review:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookSanityId = searchParams.get("bookSanityId");
    const userId = searchParams.get("userId");

    if (!bookSanityId) {
      return NextResponse.json(
        { error: "bookSanityId es requerido" },
        { status: 400 }
      );
    }

    const where: any = { bookSanityId };
    if (userId) where.userId = userId;

    const reviews = await prisma.bookReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const stats = await prisma.bookReview.aggregate({
      where: { bookSanityId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
      },
    });
  } catch (error) {
    console.error("Error obteniendo reviews:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
