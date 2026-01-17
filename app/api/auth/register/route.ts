import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          name: name?.trim() || null,
        },
      },
    });

    if (signUpError) {
      console.error("Error en Supabase signUp:", signUpError);
      return NextResponse.json(
        { error: signUpError.message || "Error al crear la cuenta" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Error al crear usuario" },
        { status: 500 }
      );
    }

    await prisma.user.create({
      data: {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        roles: ["PUBLIC"],
        status: "INVITED",
        schoolId: null,
        createdBy: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente. Por favor, verifica tu correo electrónico para activar tu cuenta.",
      requiresVerification: true,
    });
  } catch (error: any) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
