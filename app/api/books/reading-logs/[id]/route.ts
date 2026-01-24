import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { pagesViewed, lastPage, duration } = body;

    // Verificar que el log pertenece al usuario
    const existingLog = await prisma.bookReadingLog.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingLog) {
      return NextResponse.json(
        { error: "Log de lectura no encontrado" },
        { status: 404 }
      );
    }

    if (existingLog.userId !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Actualizar log de lectura
    const updatedLog = await prisma.bookReadingLog.update({
      where: { id },
      data: {
        pagesViewed,
        lastPage,
        duration,
        sessionEnd: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      log: updatedLog,
      message: "Sesión de lectura actualizada",
    });
  } catch (error) {
    console.error("Error al actualizar log de lectura:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
