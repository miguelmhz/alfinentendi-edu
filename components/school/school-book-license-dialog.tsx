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

interface SchoolBookLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  onSuccess: () => void;
}

interface Book {
  id: string;
  title: string;
  subject: string | null;
}

export function SchoolBookLicenseDialog({
  open,
  onOpenChange,
  schoolId,
  onSuccess,
}: SchoolBookLicenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [totalLicenses, setTotalLicenses] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 año por defecto
  );

  useEffect(() => {
    if (open) {
      fetchBooks();
    }
  }, [open]);

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

  const handleSubmit = async () => {
    if (!selectedBook) {
      toast.error("Selecciona un libro");
      return;
    }

    if (!totalLicenses || parseInt(totalLicenses) < 1) {
      toast.error("Ingresa un número válido de licencias (mínimo 1)");
      return;
    }

    if (endDate <= startDate) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/schools/${schoolId}/book-licenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBook,
          totalLicenses: parseInt(totalLicenses),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al asignar licencia");
      }

      const data = await response.json();
      toast.success(data.message || "Licencia asignada exitosamente");
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al asignar licencia");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedBook("");
    setTotalLicenses("");
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Licencias de Libro</DialogTitle>
          <DialogDescription>
            Asigna licencias de un libro a esta escuela. Los coordinadores y profesores tendrán acceso automático.
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

          {/* Número de licencias */}
          <div className="space-y-2">
            <Label htmlFor="licenses">Número de Licencias *</Label>
            <Input
              id="licenses"
              type="number"
              min="1"
              placeholder="ej. 100"
              value={totalLicenses}
              onChange={(e) => setTotalLicenses(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Número de estudiantes que podrán acceder al libro
            </p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Expiración *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> Los coordinadores y profesores de la escuela tendrán acceso automático al libro. 
              La escuela podrá asignar las licencias restantes a sus estudiantes.
            </p>
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
            {loading ? "Asignando..." : "Asignar Licencias"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
