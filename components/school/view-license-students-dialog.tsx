"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  name: string | null;
  email: string;
  bookAccess: {
    id: string;
    createdAt: string;
    startDate: string;
    endDate: string;
  };
}

interface ViewLicenseStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: {
    id: string;
    book: {
      id: string;
      title: string;
      subject?: string;
    };
    totalLicenses: number;
    usedLicenses: number;
  } | null;
  schoolId: string;
  onSuccess: () => void;
}

export function ViewLicenseStudentsDialog({
  open,
  onOpenChange,
  license,
  schoolId,
  onSuccess,
}: ViewLicenseStudentsDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (open && license) {
      fetchStudentsWithAccess();
    } else {
      setStudents([]);
      setSelectedStudents(new Set());
    }
  }, [open, license]);

  const fetchStudentsWithAccess = async () => {
    if (!license) return;

    try {
      setLoading(true);
      const url = `/api/books/${license.book.id}/students?schoolId=${schoolId}`;
      console.log("[ViewLicenseStudentsDialog] Fetching students from:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[ViewLicenseStudentsDialog] Error response:", errorData);
        throw new Error(errorData.error || "Error al cargar estudiantes");
      }

      const data = await response.json();
      console.log("[ViewLicenseStudentsDialog] Received data:", data);
      setStudents(data.students || []);
    } catch (error: any) {
      console.error("[ViewLicenseStudentsDialog] Error:", error);
      toast.error(error.message || "Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleRevokeAccess = async () => {
    if (selectedStudents.size === 0) {
      toast.error("Selecciona al menos un estudiante");
      return;
    }

    if (!license) return;

    const confirmMessage = `¿Estás seguro de revocar el acceso a ${selectedStudents.size} estudiante${
      selectedStudents.size > 1 ? "s" : ""
    }?`;

    if (!confirm(confirmMessage)) return;

    try {
      setRevoking(true);
      const response = await fetch(`/api/books/${license.book.id}/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
          schoolId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al revocar acceso");
      }

      const data = await response.json();
      toast.success(
        `Acceso revocado a ${data.revokedCount} estudiante${
          data.revokedCount > 1 ? "s" : ""
        }`
      );

      setSelectedStudents(new Set());
      await fetchStudentsWithAccess();
      onSuccess();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al revocar acceso");
    } finally {
      setRevoking(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Estudiantes con Acceso</DialogTitle>
          <DialogDescription>
            {license?.book.title}
            {license?.book.subject && ` - ${license.book.subject}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay estudiantes con acceso a este libro</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {students.length} estudiante{students.length !== 1 ? "s" : ""} con
                  acceso
                </p>
                {selectedStudents.size > 0 && (
                  <Badge variant="secondary">
                    {selectedStudents.size} seleccionado
                    {selectedStudents.size !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>

              {students.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.has(student.id)
                      ? "bg-muted border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleToggleStudent(student.id)}
                >
                  <Checkbox
                    checked={selectedStudents.has(student.id)}
                    onCheckedChange={() => handleToggleStudent(student.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(student.name, student.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {student.name || student.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {student.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Asignado:{" "}
                      {new Date(student.bookAccess.createdAt).toLocaleDateString()}
                      {" • "}
                      Expira:{" "}
                      {new Date(student.bookAccess.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {selectedStudents.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleRevokeAccess}
              disabled={revoking}
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revocando...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Revocar Acceso ({selectedStudents.size})
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
