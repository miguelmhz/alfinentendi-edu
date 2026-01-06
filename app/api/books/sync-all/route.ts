import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";

// Sincronizar todos los libros desde Sanity a Prisma
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

    // Obtener todos los libros desde Sanity
    const query = `*[_type == "book"] {
      _id,
      name,
      slug,
      subject,
      grade,
      "pdfUrl": pdfFile.asset->url,
      "coverImage": coverImage.asset->url,
      isPublic,
      status
    }`;

    const sanityBooks = await client.fetch(query);

    if (!sanityBooks || sanityBooks.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "No se encontraron libros en Sanity",
      });
    }

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Sincronizar cada libro
    for (const sanityBook of sanityBooks) {
      try {
        if (!sanityBook._id || !sanityBook.name) {
          errorCount++;
          errors.push(`Libro sin ID o nombre: ${JSON.stringify(sanityBook)}`);
          continue;
        }

        await prisma.book.upsert({
          where: { sanityId: sanityBook._id },
          update: {
            title: sanityBook.name,
            subject: sanityBook.subject || null,
            pdfUrl: sanityBook.pdfUrl || "",
            isActive: sanityBook.status === "published" || sanityBook.isPublic === true,
            updatedAt: new Date(),
          },
          create: {
            sanityId: sanityBook._id,
            title: sanityBook.name,
            subject: sanityBook.subject || null,
            pdfUrl: sanityBook.pdfUrl || "",
            isActive: sanityBook.status === "published" || sanityBook.isPublic === true,
            accessType: sanityBook.isPublic ? "public" : "restricted",
          },
        });

        syncedCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`Error en libro ${sanityBook.name}: ${error.message}`);
        console.error(`Error sincronizando libro ${sanityBook._id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      errors: errorCount,
      message: `${syncedCount} libros sincronizados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ""}`,
      errorDetails: errorCount > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error sincronizando libros:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
