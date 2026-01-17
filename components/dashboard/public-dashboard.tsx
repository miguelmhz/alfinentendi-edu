"use client";

import { PromotionBanner } from "./promotion-banner";
import { AcquiredBooks } from "./acquired-books";
import { FeaturedBooks } from "./featured-books";
import { LatestBooks } from "./latest-books";

interface PublicDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function PublicDashboard({ user }: PublicDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Bienvenido, {user.name || user.email}
        </h1>
        <p className="text-muted-foreground">
          Explora nuestro catálogo y accede a tus libros adquiridos
        </p>
      </div>

      <PromotionBanner />

      <AcquiredBooks />

      <LatestBooks />

      <FeaturedBooks />
    </div>
  );
}
