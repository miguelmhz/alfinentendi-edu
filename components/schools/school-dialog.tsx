"use client"

import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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

interface School {
  id: string
  name: string
  address: string | null
  contact: string | null
  logoUrl: string | null
  coordinatorId: string | null
}

interface Coordinator {
  id: string
  name: string | null
  email: string
}

interface SchoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  school: School | null
  onSuccess: () => void
}

export function SchoolDialog({
  open,
  onOpenChange,
  school,
  onSuccess,
}: SchoolDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coordinators, setCoordinators] = useState<Coordinator[]>([])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    logoUrl: "",
    coordinatorId: "",
  })

  useEffect(() => {
    if (open) {
      fetchCoordinators()
      if (school) {
        setFormData({
          name: school.name,
          address: school.address || "",
          contact: school.contact || "",
          logoUrl: school.logoUrl || "",
          coordinatorId: school.coordinatorId || "",
        })
        setLogoPreview(school.logoUrl)
        setLogoFile(null)
      } else {
        setFormData({
          name: "",
          address: "",
          contact: "",
          logoUrl: "",
          coordinatorId: "",
        })
        setLogoPreview(null)
        setLogoFile(null)
      }
    }
  }, [open, school])

  const fetchCoordinators = async () => {
    try {
      const response = await fetch("/api/users?role=COORDINATOR")
      if (!response.ok) throw new Error("Error al cargar coordinadores")
      const data = await response.json()
      setCoordinators(data.users || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona una imagen válida")
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen no debe superar 2MB")
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData({ ...formData, logoUrl: "" })
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.logoUrl || null

    try {
      setUploading(true)
      const supabase = createClient()
      const fileExt = logoFile.name.split(".").pop()
      const fileName = `school-${Date.now()}.${fileExt}`
      const filePath = `schools/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("afe_imgs")
        .upload(filePath, logoFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("afe_imgs")
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading logo:", error)
      throw new Error("Error al subir el logo")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const logoUrl = await uploadLogo()

      const url = school ? `/api/schools/${school.id}` : "/api/schools"
      const method = school ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address || null,
          contact: formData.contact || null,
          logoUrl: logoUrl || null,
          coordinatorId: formData.coordinatorId || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar escuela")
      }

      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      alert(error instanceof Error ? error.message : "Error al guardar escuela")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {school ? "Editar Escuela" : "Nueva Escuela"}
          </DialogTitle>
          <DialogDescription>
            {school
              ? "Actualiza la información de la escuela"
              : "Crea una nueva escuela en el sistema"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Escuela Primaria Benito Juárez"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Ej: Calle Principal #123, Col. Centro"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Contacto</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                placeholder="Ej: (555) 123-4567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo de la Escuela</Label>
              {logoPreview ? (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("logo")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Logo
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Max 2MB
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="coordinator">Coordinador</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open('/usuarios?create=coordinator', '_blank')}
                >
                  + Agregar coordinador
                </Button>
              </div>
              <Select
                value={formData.coordinatorId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, coordinatorId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger id="coordinator">
                  <SelectValue placeholder="Selecciona un coordinador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin coordinador</SelectItem>
                  {coordinators.map((coordinator) => (
                    <SelectItem key={coordinator.id} value={coordinator.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {coordinator.name || "Sin nombre"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {coordinator.email}
                        </span>
                      </div>
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
            <Button type="submit" disabled={loading || uploading}>
              {uploading
                ? "Subiendo logo..."
                : loading
                ? "Guardando..."
                : school
                ? "Actualizar"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
