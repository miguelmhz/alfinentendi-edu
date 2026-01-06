"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

interface AssignStudentsToGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  gradeId: string;
  gradeName: string;
  onSuccess: () => void;
}

interface Student {
  id: string;
  name: string | null;
  email: string;
  studentGroups: Array<{
    group: {
      id: string;
      gradeId: string;
    };
  }>;
}

export function AssignStudentsToGradeDialog({
  open,
  onOpenChange,
  schoolId,
  gradeId,
  gradeName,
  onSuccess,
}: AssignStudentsToGradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, schoolId, gradeId]);

  const fetchStudents = async () => {
    try {
      setFetchingStudents(true);
      const response = await fetch(`/api/schools/${schoolId}`);
      if (!response.ok) throw new Error("Error al cargar estudiantes");
      const data = await response.json();
      
      // Filtrar solo estudiantes que no están en este grado
      const schoolStudents = data.school.users.filter(
        (u: any) => 
          u.roles.includes("STUDENT") &&
          !u.studentGroups.some((sg: any) => sg.group.gradeId === gradeId)
      );
      
      setStudents(schoolStudents);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar estudiantes");
    } finally {
      setFetchingStudents(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Selecciona al menos un estudiante");
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Implementar API para asignar estudiantes a grado
      const response = await fetch(`/api/grades/${gradeId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar estudiantes");
      }

      toast.success(`${selectedStudents.size} estudiante${selectedStudents.size !== 1 ? 's' : ''} asignado${selectedStudents.size !== 1 ? 's' : ''} al grado`);
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al asignar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudents(new Set());
    setSearchQuery("");
    setShowAll(false);
  };

  // Filtrar estudiantes por búsqueda
  const filteredStudents = students.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = student.name?.toLowerCase().includes(searchLower);
    const emailMatch = student.email.toLowerCase().includes(searchLower);
    return nameMatch || emailMatch;
  });

  // Mostrar solo 10 por defecto
  const displayedStudents = showAll ? filteredStudents : filteredStudents.slice(0, 10);
  const hasMore = filteredStudents.length > 10;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Estudiantes a {gradeName}</DialogTitle>
          <DialogDescription>
            Selecciona los estudiantes que deseas agregar a este grado
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {fetchingStudents ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="border rounded-md p-3 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay estudiantes disponibles para asignar</p>
              <p className="text-sm mt-2">
                Todos los estudiantes ya están en este grado o no hay estudiantes en la escuela
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Label>
                Estudiantes disponibles ({filteredStudents.length})
                {selectedStudents.size > 0 && ` • ${selectedStudents.size} seleccionado${selectedStudents.size !== 1 ? 's' : ''}`}
              </Label>
              
              <div className="border rounded-md max-h-96 overflow-y-auto">
                {displayedStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No se encontraron estudiantes</p>
                    <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
                  </div>
                ) : (
                  <>
                    {displayedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    onClick={() => toggleStudent(student.id)}
                  >
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(student.name, student.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{student.name || "Sin nombre"}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                    {student.studentGroups.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        En {student.studentGroups.length} grupo{student.studentGroups.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    </div>
                  ))}
                  
                  {!showAll && hasMore && (
                    <div className="border-t p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(true)}
                      >
                        Mostrar {filteredStudents.length - 10} más...
                      </Button>
                    </div>
                  )}
                </>
                )}
              </div>
              
              {selectedStudents.size > 0 && !fetchingStudents && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mt-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>{selectedStudents.size}</strong> estudiante{selectedStudents.size !== 1 ? 's' : ''} seleccionado{selectedStudents.size !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedStudents.size === 0}
          >
            {loading ? "Asignando..." : `Asignar ${selectedStudents.size > 0 ? selectedStudents.size : ''} Estudiante${selectedStudents.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
