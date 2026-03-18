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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Error al enviar el correo de recuperación");
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Ocurrió un error inesperado"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="w-full border-none shadow-none">
          <CardHeader className="px-0 pt-0 pb-6">
            <CardTitle className="text-2xl">Revisa tu correo</CardTitle>
            <CardDescription>
              Instrucciones de recuperación enviadas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className="text-sm text-muted-foreground">
              Si tu correo está registrado, recibirás un enlace para restablecer
              tu contraseña. Revisa también tu carpeta de spam.
            </p>
            <div className="mt-6 text-center text-sm">
              <Link
                href="/auth/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full border-none shadow-none">
          <CardHeader className="px-0 pt-0 pb-6">
            <CardTitle className="text-2xl">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor="email">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button size="lg" type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
                <div className="text-center text-sm">
                  ¿Recordaste tu contraseña?{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Inicia sesión
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
