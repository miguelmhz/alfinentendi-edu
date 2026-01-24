import { client } from "@/lib/sanity/client";
import { notFound, redirect } from "next/navigation";
import { ViewerSchemaPage } from "@/components/pdf-viewer/PDFViewer";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: 'preview' | 'full' }>;
}

export default async function BookViewerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { type = 'full' } = await searchParams;

  // Obtener usuario autenticado
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  // Verificar que el usuario esté autenticado
  if (!authUser) {
    redirect('/auth/login');
  }

  // Obtener datos completos del usuario desde Prisma
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true, name: true, roles: true },
  });

  if (!user) {
    redirect('/auth/login');
  }

  const userName = user.name || authUser.email || "Usuario";

  // Obtener libro desde Sanity
  const query = `*[_type == "book" && slug.current == $slug][0] {
    _id,
    name,
    file {
      asset-> {
        _id,
        url
      }
    },
    preview {
      asset-> {
        _id,
        url
      }
    }
  }`;

  const book = await client.fetch(query, { slug });
  console.log("Book loaded:", {book});

  if (!book) {
    notFound();
  }

  // Verificar acceso del usuario al libro
  const isTeacher = user.roles.some(role => 
    ["TEACHER", "COORDINATOR", "ADMIN"].includes(role)
  );

  // Get the Prisma book ID from the database
  let prismaBook = await prisma.book.findUnique({
    where: { sanityId: book._id },
    select: { id: true }
  });

  if (!prismaBook) {
    console.log("Book not found in Prisma database, attempting to sync:", book._id);
    
    try {
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/books/sync-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sanityId: book._id }),
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        prismaBook = { id: syncData.book.id };
        console.log("Book synced successfully:", syncData.book.id);
      } else {
        console.error("Failed to sync book:", await syncResponse.text());
        notFound();
      }
    } catch (error) {
      console.error("Error syncing book:", error);
      notFound();
    }
  }

  if (!prismaBook) {
    console.error("Book not found in Prisma database after sync attempt:", book._id);
    notFound();
  }

  // Verificar acceso solo si se solicita el libro completo (no para preview)
  if (type === 'full') {
    const now = new Date();
    const bookAccess = await prisma.bookAccess.findFirst({
      where: {
        userId: user.id,
        bookId: prismaBook.id,
        isActive: true,
        status: "ACTIVE",
        endDate: { gte: now },
      },
    });

    // Permitir acceso si:
    // - El libro es público
    // - El usuario tiene acceso activo (BookAccess)
    // - El usuario es profesor/coordinador/admin
    const hasAccess = book.isPublic || !!bookAccess || isTeacher;

    if (!hasAccess) {
      console.log("Access denied for user:", user.id, "to book:", prismaBook.id);
      redirect(`/libros/${slug}`);
    }
  }
  // Para type=preview, permitir acceso a todos los usuarios autenticados

  // Verificar que el archivo existe
  const hasFile = type === 'preview' 
    ? book.preview?.asset?.url 
    : book.file?.asset?.url;

  if (!hasFile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Archivo no disponible</h2>
          <p className="text-gray-600">
            {type === 'preview' 
              ? 'Este libro no tiene una vista previa disponible.' 
              : 'Este libro no tiene un archivo disponible.'}
          </p>
        </div>
      </div>
    );
  }

  // Usar la ruta API proxy para servir el PDF (evita problemas de CORS)
  const pdfUrl = `/api/books/${slug}/pdf${type === 'preview' ? '?type=preview' : ''}`;

  return (
    <ViewerSchemaPage 
      pdfUrl={pdfUrl} 
      bookTitle={book.name} 
      userName={userName}
      bookId={prismaBook.id}
      bookSanityId={book._id}
      userId={user.id}
    />
  );
}
