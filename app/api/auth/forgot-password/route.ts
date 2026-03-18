import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import ResetPasswordEmail from "@/emails/reset-password";
import { createAdminClient } from "@/lib/supabase/server";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/update-password`,
      },
    });

    if (error) {
      // No revelar si el email existe o no
      console.error("Error generando link de recuperación:", error);
      return NextResponse.json({ success: true });
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      return NextResponse.json({ success: true });
    }

    const emailHtml = await render(ResetPasswordEmail({ resetLink }));

    await transporter.sendMail({
      from: `"Al Fin Entendí EDU" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "Restablecer contraseña – Al Fin Entendí EDU",
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en forgot-password:", error);
    // Siempre responder con éxito para no revelar si el email existe
    return NextResponse.json({ success: true });
  }
}
