import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      select: { id: true, roles: true },
    });

    if (!user?.roles.some(role => ["ADMIN", "COORDINATOR"].includes(role))) {
      return NextResponse.json(
        { error: "No tienes permisos para modificar asignaciones" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const assignmentId = params.id;

    const body = await request.json();
    const { endDate, isActive } = body;

    const assignment = await prisma.bookAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        assigner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error actualizando asignación:", error);
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

    if (!user?.roles.some(role => ["ADMIN", "COORDINATOR"].includes(role))) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar asignaciones" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const assignmentId = params.id;

    await prisma.bookAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
