"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export function LoginMagicLink({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el enlace");
      }

      // Mostrar mensaje de éxito al usuario
      toast.success(data.message || "Se ha enviado un enlace de acceso a tu correo electrónico");

      // No redirigir inmediatamente, el usuario necesita hacer clic en el enlace del email
    } catch (error: unknown) {
      console.log("error de catch", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full border-none shadow-none">
        <CardHeader className="px-0 pt-0 pb-6">
          <CardTitle className="text-2xl">Acceso Escuela</CardTitle>
          <CardDescription>
            <b>Ingresa tu correo electrónico institucional para recibir un enlace de acceso.</b> 
            <br />
Revisa tu bandeja de entrada y sigue las instrucciones. Si no lo ves, consulta correo no deseado.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label className="text-base" htmlFor="email">Correo Electrónico Institucional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@escuela.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button size="lg" type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando enlace..." : "Enviar enlace de acceso"}
              </Button>
              
              <div className="border-t pt-4 mt-2">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  ¿Tu institución aún no tiene acceso?
                </p>
                <a
                  href="mailto:alfinentendi@gmail.com?subject=Solicitud de acceso institucional"
                  className="block text-center"
                >
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Contactar con ventas
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Escríbenos a{" "}
                  <a
                    href="mailto:alfinentendi@gmail.com"
                    className="underline hover:text-primary"
                  >
                    alfinentendi@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
