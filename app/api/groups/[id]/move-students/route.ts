import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
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
    const targetGroupId = params.id; // Grupo destino

    const body = await request.json();
    const { studentIds, sourceGroupId } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Debes proporcionar al menos un estudiante" },
        { status: 400 }
      );
    }

    if (!sourceGroupId) {
      return NextResponse.json(
        { error: "Debes proporcionar el grupo de origen" },
        { status: 400 }
      );
    }

    // Verificar que ambos grupos existen y pertenecen al mismo grado y escuela
    const [sourceGroup, targetGroup] = await Promise.all([
      prisma.group.findUnique({
        where: { id: sourceGroupId },
        select: {
          gradeId: true,
          grade: {
            select: { schoolId: true },
          },
        },
      }),
      prisma.group.findUnique({
        where: { id: targetGroupId },
        select: {
          gradeId: true,
          grade: {
            select: { schoolId: true },
          },
        },
      }),
    ]);

    if (!sourceGroup || !targetGroup) {
      return NextResponse.json(
        { error: "Uno o ambos grupos no existen" },
        { status: 404 }
      );
    }

    // Verificar que ambos grupos pertenecen al mismo grado
    if (sourceGroup.gradeId !== targetGroup.gradeId) {
      return NextResponse.json(
        { error: "Solo puedes mover estudiantes entre grupos del mismo grado" },
        { status: 400 }
      );
    }

    const schoolId = sourceGroup.grade.schoolId;

    // Verificar permisos: Admin o Coordinador de la escuela
    const isAdmin = user.roles.includes("ADMIN");
    const isCoordinator = user.roles.includes("COORDINATOR") && user.schoolId === schoolId;

    if (!isAdmin && !isCoordinator) {
      return NextResponse.json(
        { error: "No tienes permisos para mover estudiantes entre grupos" },
        { status: 403 }
      );
    }

    // Verificar que todos los estudiantes existen y están en el grupo origen
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        roles: { has: "STUDENT" },
        schoolId,
      },
      select: { id: true },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Algunos estudiantes no son válidos o no pertenecen a esta escuela" },
        { status: 400 }
      );
    }

    // Mover estudiantes: eliminar del grupo origen y agregar al grupo destino
    await prisma.$transaction(async (tx) => {
      // Eliminar del grupo origen
      await tx.$executeRaw`
        DELETE FROM user_groups
        WHERE "userId" = ANY(${studentIds}::text[])
        AND "groupId" = ${sourceGroupId}
      `;

      // Agregar al grupo destino (con ON CONFLICT por si ya están)
      for (const studentId of studentIds) {
        await tx.$executeRaw`
          INSERT INTO user_groups (id, "userId", "groupId", "createdAt")
          VALUES (gen_random_uuid()::text, ${studentId}, ${targetGroupId}, NOW())
          ON CONFLICT ("userId", "groupId") DO NOTHING
        `;
      }
    });

    return NextResponse.json({
      success: true,
      message: `${studentIds.length} estudiante${studentIds.length !== 1 ? 's' : ''} movido${studentIds.length !== 1 ? 's' : ''} al nuevo grupo`,
      movedCount: studentIds.length,
    });
  } catch (error: any) {
    console.error("Error moviendo estudiantes entre grupos:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
