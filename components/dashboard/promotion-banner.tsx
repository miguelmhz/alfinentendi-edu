"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Promotion {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  discount?: number;
}

export function PromotionBanner() {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchActivePromotion();
  }, []);

  const fetchActivePromotion = async () => {
    try {
      const response = await fetch("/api/promotions/active");
      if (response.ok) {
        const data = await response.json();
        if (data.promotion) {
          setPromotion(data.promotion);
        }
      }
    } catch (error) {
      console.error("Error fetching promotion:", error);
    }
  };

  if (!promotion || dismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20">
      {promotion.imageUrl && (
        <div className="absolute inset-0 opacity-10">
          <img
            src={promotion.imageUrl}
            alt={promotion.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="relative p-6 md:p-8">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {promotion.title}
            {promotion.discount && (
              <span className="ml-3 text-primary">
                {promotion.discount}% OFF
              </span>
            )}
          </h2>
          
          {promotion.description && (
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              {promotion.description}
            </p>
          )}

          {promotion.ctaText && promotion.ctaLink && (
            <Button asChild size="lg">
              <Link href={promotion.ctaLink}>
                {promotion.ctaText}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
