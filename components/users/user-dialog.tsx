"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  id: string
  email: string
  name: string | null
  roles: string[]
  status: string
  schoolId: string | null
}

interface School {
  id: string
  name: string
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  prefilledRole?: string | null
  onSuccess: () => void
}

const AVAILABLE_ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "COORDINATOR", label: "Coordinador" },
  { value: "TEACHER", label: "Profesor" },
  { value: "STUDENT", label: "Estudiante" },
]

const AVAILABLE_STATUSES = [
  { value: "INVITED", label: "Invitado" },
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
]

export function UserDialog({
  open,
  onOpenChange,
  user,
  prefilledRole,
  onSuccess,
}: UserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState<School[]>([])
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    roles: [] as string[],
    status: "INVITED",
    schoolId: "",
  })

  useEffect(() => {
    if (open) {
      fetchSchools()
      if (user) {
        setFormData({
          email: user.email,
          name: user.name || "",
          roles: user.roles,
          status: user.status,
          schoolId: user.schoolId || "",
        })
      } else {
        setFormData({
          email: "",
          name: "",
          roles: prefilledRole ? [prefilledRole] : [],
          status: "INVITED",
          schoolId: "",
        })
      }
    }
  }, [open, user, prefilledRole])

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools")
      if (!response.ok) throw new Error("Error al cargar escuelas")
      const data = await response.json()
      setSchools(data.schools || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.email || formData.email.trim() === "") {
        throw new Error("El email es requerido")
      }

      if (formData.roles.length === 0) {
        throw new Error("Debe seleccionar al menos un rol")
      }

      const url = user ? `/api/users/${user.id}` : "/api/users"
      const method = user ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim() || null,
          roles: formData.roles,
          status: formData.status,
          schoolId: formData.schoolId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar usuario")
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error:", error)
      alert(error.message || "Error al guardar el usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Actualiza la información del usuario"
              : "Crea un nuevo usuario. Se enviará una invitación por correo con una contraseña temporal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@ejemplo.com"
                required
                disabled={!!user}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Roles <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={formData.roles.includes(role.value)}
                      onCheckedChange={() => handleRoleToggle(role.value)}
                    />
                    <Label
                      htmlFor={`role-${role.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">Escuela</Label>
              <Select
                value={formData.schoolId || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    schoolId: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger id="school">
                  <SelectValue placeholder="Selecciona una escuela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin escuela</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : user ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
