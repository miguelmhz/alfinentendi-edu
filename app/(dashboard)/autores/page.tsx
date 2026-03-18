import { client } from "@/lib/sanity/client";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

const query = `*[_type == "author"] | order(name asc) {
  _id,
  name,
  slug,
  bio,
  image {
    asset-> {
      _id,
      url
    }
  },
  "bookCount": count(*[_type == "book" && references(^._id)])
}`;

export default async function AutoresPage() {
  const authors = await client.fetch(query);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Autores</h1>
        <p className="text-muted-foreground mt-1">
          {authors.length} {authors.length === 1 ? "autor" : "autores"} en el catálogo
        </p>
      </div>

      {authors.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>No hay autores registrados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {authors.map((author: any) => (
            <Link
              key={author._id}
              href={`/autores/${author.slug?.current}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all group"
            >
              {/* Foto o inicial */}
              <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden relative border border-gray-100 bg-gray-100">
                {author.image?.asset?.url ? (
                  <Image
                    src={author.image.asset.url}
                    alt={author.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-400">
                      {author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium group-hover:underline underline-offset-2 truncate">
                  {author.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {author.bookCount}{" "}
                  {author.bookCount === 1 ? "libro" : "libros"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
