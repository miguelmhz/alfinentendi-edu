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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LoginPassword({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      console.log('fetch a /api/auth/login/password', response);
      console.log("response", response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      router.push("/");
      router.refresh();
    } catch (error: unknown) {
      console.log("error catch", error);
      console.log(error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la cuenta");
      }

      toast.success(data.message || "Cuenta creada exitosamente. Por favor, verifica tu correo electrónico.");
      setMode("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
    } catch (error: unknown) {
      console.log("error catch", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-full border-none shadow-none">
        <CardHeader className="px-0 pt-0 pb-6">
          <CardTitle className="text-2xl">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Ingresa tu usuario y contraseña para acceder a tu cuenta."
              : "Ingresa tus datos para crear tu cuenta individual."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
            <div className="flex flex-col gap-6">
              {mode === "register" && (
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label className="text-base" htmlFor="email-form-password">
                  {mode === "login" ? "Correo Electrónico Institucional" : "Correo Electrónico"}
                </Label>
                <Input
                  id="email-form-password"
                  type="email"
                  placeholder="ejemplo@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label className="text-base" htmlFor="password-form-password">Contraseña</Label>
                  {mode === "login" && (
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  )}
                </div>
                <Input
                  id="password-form-password"
                  type="password"
                  required
                  value={password}
                  placeholder="**********"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {mode === "register" && (
                <div className="grid gap-2">
                  <Label className="text-base" htmlFor="confirm-password">Confirmar Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    placeholder="**********"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button size='lg' type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? mode === "login" ? "Iniciando sesión..." : "Creando cuenta..."
                  : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
              <div className="text-center text-sm">
                {mode === "login" ? (
                  <>
                    ¿No tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Regístrate aquí
                    </button>
                  </>
                ) : (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="underline underline-offset-4 hover:text-primary"
                    >
                      Inicia sesión
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
