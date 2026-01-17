import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const author = searchParams.get("author");
    const format = searchParams.get("format");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isPublic = searchParams.get("isPublic");

    // Construir filtros dinámicos para Sanity
    let filters = [];
    
    if (category) {
      filters.push(`"${category}" in categories[]->slug.current`);
    }
    
    if (author) {
      filters.push(`"${author}" in authors[]->slug.current`);
    }
    
    if (format) {
      filters.push(`format == "${format}"`);
    }
    
    if (status) {
      filters.push(`status == "${status}"`);
    }
    
    if (search) {
      filters.push(`(name match "${search}*" || description match "${search}*")`);
    }

    if (isPublic === "true") {
      filters.push(`isPublic == true`);
    }

    const filterString = filters.length > 0 ? ` && ${filters.join(" && ")}` : "";

    const query = `*[_type == "book"${filterString}] | order(publishedDate desc) {
      _id,
      name,
      slug,
      description,
      "authors": authors[]->{ name, slug },
      "categories": categories[]->{ title, slug },
      coverImage {
        asset-> {
          _id,
          url
        }
      },
      isbn,
      publishedDate,
      pages,
      format,
      status,
      price,
      purchaseLink,
      isPublic
    }`;

    const books = await client.fetch(query);

    // Si el usuario está autenticado, agregar información de acceso
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      // Aquí podrías agregar lógica para marcar qué libros tiene asignados el usuario
      // Por ahora solo retornamos los libros
    }

    return NextResponse.json({ books, total: books.length });
  } catch (error) {
    console.error("Error obteniendo libros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
