"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    groups: Array<{
      id: string;
      name: string;
      teacher: {
        id: string;
        name: string | null;
        email: string;
      };
    }>;  
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
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);
  const [gradeName, setGradeName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

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
      
      const teachersResponse = await fetch(`/api/users?role=TEACHER`);
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData.users);
      }
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

  const toggleGradeExpansion = (gradeId: string) => {
    setExpandedGrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gradeId)) {
        newSet.delete(gradeId);
      } else {
        newSet.add(gradeId);
      }
      return newSet;
    });
  };

  const handleCreateGrade = async (name: string, level: string) => {
    try {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level, schoolId: params.id }),
      });
      if (!response.ok) throw new Error('Error al crear grado');
      await fetchSchool();
      setGradeDialogOpen(false);
      toast.success('Grado creado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el grado');
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este grado? Se eliminarán todos los grupos asociados.')) return;
    try {
      const response = await fetch(`/api/grades/${gradeId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar grado');
      await fetchSchool();
      toast.success('Grado eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el grado');
    }
  };

  const handleCreateGroup = async (name: string, teacherId: string | null) => {
    if (!selectedGrade) return;
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gradeId: selectedGrade, teacherId: teacherId || null }),
      });
      if (!response.ok) throw new Error('Error al crear grupo');
      await fetchSchool();
      setGroupDialogOpen(false);
      setSelectedGrade(null);
      toast.success('Grupo creado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear el grupo');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('¿Estás seguro de eliminar este grupo?')) return;
    try {
      const response = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar grupo');
      await fetchSchool();
      toast.success('Grupo eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el grupo');
    }
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Grados Escolares</CardTitle>
                <CardDescription>
                  Gestiona los grados y grupos de la escuela
                </CardDescription>
              </div>
              <Button onClick={() => setGradeDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Grado
              </Button>
            </CardHeader>
            <CardContent>
              {school.grades.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No hay grados registrados</p>
                  <Button variant="outline" onClick={() => setGradeDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar primer grado
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {school.grades.map((grade) => {
                    const isExpanded = expandedGrades.has(grade.id);
                    return (
                      <div key={grade.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleGradeExpansion(grade.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <div className="font-semibold">{grade.name}</div>
                              {grade.level && (
                                <div className="text-sm text-muted-foreground">
                                  {grade.level}
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {grade.groups.length} grupo{grade.groups.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGrade(grade.id);
                                setGroupDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar Grupo
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGrade(grade.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t">
                            {grade.groups.length === 0 ? (
                              <div className="p-8 text-center text-muted-foreground">
                                <p className="mb-2">No hay grupos en este grado</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGrade(grade.id);
                                    setGroupDialogOpen(true);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Agregar primer grupo
                                </Button>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-muted/20">
                                    <tr>
                                      <th className="text-left p-3 font-medium text-sm">Nombre del Grupo</th>
                                      <th className="text-left p-3 font-medium text-sm">Profesor</th>
                                      <th className="text-left p-3 font-medium text-sm">Email</th>
                                      <th className="text-right p-3 font-medium text-sm">Acciones</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {grade.groups.map((group) => (
                                      <tr key={group.id} className="border-t hover:bg-muted/10">
                                        <td className="p-3">{group.name}</td>
                                        <td className="p-3">{group.teacher ? (group.teacher.name || 'Sin nombre') : <span className="text-muted-foreground italic">Sin asignar</span>}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{group.teacher?.email || '-'}</td>
                                        <td className="p-3 text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteGroup(group.id)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Grado</DialogTitle>
            <DialogDescription>
              Agrega un nuevo grado escolar a la escuela
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade-name">Nombre del Grado *</Label>
              <Input
                id="grade-name"
                placeholder="ej. Tercer Grado de Primaria"
                value={gradeName}
                onChange={(e) => setGradeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-level">Nivel (Opcional)</Label>
              <Input
                id="grade-level"
                placeholder="ej. Primaria, Secundaria"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGradeDialogOpen(false);
                setGradeName("");
                setGradeLevel("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (gradeName.trim()) {
                  handleCreateGrade(gradeName, gradeLevel);
                  setGradeName("");
                  setGradeLevel("");
                }
              }}
              disabled={!gradeName.trim()}
            >
              Crear Grado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Grupo</DialogTitle>
            <DialogDescription>
              Agrega un nuevo grupo al grado seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nombre del Grupo *</Label>
              <Input
                id="group-name"
                placeholder="ej. 3°A - Matemáticas"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Profesor Asignado (Opcional)</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un profesor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name || teacher.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setGroupDialogOpen(false);
                setGroupName("");
                setSelectedTeacher("");
                setSelectedGrade(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (groupName.trim()) {
                  handleCreateGroup(groupName, selectedTeacher === "none" ? null : selectedTeacher);
                  setGroupName("");
                  setSelectedTeacher("");
                }
              }}
              disabled={!groupName.trim()}
            >
              Crear Grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
