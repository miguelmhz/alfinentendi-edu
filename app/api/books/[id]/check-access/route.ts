import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkBookAccess } from "@/lib/book-access";
import { NextResponse } from "next/server";

// Endpoint para verificar si un usuario tiene acceso a un libro
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado", hasAccess: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, roles: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado", hasAccess: false },
        { status: 404 }
      );
    }

    const params = await context.params;
    const bookId = params.id;

    // Admins tienen acceso a todos los libros
    if (user.roles.includes("ADMIN")) {
      return NextResponse.json({ 
        hasAccess: true,
        reason: "admin" 
      });
    }

    // Verificar acceso normal
    const hasAccess = await checkBookAccess(user.id, bookId);

    if (hasAccess) {
      return NextResponse.json({ 
        hasAccess: true,
        reason: "active_access" 
      });
    }

    // Verificar si el libro es público
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { accessType: true },
    });

    if (book?.accessType === "public") {
      return NextResponse.json({ 
        hasAccess: true,
        reason: "public_book" 
      });
    }

    return NextResponse.json({ 
      hasAccess: false,
      reason: "no_access" 
    });
  } catch (error) {
    console.error("Error verificando acceso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", hasAccess: false },
      { status: 500 }
    );
  }
}
