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

    const currentUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, roles: true },
    });

    const params = await context.params;
    const userId = params.id;

    // Verificar permisos: solo admins o el propio usuario pueden ver el perfil
    const isAdmin = currentUser?.roles.includes("ADMIN");
    const isOwnProfile = currentUser?.id === userId;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { error: "No tienes permisos para ver este perfil" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        groups: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                name: true,
                level: true,
              },
            },
          },
        },
        bookAccesses: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            isActive: true,
            status: true,
            book: {
              select: {
                id: true,
                title: true,
                pdfUrl: true,
                subject: true,
              },
            },
          },
          where: {
            AND: [
              { isActive: true },
              { status: "ACTIVE" },
              { endDate: { gte: new Date() } }
            ]
          },
        },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error obteniendo perfil de usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
