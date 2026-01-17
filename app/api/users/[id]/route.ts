import { createClient, createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      id: user.id,
      name: user.name || user.email,
    });
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = params.id;

    const body = await request.json();
    const { name, roles, status, schoolId } = body;

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar al menos un rol" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name?.trim() || null,
        roles: roles,
        status: status || "INVITED",
        schoolId: schoolId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error actualizando usuario:", error);
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

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const params = await context.params;
    const userId = params.id;
    
    const body = await request.json().catch(() => ({}));
    const { restore } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Soft delete o restaurar
    if (restore) {
      // Restaurar usuario
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: null },
      });
      return NextResponse.json({ success: true, message: "Usuario restaurado" });
    } else {
      // Soft delete
      await prisma.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: "Usuario eliminado" });
    }
  } catch (error) {
    console.error("Error eliminando/restaurando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
