import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Obtener accesos a libros
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

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, roles: true },
    });

    if (!user?.roles.includes("ADMIN") && !user?.roles.includes("COORDINATOR")) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");
    const userId = searchParams.get("userId");
    const schoolId = searchParams.get("schoolId");
    const status = searchParams.get("status");

    const where: any = {};
    
    if (bookId) where.bookId = bookId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    
    if (schoolId) {
      where.user = {
        schoolId: schoolId,
      };
    }

    const accesses = await prisma.bookAccess.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            school: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            subject: true,
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

    return NextResponse.json({ accesses });
  } catch (error) {
    console.error("Error obteniendo accesos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Crear accesos a libros (asignación manual)
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
      select: { id: true, roles: true },
    });

    if (!user?.roles.includes("ADMIN") && !user?.roles.includes("COORDINATOR")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      bookId, 
      assignmentType, // "individual", "school", "grade", "group"
      targetId, // userId, schoolId, gradeId, or groupId
      startDate,
      endDate,
      userIds, // Para asignación individual múltiple
    } = body;

    if (!bookId || !assignmentType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
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

    let usersToAssign: string[] = [];

    // Determinar usuarios según el tipo de asignación
    switch (assignmentType) {
      case "individual":
        if (userIds && Array.isArray(userIds)) {
          usersToAssign = userIds;
        } else if (targetId) {
          usersToAssign = [targetId];
        }
        break;

      case "school":
        const schoolUsers = await prisma.user.findMany({
          where: { 
            schoolId: targetId,
            deletedAt: null, // Solo usuarios activos
          },
          select: { id: true, roles: true },
        });
        usersToAssign = schoolUsers.map(u => u.id);
        break;

      case "grade":
        const gradeUsers = await prisma.user.findMany({
          where: {
            groups: {
              some: {
                gradeId: targetId,
              },
            },
            deletedAt: null,
          },
          select: { id: true },
        });
        usersToAssign = gradeUsers.map(u => u.id);
        break;

      case "group":
        const groupUsers = await prisma.user.findMany({
          where: {
            groups: {
              some: {
                id: targetId,
              },
            },
            deletedAt: null,
          },
          select: { id: true },
        });
        usersToAssign = groupUsers.map(u => u.id);
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de asignación inválido" },
          { status: 400 }
        );
    }

    if (usersToAssign.length === 0) {
      let errorMessage = "No se encontraron usuarios para asignar";
      
      if (assignmentType === "school") {
        errorMessage = `No se encontraron usuarios activos en la escuela seleccionada`;
      } else if (assignmentType === "grade") {
        errorMessage = `No se encontraron usuarios en el grado seleccionado`;
      } else if (assignmentType === "group") {
        errorMessage = `No se encontraron usuarios en el grupo seleccionado`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Crear accesos en batch
    const accesses = await prisma.bookAccess.createMany({
      data: usersToAssign.map(userId => ({
        userId,
        bookId,
        assignedBy: user.id,
        startDate: start,
        endDate: end,
        isActive: true,
        status: "ACTIVE",
        groupId: assignmentType === "group" ? targetId : null,
        gradeId: assignmentType === "grade" ? targetId : null,
      })),
      skipDuplicates: true, // Evita errores si ya existe
    });

    return NextResponse.json({ 
      success: true,
      count: accesses.count,
      message: `Acceso asignado a ${accesses.count} usuario(s)` 
    });
  } catch (error) {
    console.error("Error creando accesos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
