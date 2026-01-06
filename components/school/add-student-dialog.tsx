"use client";

import { useState } from "react";
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
import { Upload, UserPlus } from "lucide-react";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  onSuccess: () => void;
}

export function AddStudentDialog({
  open,
  onOpenChange,
  schoolId,
  onSuccess,
}: AddStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{ name: string; email: string }>>([]);
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("El correo electrónico es requerido");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Ingresa un correo electrónico válido");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          roles: ["STUDENT"],
          schoolId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear estudiante");
      }

      const data = await response.json();
      toast.success("Estudiante agregado exitosamente. Se envió un correo de invitación.");
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al agregar estudiante");
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Por favor sube un archivo CSV");
      return;
    }

    setCsvFile(file);

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip header if exists
    const hasHeader = lines[0].toLowerCase().includes('email') || lines[0].toLowerCase().includes('correo');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const students: Array<{ name: string; email: string }> = [];
    
    for (const line of dataLines) {
      const parts = line.split(',').map(p => p.trim().replace(/['"]/g, ''));
      
      if (parts.length >= 1) {
        const email = parts.find(p => p.includes('@')) || parts[0];
        const name = parts.find(p => !p.includes('@') && p.length > 0) || '';
        
        if (email && email.includes('@')) {
          students.push({ name, email });
        }
      }
    }

    if (students.length === 0) {
      toast.error("No se encontraron correos válidos en el archivo");
      setCsvFile(null);
      return;
    }

    setCsvPreview(students);
    toast.success(`${students.length} estudiante${students.length !== 1 ? 's' : ''} encontrado${students.length !== 1 ? 's' : ''}`);
  };

  const handleBulkSubmit = async () => {
    if (csvPreview.length === 0) {
      toast.error("No hay estudiantes para agregar");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: csvPreview,
          schoolId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear estudiantes");
      }

      const data = await response.json();
      toast.success(`${data.created} estudiante${data.created !== 1 ? 's' : ''} agregado${data.created !== 1 ? 's' : ''} exitosamente`);
      
      if (data.skipped > 0) {
        toast.info(`${data.skipped} correo${data.skipped !== 1 ? 's' : ''} ya existía${data.skipped !== 1 ? 'n' : ''}`);
      }
      
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al agregar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setCsvFile(null);
    setCsvPreview([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Estudiantes</DialogTitle>
          <DialogDescription>
            Agrega estudiantes individualmente o en lote mediante un archivo CSV. 
            Los estudiantes recibirán un enlace mágico para acceder sin contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full space-y-4">
          <div className="grid w-full grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant={activeTab === "manual" ? "default" : "ghost"}
              onClick={() => setActiveTab("manual")}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Formulario
            </Button>
            <Button
              type="button"
              variant={activeTab === "csv" ? "default" : "ghost"}
              onClick={() => setActiveTab("csv")}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir CSV
            </Button>
          </div>

          {activeTab === "manual" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Nombre (Opcional)</Label>
                <Input
                  id="student-name"
                  placeholder="ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-email">Correo Electrónico *</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="ej. estudiante@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  <strong>Nota:</strong> El estudiante recibirá un correo con un enlace mágico para acceder. 
                  No necesita crear contraseña.
                </p>
              </div>
            </div>
          )}

          {activeTab === "csv" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Archivo CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                />
                <p className="text-sm text-muted-foreground">
                  El archivo debe contener correos electrónicos y opcionalmente nombres. 
                  Formato: <code className="bg-muted px-1 rounded">nombre,correo@ejemplo.com</code>
                </p>
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label>Vista Previa ({csvPreview.length} estudiantes)</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                    {csvPreview.slice(0, 10).map((student, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{student.name || "Sin nombre"}</span>
                        <span className="text-muted-foreground">{student.email}</span>
                      </div>
                    ))}
                    {csvPreview.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        ... y {csvPreview.length - 10} más
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md text-sm">
                <p className="text-amber-900 dark:text-amber-100">
                  <strong>Formato del CSV:</strong>
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-amber-800 dark:text-amber-200">
                  <li>Primera línea puede ser encabezado (opcional)</li>
                  <li>Cada línea: <code className="bg-muted px-1 rounded">Nombre,correo@ejemplo.com</code></li>
                  <li>O solo: <code className="bg-muted px-1 rounded">correo@ejemplo.com</code></li>
                </ul>
              </div>
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
            onClick={csvPreview.length > 0 ? handleBulkSubmit : handleSubmit} 
            disabled={loading || (csvPreview.length === 0 && !email.trim())}
          >
            {loading ? "Procesando..." : csvPreview.length > 0 ? `Agregar ${csvPreview.length} Estudiantes` : "Agregar Estudiante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
