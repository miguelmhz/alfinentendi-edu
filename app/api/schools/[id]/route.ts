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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const schoolId = params.id;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
            lastLogin: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            roles: true,
            status: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        grades: {
          select: {
            id: true,
            name: true,
            level: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error("Error obteniendo escuela:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, contact, logoUrl, coordinatorId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const params = await context.params;
    const schoolId = params.id;

    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    if (coordinatorId && coordinatorId !== existingSchool.coordinatorId) {
      const schoolWithCoordinator = await prisma.school.findFirst({
        where: {
          coordinatorId,
          id: { not: schoolId },
        },
      });

      if (schoolWithCoordinator) {
        return NextResponse.json(
          { error: "Este coordinador ya está asignado a otra escuela" },
          { status: 400 }
        );
      }
    }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        contact: contact?.trim() || null,
        logoUrl: logoUrl || null,
        coordinatorId: coordinatorId || null,
      },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ school });
  } catch (error) {
    console.error("Error actualizando escuela:", error);
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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const schoolId = params.id;

    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: true,
        grades: true,
      },
    });

    if (!existingSchool) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    if (existingSchool.users.length > 0 || existingSchool.grades.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una escuela con usuarios o grados asociados" },
        { status: 400 }
      );
    }

    await prisma.school.delete({
      where: { id: schoolId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando escuela:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
