import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener última página leída
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookSanityId: string }> }
) {
  try {
    const { bookSanityId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener usuario desde Prisma
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

    // Buscar el último log de lectura para este libro
    const latestLog = await prisma.bookReadingLog.findFirst({
      where: {
        userId: user.id,
        bookSanityId,
      },
      orderBy: {
        sessionStart: "desc",
      },
      select: {
        lastPage: true,
        pagesViewed: true,
        sessionStart: true,
      },
    });

    if (!latestLog) {
      return NextResponse.json({
        lastPage: 1,
        pagesViewed: 0,
      });
    }

    return NextResponse.json({
      lastPage: latestLog.lastPage || 1,
      pagesViewed: latestLog.pagesViewed || 0,
      lastUpdated: latestLog.sessionStart,
    });
  } catch (error) {
    console.error("Error getting book progress:", error);
    return NextResponse.json(
      { error: "Error al obtener progreso" },
      { status: 500 }
    );
  }
}

// POST - Guardar última página leída
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookSanityId: string }> }
) {
  try {
    const { bookSanityId } = await params;
    const body = await request.json();
    const { lastPage } = body;

    if (!lastPage || typeof lastPage !== "number") {
      return NextResponse.json(
        { error: "lastPage es requerido y debe ser un número" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener usuario desde Prisma
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

    // Obtener o crear el libro en Prisma
    let book = await prisma.book.findUnique({
      where: { sanityId: bookSanityId },
      select: { id: true },
    });

    if (!book) {
      // Si el libro no existe en Prisma, crearlo
      book = await prisma.book.create({
        data: {
          sanityId: bookSanityId,
          title: "Unknown", // Se actualizará cuando se sincronice
          pdfUrl: "", // Se actualizará cuando se sincronice
        },
        select: { id: true },
      });
    }

    // Buscar el log de lectura más reciente
    const latestLog = await prisma.bookReadingLog.findFirst({
      where: {
        userId: user.id,
        bookSanityId,
      },
      orderBy: {
        sessionStart: "desc",
      },
    });

    if (latestLog) {
      // Actualizar el log existente
      await prisma.bookReadingLog.update({
        where: { id: latestLog.id },
        data: {
          lastPage,
          updatedAt: new Date(),
        },
      });
    } else {
      // Crear un nuevo log si no existe
      await prisma.bookReadingLog.create({
        data: {
          userId: user.id,
          bookId: book.id,
          bookSanityId,
          lastPage,
          deviceType: "unknown",
        },
      });
    }

    return NextResponse.json({
      success: true,
      lastPage,
    });
  } catch (error) {
    console.error("Error saving book progress:", error);
    return NextResponse.json(
      { error: "Error al guardar progreso" },
      { status: 500 }
    );
  }
}
