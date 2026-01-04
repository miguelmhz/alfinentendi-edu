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

    if (!user?.roles.some(role => ["ADMIN", "COORDINATOR"].includes(role))) {
      return NextResponse.json(
        { error: "No tienes permisos para asignar libros" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookSanityId, assignedToType, assignedToId, endDate } = body;

    if (!bookSanityId || !assignedToType || !assignedToId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const validTypes = ["school", "grade", "group", "teacher", "student"];
    if (!validTypes.includes(assignedToType)) {
      return NextResponse.json(
        { error: "Tipo de asignación inválido" },
        { status: 400 }
      );
    }

    const assignment = await prisma.bookAssignment.create({
      data: {
        bookSanityId,
        assignedToType,
        assignedToId,
        assignedBy: user.id,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creando asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
      select: { id: true, roles: true, schoolId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookSanityId = searchParams.get("bookSanityId");
    const assignedToType = searchParams.get("assignedToType");
    const assignedToId = searchParams.get("assignedToId");

    const where: any = { isActive: true };

    if (bookSanityId) where.bookSanityId = bookSanityId;
    if (assignedToType) where.assignedToType = assignedToType;
    if (assignedToId) where.assignedToId = assignedToId;

    const assignments = await prisma.bookAssignment.findMany({
      where,
      include: {
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

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error obteniendo asignaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
