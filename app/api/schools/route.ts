import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        contact: true,
        logoUrl: true,
        coordinatorId: true,
        createdAt: true,
        updatedAt: true,
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Error obteniendo escuelas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address, contact, logoUrl, coordinatorId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    if (coordinatorId) {
      const existingSchool = await prisma.school.findFirst({
        where: { coordinatorId },
      });

      if (existingSchool) {
        return NextResponse.json(
          { error: "Este coordinador ya está asignado a otra escuela" },
          { status: 400 }
        );
      }
    }

    const school = await prisma.school.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        contact: contact?.trim() || null,
        logoUrl: logoUrl || null,
        coordinatorId: coordinatorId || null,
      },
      include: {
        coordinator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ school }, { status: 201 });
  } catch (error) {
    console.error("Error creando escuela:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
