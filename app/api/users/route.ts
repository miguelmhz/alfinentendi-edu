import { createClient, createAdminClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
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
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para acceder a este recurso" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const whereClause = role
      ? { roles: { has: role as any } }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
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
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
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
      select: { id: true, roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, name, roles, status, schoolId } = body;

    if (!email || email.trim() === "") {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json(
        { error: "Debe seleccionar al menos un rol" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();

    const adminClient = createAdminClient();
    const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        name: name?.trim() || null,
      },
    });

    if (createError || !authData.user) {
      throw new Error(createError?.message || "Error al crear usuario en Supabase");
    }

    const newUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: email.trim(),
        name: name?.trim() || null,
        roles: roles,
        status: status || "INVITED",
        schoolId: schoolId || null,
        createdBy: user.id,
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

    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: newUser.email,
        name: newUser.name,
        temporaryPassword,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Error al enviar email de invitación");
    }

    return NextResponse.json({ user: newUser, temporaryPassword }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
