"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BookPurchaseButtonProps {
  bookSlug: string;
  price?: number;
  subscriptionPlan?: "monthly" | "quarterly" | "annual" | "lifetime";
  couponCode?: string;
  isFree?: boolean;
}

export function BookPurchaseButton({
  bookSlug,
  price,
  subscriptionPlan = "lifetime",
  couponCode,
  isFree = false,
}: BookPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      // Si es gratis, usar endpoint diferente
      const endpoint = isFree || price === 0 ? "/api/books/claim-free" : "/api/checkout";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookSlug,
          subscriptionPlan,
          couponCode: couponCode || "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Error al procesar la compra");
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Si es gratis, mostrar mensaje de éxito y redirigir a la vista del libro
      if (isFree || price === 0) {
        toast.success(data.message || "¡Libro obtenido exitosamente!");
        setTimeout(() => {
          window.location.href = `/libros/${bookSlug}/vista`;
        }, 1000);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Error al crear la sesión de pago");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la compra");
      setLoading(false);
    }
  };

  const buttonText = isFree || price === 0 ? "Obtener Gratis" : `Adquirir ${price ? `$${price.toFixed(2)}` : ""}`;

  return (
    <Button onClick={handlePurchase} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}
