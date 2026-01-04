import { BookOpen } from "lucide-react";

interface BookCoverFallbackProps {
  title: string;
  className?: string;
}

export function BookCoverFallback({ title, className = "" }: BookCoverFallbackProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white ${className}`}
    >
      <div className="absolute inset-0 bg-black/10" />
      <BookOpen className="w-12 h-12 mb-3 relative z-10" strokeWidth={1.5} />
      <p className="text-sm font-medium text-center px-4 relative z-10 line-clamp-3">
        {title}
      </p>
    </div>
  );
}
