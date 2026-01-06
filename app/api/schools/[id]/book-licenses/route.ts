import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Obtener licencias de libros de una escuela
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
      select: { id: true, roles: true, schoolId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const params = await context.params;
    const slugOrId = params.id;

    // Find school by slug or id
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
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

    // Verificar permisos: Admin o coordinador/profesor de la escuela
    const isAdmin = user.roles.includes("ADMIN");
    const isSchoolMember = user.schoolId === schoolId && 
      (user.roles.includes("COORDINATOR") || user.roles.includes("TEACHER"));

    if (!isAdmin && !isSchoolMember) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    const licenses = await prisma.schoolBookLicense.findMany({
      where: { schoolId },
      include: {
        book: {
          select: {
            id: true,
            sanityId: true,
            title: true,
            subject: true,
            pdfUrl: true,
          },
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ licenses });
  } catch (error) {
    console.error("Error obteniendo licencias:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Asignar licencias de libro a una escuela
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
      select: { id: true, roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const slugOrId = params.id;

    // Find school by slug or id
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
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
    const body = await request.json();
    const { bookId, totalLicenses, startDate, endDate } = body;

    if (!bookId || !totalLicenses || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (totalLicenses < 1) {
      return NextResponse.json(
        { error: "El número de licencias debe ser al menos 1" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una licencia para este libro en esta escuela
    const existingLicense = await prisma.schoolBookLicense.findUnique({
      where: {
        schoolId_bookId: {
          schoolId,
          bookId,
        },
      },
    });

    if (existingLicense) {
      return NextResponse.json(
        { error: "Ya existe una licencia para este libro en esta escuela. Actualízala en su lugar." },
        { status: 400 }
      );
    }

    // Crear la licencia
    const license = await prisma.schoolBookLicense.create({
      data: {
        schoolId,
        bookId,
        totalLicenses,
        startDate: start,
        endDate: end,
        assignedBy: user.id,
        isActive: true,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
      },
    });

    // Asignar acceso automáticamente a coordinadores y profesores de la escuela
    const schoolStaff = await prisma.user.findMany({
      where: {
        schoolId,
        deletedAt: null,
        OR: [
          { roles: { has: "COORDINATOR" } },
          { roles: { has: "TEACHER" } },
        ],
      },
      select: { id: true },
    });

    if (schoolStaff.length > 0) {
      await prisma.bookAccess.createMany({
        data: schoolStaff.map((staff) => ({
          userId: staff.id,
          bookId,
          assignedBy: user.id,
          startDate: start,
          endDate: end,
          isActive: true,
          status: "ACTIVE",
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      license,
      staffAssigned: schoolStaff.length,
      message: `Licencia creada exitosamente. ${schoolStaff.length} coordinadores/profesores tienen acceso automático.`,
    });
  } catch (error: any) {
    console.error("Error creando licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Actualizar licencia existente
export async function PATCH(
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
      select: { id: true, roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const slugOrId = params.id;

    // Find school by slug or id
    const school = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId }
        ]
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
    const body = await request.json();
    const { licenseId, totalLicenses, usedLicenses, endDate, isActive } = body;

    if (!licenseId) {
      return NextResponse.json(
        { error: "ID de licencia requerido" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (totalLicenses !== undefined) {
      if (totalLicenses < 1) {
        return NextResponse.json(
          { error: "El número de licencias debe ser al menos 1" },
          { status: 400 }
        );
      }
      updateData.totalLicenses = totalLicenses;
    }

    if (usedLicenses !== undefined) {
      if (usedLicenses < 0) {
        return NextResponse.json(
          { error: "El número de licencias usadas no puede ser negativo" },
          { status: 400 }
        );
      }
      updateData.usedLicenses = usedLicenses;
    }

    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate);
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    const license = await prisma.schoolBookLicense.update({
      where: {
        id: licenseId,
        schoolId, // Asegurar que la licencia pertenece a esta escuela
      },
      data: updateData,
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      license,
      message: "Licencia actualizada exitosamente",
    });
  } catch (error: any) {
    console.error("Error actualizando licencia:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
