import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Obtener el usuario autenticado de Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        // Obtener el perfil completo del usuario desde Prisma
        const user = await prisma.user.findUnique({
          where: { email: authUser.email! },
          select: {
            id: true,
            roles: true,
            status: true,
          },
        });

        if (!user) {
          const provider = authUser.app_metadata?.provider;

          if (provider === "google") {
            await prisma.user.create({
              data: {
                email: authUser.email!,
                name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
                roles: ["PUBLIC"],
                status: "ACTIVE",
                lastLogin: new Date(),
              },
            });
            return NextResponse.redirect(`${origin}/`);
          }

          // Si el usuario no existe en Prisma, cerrar sesión y redirigir
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/auth/login?error=user_not_found`);
        }

        // Si el usuario es PUBLIC y está en estado INVITED, activarlo automáticamente
        // (esto ocurre cuando verifica su email después del registro)
        if (user.roles.includes("PUBLIC") && user.status === "INVITED") {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: "ACTIVE" },
          });
        } else if (user.status !== "ACTIVE") {
          // Para otros roles, verificar que el usuario esté activo
          await supabase.auth.signOut();
          let errorParam = "inactive";
          if (user.status === "INVITED") {
            errorParam = "pending_activation";
          } else if (user.status === "SUSPENDED") {
            errorParam = "suspended";
          }
          return NextResponse.redirect(`${origin}/auth/login?error=${errorParam}`);
        }

        // Actualizar el último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Google OAuth es para acceso individual — siempre redirigir a /
        if (authUser.app_metadata?.provider === "google") {
          return NextResponse.redirect(`${origin}/`);
        }

        // Redirigir según el rol principal
        // Nota: Como roles es un array, tomamos el primer rol o el más específico
        if (user.roles.includes("ADMIN")) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else if (user.roles.includes("COORDINATOR")) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else if (user.roles.includes("TEACHER")) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else if (user.roles.includes("STUDENT")) {
          return NextResponse.redirect(`${origin}/dashboard`);
        } else if (user.roles.includes("PUBLIC")) {
          return NextResponse.redirect(`${origin}/`);
        }
      }

      // Redirigir a la página siguiente por defecto
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si hay un error, redirigir a la página de login con un mensaje de error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
