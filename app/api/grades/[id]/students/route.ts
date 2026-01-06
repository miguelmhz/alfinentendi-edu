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
    const gradeId = params.id;

    // Verificar que el grado existe y obtener su schoolId
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { schoolId: true },
    });

    if (!grade) {
      return NextResponse.json(
        { error: "Grado no encontrado" },
        { status: 404 }
      );
    }

    // Verificar permisos: Admin o Coordinador de la escuela
    const isAdmin = user.roles.includes("ADMIN");
    const isCoordinator = user.roles.includes("COORDINATOR") && user.schoolId === grade.schoolId;

    if (!isAdmin && !isCoordinator) {
      return NextResponse.json(
        { error: "No tienes permisos para asignar estudiantes a este grado" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "Debes proporcionar al menos un estudiante" },
        { status: 400 }
      );
    }

    // Verificar que todos los estudiantes existen y pertenecen a la misma escuela
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        roles: { has: "STUDENT" },
        schoolId: grade.schoolId,
      },
      select: { id: true },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Algunos estudiantes no son válidos o no pertenecen a esta escuela" },
        { status: 400 }
      );
    }

    // Crear un grupo por defecto para el grado si no existe
    // Los estudiantes se asignan a través de grupos
    let defaultGroup = await prisma.group.findFirst({
      where: {
        gradeId,
        name: "General",
      },
    });

    if (!defaultGroup) {
      defaultGroup = await prisma.group.create({
        data: {
          name: "General",
          gradeId,
        },
      });
    }

    // Asignar estudiantes al grupo por defecto
    // Crear las relaciones una por una para manejar duplicados
    const assignments = await Promise.all(
      studentIds.map(async (studentId: string) => {
        try {
          return await prisma.$executeRaw`
            INSERT INTO user_groups (id, "userId", "groupId", "createdAt")
            VALUES (gen_random_uuid()::text, ${studentId}, ${defaultGroup!.id}, NOW())
            ON CONFLICT ("userId", "groupId") DO NOTHING
          `;
        } catch (error) {
          console.error(`Error asignando estudiante ${studentId}:`, error);
          return 0;
        }
      })
    );

    const assignedCount = assignments.filter(count => count > 0).length;

    return NextResponse.json({
      success: true,
      message: `${assignedCount} estudiante${assignedCount !== 1 ? 's' : ''} asignado${assignedCount !== 1 ? 's' : ''} al grado`,
      groupId: defaultGroup.id,
      total: studentIds.length,
      assigned: assignedCount,
    });
  } catch (error: any) {
    console.error("Error asignando estudiantes al grado:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
