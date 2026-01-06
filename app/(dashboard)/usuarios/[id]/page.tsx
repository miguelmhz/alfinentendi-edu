"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  School,
  BookOpen,
  Users,
  Edit,
  Clock,
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
import { UserDialog } from "@/components/users/user-dialog";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  status: string;
  schoolId: string | null;
  school?: {
    id: string;
    name: string;
  } | null;
  groups?: {
    id: string;
    name: string;
    grade: {
      name: string;
      level: string | null;
    };
  }[];
  bookAccesses?: {
    id: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    status: string;
    book: {
      id: string;
      title: string;
      pdfUrl: string;
      subject: string | null;
    };
  }[];
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

type TabType = "info" | "books" | "groups";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isOwnProfile = currentUser?.id === params.id;
  const canEdit = isAdmin || isOwnProfile;

  useEffect(() => {
    if (!authLoading && currentUser && params.id) {
      fetchUserProfile();
    }
  }, [authLoading, currentUser, params.id]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${params.id}/profile`);
      if (!response.ok) throw new Error("Error al cargar perfil");
      const data = await response.json();
      setUserProfile(data.user);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchUserProfile();
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

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      ADMIN: "destructive",
      COORDINATOR: "default",
      TEACHER: "secondary",
      STUDENT: "outline",
    };
    return variants[role] || "outline";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const statusBadge = getStatusBadge(userProfile.status);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/usuarios")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {getInitials(userProfile.name, userProfile.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {userProfile.name || "Sin nombre"}
              </h1>
              <p className="text-muted-foreground">{userProfile.email}</p>
            </div>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        )}
      </div>

      {/* Custom Tab Navigation */}
      <div className="bg-white border-b border-gray-200 w-full -mx-6 px-6">
        <div className="flex gap-2">
          <TabButton
            icon={<Shield className="w-5 h-5" />}
            label="Información"
            isActive={activeTab === "info"}
            onClick={() => setActiveTab("info")}
          />
          <TabButton
            icon={<BookOpen className="w-5 h-5" />}
            label="Libros Asignados"
            isActive={activeTab === "books"}
            onClick={() => setActiveTab("books")}
          />
          {userProfile.roles.includes("TEACHER") && (
            <TabButton
              icon={<Users className="w-5 h-5" />}
              label="Grupos"
              isActive={activeTab === "groups"}
              onClick={() => setActiveTab("groups")}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === "info" && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Roles</p>
                    <div className="flex gap-1 mt-1">
                      {userProfile.roles.map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant(role)}
                        >
                          {getRoleLabel(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <Badge variant={statusBadge.variant} className="mt-1">
                      {statusBadge.label}
                    </Badge>
                  </div>
                </div>

                {userProfile.school && (
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Escuela</p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile.school.name}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Último acceso</p>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.lastLogin
                        ? formatDate(userProfile.lastLogin)
                        : "Nunca"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Fecha de registro</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(userProfile.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "books" && (
          <Card>
            <CardHeader>
              <CardTitle>Libros Asignados</CardTitle>
              <CardDescription>
                Libros a los que tiene acceso este usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!userProfile.bookAccesses || userProfile.bookAccesses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tiene libros asignados</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userProfile.bookAccesses.map((access) => (
                    <div
                      key={access.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <BookOpen className="w-10 h-10 text-primary" />
                        <div className="flex-1">
                          <h3 className="font-medium">{access.book.title}</h3>
                          {access.book.subject && (
                            <p className="text-xs text-muted-foreground">{access.book.subject}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Inicio: {formatDate(access.startDate)}</p>
                        <p>Expira: {formatDate(access.endDate)}</p>
                        <Badge 
                          variant={access.isActive && access.status === "ACTIVE" ? "default" : "secondary"}
                          className="mt-2"
                        >
                          {access.status === "ACTIVE" ? "Activo" : access.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "groups" && userProfile.roles.includes("TEACHER") && (
          <Card>
            <CardHeader>
              <CardTitle>Grupos Asignados</CardTitle>
              <CardDescription>
                Grupos donde este profesor imparte clases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!userProfile.groups || userProfile.groups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tiene grupos asignados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userProfile.groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {group.grade.level && `${group.grade.level} - `}
                          {group.grade.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {canEdit && (
        <UserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={userProfile}
          onSuccess={handleSuccess}
        />
      )}
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
