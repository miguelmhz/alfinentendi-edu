import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
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

    // Solo admins pueden revocar acceso
    if (!user.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const bookId = params.id;
    const body = await request.json();
    const { studentIds, schoolId } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: "studentIds es requerido y debe ser un array" },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "schoolId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el libro existe
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que la escuela existe
    const school = await prisma.school.findFirst({
      where: {
        OR: [{ slug: schoolId }, { id: schoolId }],
      },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Escuela no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que todos los estudiantes pertenecen a la escuela
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        schoolId: school.id,
        roles: { has: "STUDENT" },
      },
      select: { id: true },
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { error: "Algunos estudiantes no pertenecen a esta escuela" },
        { status: 400 }
      );
    }

    // Revocar acceso
    const result = await prisma.bookAccess.deleteMany({
      where: {
        bookId,
        userId: { in: studentIds },
      },
    });

    // Actualizar contador de licencias usadas
    await prisma.$executeRaw`
      UPDATE school_book_licenses
      SET "usedLicenses" = (
        SELECT COUNT(DISTINCT ba."userId")
        FROM book_access ba
        WHERE ba."bookId" = ${bookId}
        AND ba."userId" IN (
          SELECT u.id FROM users u WHERE u."schoolId" = ${school.id}
        )
      )
      WHERE "bookId" = ${bookId}
      AND "schoolId" = ${school.id}
    `;

    return NextResponse.json({
      success: true,
      revokedCount: result.count,
    });
  } catch (error) {
    console.error("Error revocando acceso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
