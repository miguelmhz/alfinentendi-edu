import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MisLibrosContent } from "./mis-libros-content";

export default function MisLibrosPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <MisLibrosContent />
    </Suspense>
  );
}
