"use client";

import { useEffect, useState } from "react";
import { User } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/user");

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error("Error al obtener usuario");
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }

      setUser(null);
      window.location.href = "/auth/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const isCoordinator = user?.roles.includes("COORDINATOR") ?? false;
  const isTeacher = user?.roles.includes("TEACHER") ?? false;
  const isStudent = user?.roles.includes("STUDENT") ?? false;
  const isAuthenticated = !!user;

  // Helper para verificar si el usuario tiene al menos uno de los roles especificados
  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return user.roles.some(role => roles.includes(role));
  };

  return {
    user,
    loading,
    error,
    isAdmin,
    isCoordinator,
    isTeacher,
    isStudent,
    isAuthenticated,
    hasRole,
    logout,
    refetch: fetchUser,
  };
}
