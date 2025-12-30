import { createClient } from "@/lib/supabase/server";
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

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const temporaryPassword = generateTemporaryPassword();

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    );

    if (updateError) {
      throw new Error(updateError.message);
    }

    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: targetUser.email,
        name: targetUser.name,
        temporaryPassword,
        isResend: true,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Error al enviar email de invitación");
      return NextResponse.json(
        { error: "Usuario actualizado pero no se pudo enviar el email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Invitación reenviada exitosamente" 
    });
  } catch (error: any) {
    console.error("Error reenviando invitación:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
