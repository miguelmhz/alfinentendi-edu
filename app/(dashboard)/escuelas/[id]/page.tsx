"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Edit,
  Users,
  BookOpen,
  CreditCard,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { SchoolDialog } from "@/components/schools/school-dialog";

interface School {
  id: string;
  name: string;
  address: string | null;
  contact: string | null;
  logoUrl: string | null;
  coordinatorId: string | null;
  coordinator?: {
    id: string;
    name: string | null;
    email: string;
    lastLogin: string | null;
  } | null;
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    roles: string[];
    status: string;
  }>;
  grades: Array<{
    id: string;
    name: string;
    level: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

type TabType = "users" | "books" | "subscription" | "grades";

export default function SchoolProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && isAdmin && params.id) {
      fetchSchool();
    }
  }, [authLoading, isAdmin, params.id]);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schools/${params.id}`);
      if (!response.ok) throw new Error("Error al cargar escuela");
      const data = await response.json();
      setSchool(data.school);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchSchool();
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      COORDINATOR: "Coordinador",
      TEACHER: "Profesor",
      STUDENT: "Estudiante",
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      ACTIVE: "default",
      INVITED: "secondary",
      INACTIVE: "outline",
    };
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      INVITED: "Invitado",
      INACTIVE: "Inactivo",
    };
    return {
      variant: variants[status] || "outline",
      label: labels[status] || status,
    };
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-[200px]" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px] md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página
        </p>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Escuela no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex felx-row justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/escuelas")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex gap-4">
            {school.logoUrl ? (
              <div className="flex justify-center rounded-full overflow-hidden">
                <img
                  src={school.logoUrl}
                  alt={`Logo de ${school.name}`}
                  className="w-12 h-12 object-cover rounded-full"
                />
              </div>
            ) : (
              <Avatar className="size-12">
                <AvatarFallback>
                  {getInitials(school.name, school.name)}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">
                {school.name}
              </h1>
              <p className="text-muted-foreground">Perfil de la escuela</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

      </div>
      {/* Custom Tab Navigation */}
      <div className="bg-white border-b border-gray-200 w-full -mx-6 px-6">
        <div className="flex gap-2">
          <TabButton
            icon={<Users className="w-5 h-5" />}
            label="Usuarios"
            isActive={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <TabButton
            icon={<GraduationCap className="w-5 h-5" />}
            label="Grados"
            isActive={activeTab === "grades"}
            onClick={() => setActiveTab("grades")}
          />
          <TabButton
            icon={<BookOpen className="w-5 h-5" />}
            label="Libros Asignados"
            isActive={activeTab === "books"}
            onClick={() => setActiveTab("books")}
          />
          <TabButton
            icon={<CreditCard className="w-5 h-5" />}
            label="Suscripción"
            isActive={activeTab === "subscription"}
            onClick={() => setActiveTab("subscription")}
          />
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Usuarios de la Escuela</CardTitle>
              <CardDescription>
                {school.users.length} usuario
                {school.users.length !== 1 ? "s" : ""} registrado
                {school.users.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {school.users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay usuarios registrados en esta escuela</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {school.users.map((user) => {
                    const statusBadge = getStatusBadge(user.status);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.name || "Sin nombre"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className="text-xs"
                              >
                                {getRoleLabel(role)}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "grades" && (
          <Card>
            <CardHeader>
              <CardTitle>Grados Escolares</CardTitle>
              <CardDescription>
                Gestiona los grados y grupos de la escuela
              </CardDescription>
            </CardHeader>
            <CardContent>
              {school.grades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No hay grados registrados</p>
                  <Button variant="outline">Agregar grado</Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {school.grades.map((grade) => (
                    <Card key={grade.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{grade.name}</CardTitle>
                        {grade.level && (
                          <CardDescription>{grade.level}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "books" && (
          <Card>
            <CardHeader>
              <CardTitle>Libros Asignados</CardTitle>
              <CardDescription>
                Gestiona los libros disponibles para esta escuela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Funcionalidad de asignación de libros</p>
                <Button variant="outline">Asignar libros</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "subscription" && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de Suscripción</CardTitle>
              <CardDescription>
                Gestiona el acceso y suscripción de la escuela
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">
                  Funcionalidad de gestión de suscripciones
                </p>
                <Button variant="outline">Gestionar suscripción</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <SchoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        school={school}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 transition-all duration-200 relative
        ${
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-primary hover:bg-muted/50"
        }
      `}
    >
      <span className={isActive ? "text-primary" : "text-muted-foreground"}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>

      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
      )}
    </button>
  );
}
