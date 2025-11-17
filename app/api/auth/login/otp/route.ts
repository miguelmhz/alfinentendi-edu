import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validar que el email esté presente
    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe en Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        roles: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email no encontrado en el sistema" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga el rol apropiado para este tipo de login
    // El login con OTP es para STUDENT y ADMIN
    const allowedRoles = ["STUDENT", "ADMIN"];
    const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));

    if (!hasAllowedRole) {
      return NextResponse.json(
        { error: "Este método de autenticación es solo para estudiantes y administradores" },
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

    // Crear cliente de Supabase para enviar el OTP
    const supabase = await createClient();

    // Enviar OTP/Magic Link
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Personalizar la URL de redirección
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (otpError) {
      console.error("Error enviando OTP:", otpError);
      return NextResponse.json(
        { error: otpError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Se ha enviado un enlace de acceso a tu correo electrónico",
      email: email,
    });
  } catch (error) {
    console.error("Error en login con OTP:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
