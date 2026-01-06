"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Teacher {
  id: string;
  name: string | null;
  email: string;
}

interface AssignTeacherToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    teacherId: string | null;
  } | null;
  teachers: Teacher[];
  onSuccess: () => void;
}

export function AssignTeacherToGroupDialog({
  open,
  onOpenChange,
  group,
  teachers,
  onSuccess,
}: AssignTeacherToGroupDialogProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && group) {
      setSelectedTeacherId(group.teacherId || "none");
    } else {
      setSelectedTeacherId("");
    }
  }, [open, group]);

  const handleAssignTeacher = async () => {
    if (!group) return;

    const teacherId = selectedTeacherId === "none" ? null : selectedTeacherId;

    try {
      setLoading(true);
      const response = await fetch(`/api/groups/${group.id}/assign-teacher`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar profesor");
      }

      toast.success(
        teacherId
          ? "Profesor asignado exitosamente"
          : "Profesor removido del grupo"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al asignar profesor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Profesor al Grupo</DialogTitle>
          <DialogDescription>
            {group?.name}
            <br />
            Selecciona un profesor para asignar a este grupo o selecciona "Sin
            asignar" para remover el profesor actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teacher-select">Profesor</Label>
            <Select
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
            >
              <SelectTrigger id="teacher-select">
                <SelectValue placeholder="Selecciona un profesor" />
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

          {teachers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay profesores disponibles en esta escuela. Agrega profesores
              primero.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleAssignTeacher} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Asignar Profesor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
