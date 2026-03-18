"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError("Enlace de recuperación inválido o expirado.");
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type !== "recovery" || !accessToken || !refreshToken) {
      setError("Enlace de recuperación inválido o expirado.");
      return;
    }

    const supabase = createClient();
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setError("El enlace de recuperación ha expirado. Solicita uno nuevo.");
        } else {
          // Limpiar el hash de la URL sin recargar
          window.history.replaceState(null, "", window.location.pathname);
          setIsReady(true);
        }
      });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada exitosamente");
      router.push("/auth/login");
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
      <Card className="w-full border-none shadow-none">
        <CardHeader className="px-0 pt-0 pb-6">
          <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
          <CardDescription>
            Elige una contraseña segura para proteger tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {!isReady && !error ? (
            <p className="text-sm text-muted-foreground">Verificando enlace...</p>
          ) : error ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-red-500">{error}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/forgot-password")}
              >
                Solicitar nuevo enlace
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor="password">
                    Nueva contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="**********"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor="confirm-password">
                    Confirmar contraseña
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="**********"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button
                  size="lg"
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
