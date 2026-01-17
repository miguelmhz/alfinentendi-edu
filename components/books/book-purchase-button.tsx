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
}

export function BookPurchaseButton({
  bookSlug,
  price,
  subscriptionPlan = "lifetime",
  couponCode,
}: BookPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
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

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
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
          Adquirir {price ? `$${price.toFixed(2)}` : ""}
        </>
      )}
    </Button>
  );
}
