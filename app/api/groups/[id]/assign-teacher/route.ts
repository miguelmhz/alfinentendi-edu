import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
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

    // Solo admins y coordinadores pueden asignar profesores
    const isAdmin = user.roles.includes("ADMIN");
    const isCoordinator = user.roles.includes("COORDINATOR");

    if (!isAdmin && !isCoordinator) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const groupId = params.id;
    const body = await request.json();
    const { teacherId } = body;

    // Verificar que el grupo existe
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        gradeId: true,
        grade: {
          select: {
            schoolId: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el coordinador pertenece a la misma escuela
    if (isCoordinator && user.schoolId !== group.grade.schoolId) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar este grupo" },
        { status: 403 }
      );
    }

    // Si se proporciona teacherId, verificar que existe y es profesor
    if (teacherId) {
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: {
          id: true,
          roles: true,
          schoolId: true,
        },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Profesor no encontrado" },
          { status: 404 }
        );
      }

      if (!teacher.roles.includes("TEACHER")) {
        return NextResponse.json(
          { error: "El usuario seleccionado no es un profesor" },
          { status: 400 }
        );
      }

      if (teacher.schoolId !== group.grade.schoolId) {
        return NextResponse.json(
          { error: "El profesor no pertenece a esta escuela" },
          { status: 400 }
        );
      }
    }

    // Actualizar el grupo con el nuevo profesor (o null para remover)
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        teacherId: teacherId || null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (error) {
    console.error("Error asignando profesor al grupo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
