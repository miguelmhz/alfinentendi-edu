import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      select: { id: true, roles: true, schoolId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { students, schoolId } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "Lista de estudiantes requerida" },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "ID de escuela requerido" },
        { status: 400 }
      );
    }

    // Verificar permisos: Admin o coordinador de la escuela
    const isAdmin = user.roles.includes("ADMIN");
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { coordinatorId: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    const isCoordinator = school.coordinatorId === user.id;

    if (!isAdmin && !isCoordinator) {
      return NextResponse.json(
        { error: "No tienes permisos para agregar estudiantes a esta escuela" },
        { status: 403 }
      );
    }

    // Validar correos
    const validStudents = students.filter(
      (s: any) => s.email && s.email.includes("@")
    );

    if (validStudents.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron correos válidos" },
        { status: 400 }
      );
    }

    // Verificar cuáles correos ya existen
    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: validStudents.map((s: any) => s.email.toLowerCase().trim()),
        },
      },
      select: { email: true },
    });

    const existingEmails = new Set(existingUsers.map((u) => u.email));
    const newStudents = validStudents.filter(
      (s: any) => !existingEmails.has(s.email.toLowerCase().trim())
    );

    if (newStudents.length === 0) {
      return NextResponse.json({
        created: 0,
        skipped: validStudents.length,
        message: "Todos los correos ya existen en el sistema",
      });
    }

    // Crear estudiantes en batch
    const createdUsers = await prisma.user.createMany({
      data: newStudents.map((student: any) => ({
        email: student.email.toLowerCase().trim(),
        name: student.name?.trim() || null,
        roles: ["STUDENT"],
        status: "INVITED",
        schoolId,
        createdBy: user.id,
      })),
    });

    // Enviar invitaciones por correo (usando Supabase Auth)
    // Nota: Supabase enviará automáticamente el magic link cuando el usuario intente iniciar sesión
    // O podemos enviar invitaciones manualmente aquí
    for (const student of newStudents) {
      try {
        // Invitar usuario en Supabase Auth
        await supabase.auth.admin.inviteUserByEmail(student.email.toLowerCase().trim(), {
          data: {
            name: student.name || null,
            school_id: schoolId,
          },
        });
      } catch (error) {
        console.error(`Error invitando a ${student.email}:`, error);
        // Continuar con los demás aunque falle uno
      }
    }

    return NextResponse.json({
      success: true,
      created: createdUsers.count,
      skipped: validStudents.length - newStudents.length,
      message: `${createdUsers.count} estudiante${createdUsers.count !== 1 ? 's' : ''} creado${createdUsers.count !== 1 ? 's' : ''} exitosamente`,
    });
  } catch (error: any) {
    console.error("Error creando estudiantes:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
