import { client } from "@/lib/sanity/client";
import { notFound } from "next/navigation";
import { ViewerSchemaPage } from "@/components/pdf-viewer/PDFViewer";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: 'preview' | 'full' }>;
}

export default async function BookViewerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { type = 'full' } = await searchParams;

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

  if (!book) {
    notFound();
  }

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
    <div className="h-screen w-full">
      <ViewerSchemaPage pdfUrl={pdfUrl} bookTitle={book.name} />
    </div>
  );
}
