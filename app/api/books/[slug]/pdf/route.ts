import { client } from "@/lib/sanity/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full';

    console.log('[PDF API] Request for slug:', slug, 'type:', type);

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
      console.error('[PDF API] Book not found:', slug);
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Determinar qué archivo usar
    const fileUrl = type === 'preview' 
      ? book.preview?.asset?.url 
      : book.file?.asset?.url;

    console.log('[PDF API] File URL from Sanity:', fileUrl);

    if (!fileUrl) {
      console.error('[PDF API] PDF file not available');
      return NextResponse.json(
        { error: "PDF file not available" },
        { status: 404 }
      );
    }

    // Fetch del PDF desde Sanity CDN
    console.log('[PDF API] Fetching PDF from CDN...');
    const pdfResponse = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!pdfResponse.ok) {
      console.error('[PDF API] Failed to fetch from CDN:', pdfResponse.status, pdfResponse.statusText);
      return NextResponse.json(
        { error: "Failed to fetch PDF from CDN", status: pdfResponse.status },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log('[PDF API] PDF fetched successfully, size:', pdfBuffer.byteLength, 'bytes');

    // Retornar el PDF con los headers correctos
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${encodeURIComponent(book.name)}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
      },
    });
  } catch (error) {
    console.error("[PDF API] Error serving PDF:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
