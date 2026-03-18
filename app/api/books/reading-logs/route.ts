import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
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
    const { bookSanityId, deviceType } = body;

    if (!bookSanityId) {
      return NextResponse.json(
        { error: "bookSanityId es requerido" },
        { status: 400 }
      );
    }

    // Obtener el libro de Prisma
    const book = await prisma.book.findUnique({
      where: { sanityId: bookSanityId },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    // Crear log de lectura
    const readingLog = await prisma.bookReadingLog.create({
      data: {
        userId: user.id,
        bookId: book.id,
        bookSanityId,
        deviceType: deviceType || "desktop",
        sessionStart: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      logId: readingLog.id,
      message: "Sesión de lectura iniciada",
    });
  } catch (error) {
    console.error("Error al crear log de lectura:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
