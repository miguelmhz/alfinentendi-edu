import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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
      select: { id: true, roles: true, schoolId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const params = await context.params;
    const userId = params.id;

    // Verificar permisos
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const isAdmin = user.roles.includes("ADMIN");
    const isSameSchool = user.schoolId === targetUser.schoolId;
    const isCoordinator = user.roles.includes("COORDINATOR") && isSameSchool;
    const isSelf = user.id === userId;

    if (!isAdmin && !isCoordinator && !isSelf) {
      return NextResponse.json(
        { error: "No tienes permisos para ver estos accesos" },
        { status: 403 }
      );
    }

    // Obtener accesos activos del usuario
    const accesses = await prisma.bookAccess.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        bookId: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accesses });
  } catch (error: any) {
    console.error("Error obteniendo accesos:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
