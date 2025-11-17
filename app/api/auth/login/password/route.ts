import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validar que los campos requeridos estén presentes
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Crear cliente de Supabase para la autenticación
    const supabase = await createClient();

    // Intentar iniciar sesión con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("authData", authData);
    console.log("authError", authError);

    if (authError) {
      // Personalizar mensajes de error
      if (authError.message.includes("Invalid login credentials")) {
        return NextResponse.json(
          { error: "Credenciales inválidas" },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    // Obtener información del usuario desde Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        status: true,
        schoolId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.error("Usuario no encontrado en Prisma");
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga el rol apropiado para este tipo de login
    // El login con contraseña es para TEACHER, COORDINATOR y ADMIN
    const allowedRoles = ["TEACHER", "COORDINATOR", "ADMIN"];
    const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      return NextResponse.json(
        { error: "Este método de autenticación es solo para profesores, coordinadores y administradores" },
        { status: 403 }
      );
    }

    // Verificar el status del usuario
    if (user.status !== "ACTIVE") {
      let errorMessage = "Tu cuenta no está activa. Contacta al administrador.";
      if (user.status === "INVITED") {
        errorMessage = "Tu cuenta aún no ha sido activada. Por favor, completa el proceso de registro.";
      } else if (user.status === "SUSPENDED") {
        errorMessage = "Tu cuenta ha sido suspendida. Contacta al administrador.";
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }

    // Actualizar el último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
        status: user.status,
        schoolId: user.schoolId,
        lastLogin: user.lastLogin,
      },
      session: authData.session,
    });
  } catch (error) {
    console.error("Error en login con contraseña:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
