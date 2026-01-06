import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
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

    const params = await context.params;
    const bookId = params.id;

    const { searchParams } = new URL(request.url);
    const slugOrId = searchParams.get("schoolId");

    if (!slugOrId) {
      return NextResponse.json(
        { error: "schoolId es requerido" },
        { status: 400 }
      );
    }

    // Resolver slug a ID
    const school = await prisma.school.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    const schoolId = school.id;

    // Verificar permisos: Admin o miembro de la escuela
    const isAdmin = user.roles.includes("ADMIN");
    const isSchoolMember =
      user.schoolId === schoolId &&
      (user.roles.includes("COORDINATOR") || user.roles.includes("TEACHER"));

    if (!isAdmin && !isSchoolMember) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    // Verificar que el libro existe
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    // Obtener estudiantes con acceso al libro en esta escuela
    const students = await prisma.user.findMany({
      where: {
        schoolId,
        roles: { has: "STUDENT" },
        bookAccesses: {
          some: {
            bookId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        bookAccesses: {
          where: {
            bookId,
          },
          select: {
            id: true,
            createdAt: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`[GET /api/books/${bookId}/students] Found ${students.length} students for schoolId: ${schoolId}`);

    // Transform to flatten bookAccesses
    const transformedStudents = students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      bookAccess: student.bookAccesses[0], // Solo debería haber uno por libro
    }));

    return NextResponse.json({ students: transformedStudents });
  } catch (error) {
    console.error("Error obteniendo estudiantes con acceso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
