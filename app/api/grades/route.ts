import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { roles: true, schoolId: true },
    });

    // Si no es admin y no proporciona schoolId, error
    if (!user?.roles.includes("ADMIN") && !schoolId) {
      return NextResponse.json(
        { error: "schoolId es requerido" },
        { status: 400 }
      );
    }

    // Si no es admin y el schoolId no coincide con su escuela, error
    if (!user?.roles.includes("ADMIN") && user?.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    // Si es admin y no proporciona schoolId, devolver todos los grados
    // Si proporciona schoolId, filtrar por esa escuela
    const grades = await prisma.grade.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        groups: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            groups: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ grades });
  } catch (error) {
    console.error("Error obteniendo grados:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
      select: { roles: true, schoolId: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, level, schoolId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId es requerido" },
        { status: 400 }
      );
    }

    const grade = await prisma.grade.create({
      data: {
        name: name.trim(),
        level: level?.trim() || null,
        schoolId,
      },
      include: {
        groups: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ grade }, { status: 201 });
  } catch (error) {
    console.error("Error creando grado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
