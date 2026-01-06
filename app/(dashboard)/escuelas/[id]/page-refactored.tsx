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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { SchoolDialog } from "@/components/schools/school-dialog";
import { SchoolBookLicenseDialog } from "@/components/school/school-book-license-dialog";
import { AddStudentDialog } from "@/components/school/add-student-dialog";
import { AssignBookToStudentDialog } from "@/components/school/assign-book-to-student-dialog";
import { AssignStudentsToGradeDialog } from "@/components/school/assign-students-to-grade-dialog";
import { AssignStudentsToGroupDialog } from "@/components/school/assign-students-to-group-dialog";
import { EditLicenseDialog } from "@/components/school/edit-license-dialog";
import { ViewLicenseStudentsDialog } from "@/components/school/view-license-students-dialog";
import { AssignTeacherToGroupDialog } from "@/components/school/assign-teacher-to-group-dialog";
import { UsersTab } from "@/components/school/tabs/users-tab";
import { BooksTab } from "@/components/school/tabs/books-tab";
import { GradesTab } from "@/components/school/tabs/grades-tab";
import { SubscriptionTab } from "@/components/school/tabs/subscription-tab";

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
    lastLogin: string | null;
    bookAccesses: any[];
    studentGroups: Array<{
      group: {
        id: string;
        gradeId: string;
      };
    }>;
  }>;
  grades: Array<{
    id: string;
    name: string;
    level?: string;
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
  const { isAdmin, user: currentUser, loading: authLoading } = useAuth();
  
  // School data
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [bookLicenses, setBookLicenses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string | null; email: string }>>([]);

  // Dialogs state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [bookLicenseDialogOpen, setBookLicenseDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [assignBookDialogOpen, setAssignBookDialogOpen] = useState(false);
  const [assignStudentsToGradeDialogOpen, setAssignStudentsToGradeDialogOpen] = useState(false);
  const [assignStudentsToGroupDialogOpen, setAssignStudentsToGroupDialogOpen] = useState(false);
  const [editLicenseDialogOpen, setEditLicenseDialogOpen] = useState(false);
  const [viewLicenseStudentsDialogOpen, setViewLicenseStudentsDialogOpen] = useState(false);
  const [assignTeacherDialogOpen, setAssignTeacherDialogOpen] = useState(false);
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);

  // Form state
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [gradeName, setGradeName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<"COORDINATOR" | "TEACHER">("TEACHER");

  // Selected items
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [selectedGradeForAssign, setSelectedGradeForAssign] = useState<{ id: string; name: string } | null>(null);
  const [selectedGroupForAssign, setSelectedGroupForAssign] = useState<{ id: string; name: string; gradeId: string } | null>(null);
  const [selectedLicenseForEdit, setSelectedLicenseForEdit] = useState<any>(null);
  const [selectedLicenseForView, setSelectedLicenseForView] = useState<any>(null);
  const [selectedGroupForTeacher, setSelectedGroupForTeacher] = useState<{ id: string; name: string; teacherId: string | null } | null>(null);

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
      setTeachers(data.school.users.filter((u: any) => u.roles.includes("TEACHER")));

      const licensesResponse = await fetch(`/api/schools/${params.id}/book-licenses`);
      if (licensesResponse.ok) {
        const licensesData = await licensesResponse.json();
        setBookLicenses(licensesData.licenses || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar la escuela");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchSchool();
  };

  const handleCreateGrade = async () => {
    if (!gradeName.trim()) return;
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: gradeName,
          level: gradeLevel || null,
          schoolId: params.id,
        }),
      });
      if (!response.ok) throw new Error("Error al crear grado");
      await fetchSchool();
      setGradeDialogOpen(false);
      setGradeName("");
      setGradeLevel("");
      toast.success("Grado creado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el grado");
    }
  };

  const handleCreateGroup = async (name: string, teacherId: string | null) => {
    if (!selectedGrade) return;
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gradeId: selectedGrade,
          teacherId,
        }),
      });
      if (!response.ok) throw new Error("Error al crear grupo");
      await fetchSchool();
      setGroupDialogOpen(false);
      toast.success("Grupo creado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al crear el grupo");
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm("¿Estás seguro de eliminar este grado?")) return;
    try {
      const response = await fetch(`/api/grades/${gradeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar grado");
      await fetchSchool();
      toast.success("Grado eliminado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el grado");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("¿Estás seguro de eliminar este grupo?")) return;
    try {
      const response = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar grupo");
      await fetchSchool();
      toast.success("Grupo eliminado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al eliminar el grupo");
    }
  };

  const handleOpenEditLicense = (license: any) => {
    setSelectedLicenseForEdit(license);
    setEditLicenseDialogOpen(true);
  };

  const handleAddStaff = async () => {
    if (!staffEmail.trim()) {
      toast.error("El email es requerido");
      return;
    }
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: staffEmail.trim(),
          name: staffName.trim() || null,
          roles: [staffRole],
          status: "INVITED",
          schoolId: params.id,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al agregar usuario");
      }
      await fetchSchool();
      setAddStaffDialogOpen(false);
      setStaffEmail("");
      setStaffName("");
      setStaffRole("TEACHER");
      toast.success(`${staffRole === "COORDINATOR" ? "Coordinador" : "Profesor"} agregado exitosamente`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al agregar usuario");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin || !school) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/escuelas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            {school.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {school.address}
              </span>
            )}
            {school.contact && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {school.contact}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAddStaffDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Personal
          </Button>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Escuela
          </Button>
        </div>
      </div>

      {/* Coordinator Card */}
      {school.coordinator && (
        <Card>
          <CardHeader>
            <CardTitle>Coordinador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {school.coordinator.name?.slice(0, 2).toUpperCase() || school.coordinator.email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{school.coordinator.name || school.coordinator.email}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {school.coordinator.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <TabButton
            icon={<Users className="h-4 w-4" />}
            label="Usuarios"
            isActive={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <TabButton
            icon={<GraduationCap className="h-4 w-4" />}
            label="Grados"
            isActive={activeTab === "grades"}
            onClick={() => setActiveTab("grades")}
          />
          <TabButton
            icon={<BookOpen className="h-4 w-4" />}
            label="Libros"
            isActive={activeTab === "books"}
            onClick={() => setActiveTab("books")}
          />
          <TabButton
            icon={<CreditCard className="h-4 w-4" />}
            label="Suscripción"
            isActive={activeTab === "subscription"}
            onClick={() => setActiveTab("subscription")}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <UsersTab
          users={school.users}
          isAdmin={isAdmin}
          onAddStudent={() => setAddStudentDialogOpen(true)}
          onAssignBook={(student) => {
            setSelectedStudent(student);
            setAssignBookDialogOpen(true);
          }}
        />
      )}

      {activeTab === "grades" && (
        <GradesTab
          grades={school.grades}
          users={school.users}
          onAddGrade={() => setGradeDialogOpen(true)}
          onDeleteGrade={handleDeleteGrade}
          onAddGroup={(gradeId) => {
            setSelectedGrade(gradeId);
            setGroupDialogOpen(true);
          }}
          onDeleteGroup={handleDeleteGroup}
          onAssignStudentsToGrade={(grade) => {
            setSelectedGradeForAssign(grade);
            setAssignStudentsToGradeDialogOpen(true);
          }}
          onAssignStudentsToGroup={(group) => {
            setSelectedGroupForAssign(group);
            setAssignStudentsToGroupDialogOpen(true);
          }}
          onAssignTeacherToGroup={(group) => {
            setSelectedGroupForTeacher(group);
            setAssignTeacherDialogOpen(true);
          }}
        />
      )}

      {activeTab === "books" && (
        <BooksTab
          bookLicenses={bookLicenses}
          isAdmin={isAdmin}
          onAddLicense={() => setBookLicenseDialogOpen(true)}
          onEditLicense={handleOpenEditLicense}
          onViewStudents={(license) => {
            setSelectedLicenseForView(license);
            setViewLicenseStudentsDialogOpen(true);
          }}
        />
      )}

      {activeTab === "subscription" && <SubscriptionTab />}

      {/* Dialogs */}
      <SchoolDialog open={dialogOpen} onOpenChange={setDialogOpen} school={school} onSuccess={handleSuccess} />

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Grado</DialogTitle>
            <DialogDescription>Agrega un nuevo grado escolar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade-name">Nombre del Grado</Label>
              <Input id="grade-name" value={gradeName} onChange={(e) => setGradeName(e.target.value)} placeholder="Ej: Primer Grado" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade-level">Nivel (Opcional)</Label>
              <Input id="grade-level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="Ej: Primaria" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGrade} disabled={!gradeName.trim()}>Crear Grado</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Grupo</DialogTitle>
            <DialogDescription>Agrega un nuevo grupo al grado seleccionado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nombre del Grupo</Label>
              <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Ej: Grupo A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher-select">Profesor (Opcional)</Label>
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
            <Button variant="outline" onClick={() => { setGroupDialogOpen(false); setGroupName(""); setSelectedTeacher(""); }}>Cancelar</Button>
            <Button onClick={() => { if (groupName.trim()) { handleCreateGroup(groupName, selectedTeacher === "none" ? null : selectedTeacher); setGroupName(""); setSelectedTeacher(""); } }} disabled={!groupName.trim()}>Crear Grupo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Coordinador o Profesor</DialogTitle>
            <DialogDescription>Agrega un nuevo coordinador o profesor a la escuela. Se enviará un email de invitación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-role">Rol</Label>
              <Select value={staffRole} onValueChange={(value: "COORDINATOR" | "TEACHER") => setStaffRole(value)}>
                <SelectTrigger id="staff-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Profesor</SelectItem>
                  <SelectItem value="COORDINATOR">Coordinador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email *</Label>
              <Input id="staff-email" type="email" placeholder="correo@ejemplo.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-name">Nombre (Opcional)</Label>
              <Input id="staff-name" type="text" placeholder="Nombre completo" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddStaffDialogOpen(false); setStaffEmail(""); setStaffName(""); setStaffRole("TEACHER"); }}>Cancelar</Button>
            <Button onClick={handleAddStaff} disabled={!staffEmail.trim()}>Agregar {staffRole === "COORDINATOR" ? "Coordinador" : "Profesor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SchoolBookLicenseDialog open={bookLicenseDialogOpen} onOpenChange={setBookLicenseDialogOpen} schoolId={params.id as string} onSuccess={() => { setBookLicenseDialogOpen(false); fetchSchool(); }} />
      <AddStudentDialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen} schoolId={params.id as string} onSuccess={() => { setAddStudentDialogOpen(false); fetchSchool(); }} />
      {selectedStudent && <AssignBookToStudentDialog open={assignBookDialogOpen} onOpenChange={setAssignBookDialogOpen} schoolId={params.id as string} studentId={selectedStudent.id} studentName={selectedStudent.name} onSuccess={() => { setAssignBookDialogOpen(false); setSelectedStudent(null); fetchSchool(); }} />}
      {selectedGradeForAssign && <AssignStudentsToGradeDialog open={assignStudentsToGradeDialogOpen} onOpenChange={setAssignStudentsToGradeDialogOpen} schoolId={params.id as string} gradeId={selectedGradeForAssign.id} gradeName={selectedGradeForAssign.name} onSuccess={() => { setAssignStudentsToGradeDialogOpen(false); setSelectedGradeForAssign(null); fetchSchool(); }} />}
      {selectedGroupForAssign && <AssignStudentsToGroupDialog open={assignStudentsToGroupDialogOpen} onOpenChange={setAssignStudentsToGroupDialogOpen} schoolId={params.id as string} groupId={selectedGroupForAssign.id} groupName={selectedGroupForAssign.name} gradeId={selectedGroupForAssign.gradeId} onSuccess={() => { setAssignStudentsToGroupDialogOpen(false); setSelectedGroupForAssign(null); fetchSchool(); }} />}
      <EditLicenseDialog open={editLicenseDialogOpen} onOpenChange={setEditLicenseDialogOpen} schoolId={params.id as string} license={selectedLicenseForEdit} onSuccess={() => { setEditLicenseDialogOpen(false); setSelectedLicenseForEdit(null); fetchSchool(); }} />
      <ViewLicenseStudentsDialog open={viewLicenseStudentsDialogOpen} onOpenChange={setViewLicenseStudentsDialogOpen} license={selectedLicenseForView} schoolId={params.id as string} onSuccess={() => { fetchSchool(); }} />
      <AssignTeacherToGroupDialog open={assignTeacherDialogOpen} onOpenChange={setAssignTeacherDialogOpen} group={selectedGroupForTeacher} teachers={teachers} onSuccess={() => { fetchSchool(); }} />
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
      className={`flex items-center gap-2 px-6 py-3 transition-all duration-200 relative ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted/50"
      }`}
    >
      <span className={isActive ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
      {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
    </button>
  );
}
