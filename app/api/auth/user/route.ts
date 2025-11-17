import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Crear cliente de Supabase
    const supabase = await createClient();

    // Obtener el usuario autenticado de Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener información completa del usuario desde Prisma
    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        schoolId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      console.error("Usuario no encontrado en Prisma");
      // Si no existe el usuario en Prisma, retornar datos básicos del auth
      return NextResponse.json({
        user: {
          id: authUser.id,
          email: authUser.email,
          roles: [],
          status: null,
          name: null,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        status: user.status,
        schoolId: user.schoolId,
        school: user.school,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
