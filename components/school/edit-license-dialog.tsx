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
import { Badge } from "@/components/ui/badge";

interface EditLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  license: {
    id: string;
    bookTitle: string;
    totalLicenses: number;
    usedLicenses: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  } | null;
  onSuccess: () => void;
}

export function EditLicenseDialog({
  open,
  onOpenChange,
  schoolId,
  license,
  onSuccess,
}: EditLicenseDialogProps) {
  const [loading, setLoading] = useState(false);
  const [totalLicenses, setTotalLicenses] = useState("");
  const [endDate, setEndDate] = useState(new Date());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (license && open) {
      setTotalLicenses(license.totalLicenses.toString());
      setEndDate(new Date(license.endDate));
      setIsActive(license.isActive);
    }
  }, [license, open]);

  const handleSubmit = async () => {
    if (!license) return;

    const newTotal = parseInt(totalLicenses);
    
    if (!totalLicenses.trim() || isNaN(newTotal) || newTotal < 1) {
      toast.error("Ingresa un número válido de licencias");
      return;
    }

    if (newTotal < license.usedLicenses) {
      toast.error(`No puedes reducir las licencias a menos de ${license.usedLicenses} (licencias ya usadas)`);
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/schools/${schoolId}/book-licenses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseId: license.id,
          totalLicenses: newTotal,
          endDate: endDate.toISOString(),
          isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar licencia");
      }

      toast.success("Licencia actualizada exitosamente");
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al actualizar licencia");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!license) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/schools/${schoolId}/book-licenses/${license.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al revocar licencia");
      }

      toast.success("Licencia revocada. Los accesos de estudiantes han sido eliminados.");
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al revocar licencia");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTotalLicenses("");
    setEndDate(new Date());
    setIsActive(true);
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Licencia</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de la licencia de {license.bookTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información actual */}
          <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Licencias usadas:</span>
              <span className="font-medium">{license.usedLicenses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Licencias disponibles:</span>
              <span className="font-medium">{license.totalLicenses - license.usedLicenses}</span>
            </div>
          </div>

          {/* Total de licencias */}
          <div className="space-y-2">
            <Label htmlFor="total-licenses">Total de Licencias *</Label>
            <Input
              id="total-licenses"
              type="number"
              min={license.usedLicenses}
              placeholder="ej. 100"
              value={totalLicenses}
              onChange={(e) => setTotalLicenses(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo: {license.usedLicenses} (licencias ya usadas)
            </p>
          </div>

          {/* Fecha de expiración */}
          <div className="space-y-2">
            <Label htmlFor="end-date">Fecha de Expiración *</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Fecha actual: {new Date(license.endDate).toLocaleDateString()}
            </p>
          </div>

          {/* Estado */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="is-active" className="cursor-pointer">
                Licencia activa
              </Label>
            </div>
            
            {!isActive && (
              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>⚠️ Licencia suspendida:</strong> Los estudiantes no podrán acceder al libro mientras esté inactiva.
                </p>
              </div>
            )}
          </div>

          {/* Atajos rápidos */}
          <div className="space-y-2">
            <Label>Atajos rápidos de renovación:</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(license.endDate);
                  newDate.setMonth(newDate.getMonth() + 6);
                  setEndDate(newDate);
                }}
              >
                +6 meses
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(license.endDate);
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setEndDate(newDate);
                }}
              >
                +1 año
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(license.endDate);
                  newDate.setFullYear(newDate.getFullYear() + 2);
                  setEndDate(newDate);
                }}
              >
                +2 años
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm(`¿Estás seguro de que deseas REVOCAR permanentemente esta licencia?\n\nEsto eliminará el acceso de ${license.usedLicenses} estudiante${license.usedLicenses !== 1 ? 's' : ''} y no se puede deshacer.`)) {
                handleRevoke();
              }
            }}
            disabled={loading}
          >
            Revocar Licencia
          </Button>
          <div className="flex gap-2">
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
              {loading ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
