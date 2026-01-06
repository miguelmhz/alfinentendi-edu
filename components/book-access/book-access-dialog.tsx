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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

interface BookAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Book {
  id: string;
  title: string;
  subject: string | null;
}

interface School {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
  level: string | null;
}

interface Group {
  id: string;
  name: string;
  grade: {
    name: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function BookAccessDialog({
  open,
  onOpenChange,
  onSuccess,
}: BookAccessDialogProps) {
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedBook, setSelectedBook] = useState("");
  const [assignmentType, setAssignmentType] = useState<string>("individual");
  const [targetId, setTargetId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año por defecto
  );

  useEffect(() => {
    if (open) {
      fetchBooks();
      fetchSchools();
      fetchGrades();
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (assignmentType === "group" && grades.length > 0) {
      fetchGroups();
    }
  }, [assignmentType, grades]);

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books/sync");
      if (!response.ok) throw new Error("Error al cargar libros");
      const data = await response.json();
      setBooks(data.books || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar libros");
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (!response.ok) throw new Error("Error al cargar escuelas");
      const data = await response.json();
      setSchools(data.schools || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (!response.ok) throw new Error("Error al cargar grados");
      const data = await response.json();
      setGrades(data.grades || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Error al cargar grupos");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Error al cargar usuarios");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBook) {
      toast.error("Selecciona un libro");
      return;
    }

    if (assignmentType === "individual" && selectedUsers.length === 0) {
      toast.error("Selecciona al menos un usuario");
      return;
    }

    if (assignmentType !== "individual" && !targetId) {
      toast.error("Selecciona un destino para la asignación");
      return;
    }

    if (endDate <= startDate) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/book-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBook,
          assignmentType,
          targetId: assignmentType !== "individual" ? targetId : undefined,
          userIds: assignmentType === "individual" ? selectedUsers : undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar acceso");
      }

      const data = await response.json();
      toast.success(data.message || "Acceso asignado exitosamente");
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
    setSelectedBook("");
    setAssignmentType("individual");
    setTargetId("");
    setSelectedUsers([]);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Acceso a Libro</DialogTitle>
          <DialogDescription>
            Asigna acceso a un libro para usuarios, grupos, grados o escuelas completas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleccionar libro */}
          <div className="space-y-2">
            <Label htmlFor="book">Libro *</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un libro" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.title}
                    {book.subject && ` - ${book.subject}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de asignación */}
          <div className="space-y-2">
            <Label htmlFor="assignmentType">Tipo de Asignación *</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual (Usuarios específicos)</SelectItem>
                <SelectItem value="school">Escuela Completa</SelectItem>
                <SelectItem value="grade">Grado Completo</SelectItem>
                <SelectItem value="group">Grupo Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector según tipo de asignación */}
          {assignmentType === "individual" && (
            <div className="space-y-2">
              <Label>Usuarios *</Label>
              <Select
                value={selectedUsers[0] || ""}
                onValueChange={(value) => {
                  if (!selectedUsers.includes(value)) {
                    setSelectedUsers([...selectedUsers, value]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agregar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((userId) => {
                    const user = users.find((u) => u.id === userId);
                    return (
                      <div
                        key={userId}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm flex items-center gap-2"
                      >
                        {user?.name || user?.email}
                        <button
                          onClick={() =>
                            setSelectedUsers(selectedUsers.filter((id) => id !== userId))
                          }
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {assignmentType === "school" && (
            <div className="space-y-2">
              <Label htmlFor="school">Escuela *</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una escuela" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assignmentType === "grade" && (
            <div className="space-y-2">
              <Label htmlFor="grade">Grado *</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grado" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.level ? `${grade.level} - ${grade.name}` : grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assignmentType === "group" && (
            <div className="space-y-2">
              <Label htmlFor="group">Grupo *</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} - {group.grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Expiración *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Asignando..." : "Asignar Acceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
