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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AssignBookToStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

interface License {
  id: string;
  bookId: string;
  totalLicenses: number;
  usedLicenses: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  book: {
    id: string;
    title: string;
    subject: string | null;
  };
}

export function AssignBookToStudentDialog({
  open,
  onOpenChange,
  schoolId,
  studentId,
  studentName,
  onSuccess,
}: AssignBookToStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [selectedLicense, setSelectedLicense] = useState("");
  const [assignedBooks, setAssignedBooks] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchLicenses();
      fetchAssignedBooks();
    }
  }, [open, schoolId, studentId]);

  const fetchLicenses = async () => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/book-licenses`);
      if (!response.ok) throw new Error("Error al cargar licencias");
      const data = await response.json();
      
      // Filtrar solo licencias activas con espacio disponible
      const availableLicenses = (data.licenses || []).filter(
        (license: License) =>
          license.isActive &&
          license.usedLicenses < license.totalLicenses &&
          new Date(license.endDate) > new Date()
      );
      
      setLicenses(availableLicenses);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar licencias disponibles");
    }
  };

  const fetchAssignedBooks = async () => {
    try {
      const response = await fetch(`/api/users/${studentId}/book-access`);
      if (!response.ok) return;
      const data = await response.json();
      
      // Extraer IDs de libros ya asignados
      const bookIds = (data.accesses || [])
        .filter((access: any) => access.isActive && new Date(access.endDate) > new Date())
        .map((access: any) => access.bookId);
      
      setAssignedBooks(bookIds);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLicense) {
      toast.error("Selecciona un libro");
      return;
    }

    const license = licenses.find((l) => l.id === selectedLicense);
    if (!license) return;

    try {
      setLoading(true);
      
      // Crear acceso individual para el estudiante
      const response = await fetch("/api/book-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: license.bookId,
          assignmentType: "individual",
          userIds: [studentId],
          startDate: license.startDate,
          endDate: license.endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar acceso");
      }

      // Actualizar el contador de licencias usadas
      await fetch(`/api/schools/${schoolId}/book-licenses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId: selectedLicense,
          usedLicenses: license.usedLicenses + 1,
        }),
      });

      toast.success(`Acceso al libro asignado a ${studentName}`);
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al asignar acceso");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedLicense("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar Libro a {studentName}</DialogTitle>
          <DialogDescription>
            Selecciona un libro de las licencias disponibles de la escuela
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {assignedBooks.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Libros ya asignados a este estudiante:
              </p>
              <div className="space-y-1">
                {licenses
                  .filter((license) => assignedBooks.includes(license.bookId))
                  .map((license) => (
                    <p key={license.id} className="text-sm text-blue-800 dark:text-blue-200">
                      • {license.book.title}
                    </p>
                  ))}
              </div>
            </div>
          )}

          {licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">No hay licencias disponibles</p>
              <p className="text-sm">
                Todas las licencias están agotadas o no hay libros asignados a la escuela
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="book">Libro *</Label>
              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un libro" />
                </SelectTrigger>
                <SelectContent>
                  {licenses
                    .filter((license) => !assignedBooks.includes(license.bookId))
                    .map((license) => {
                      const available = license.totalLicenses - license.usedLicenses;
                      return (
                        <SelectItem key={license.id} value={license.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {license.book.title}
                              {license.book.subject && ` - ${license.book.subject}`}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {available} disponible{available !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              
              {selectedLicense && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                  {(() => {
                    const license = licenses.find((l) => l.id === selectedLicense);
                    if (!license) return null;
                    return (
                      <div className="space-y-1">
                        <p>
                          <strong>Período de acceso:</strong>{" "}
                          {new Date(license.startDate).toLocaleDateString()} -{" "}
                          {new Date(license.endDate).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Licencias disponibles:</strong>{" "}
                          {license.totalLicenses - license.usedLicenses} de {license.totalLicenses}
                        </p>
                      </div>
                    );
                  })()}
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
            disabled={loading || licenses.length === 0 || !selectedLicense}
          >
            {loading ? "Asignando..." : "Asignar Acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
