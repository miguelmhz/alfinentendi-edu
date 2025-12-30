"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SchoolDialog } from "@/components/schools/school-dialog"
import { useAuth } from "@/hooks/useAuth"
import { Skeleton } from "@/components/ui/skeleton"

interface School {
  id: string
  name: string
  address: string | null
  contact: string | null
  logoUrl: string | null
  coordinatorId: string | null
  coordinator?: {
    name: string | null
    email: string
  } | null
  createdAt: string
  updatedAt: string
}

export default function EscuelasPage() {
  const router = useRouter()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/schools")
      if (!response.ok) throw new Error("Error al cargar escuelas")
      const data = await response.json()
      setSchools(data.schools)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedSchool(null)
    setDialogOpen(true)
  }

  const handleEdit = (school: School) => {
    setSelectedSchool(school)
    setDialogOpen(true)
  }

  const handleDelete = async (schoolId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta escuela?")) return

    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Error al eliminar escuela")
      await fetchSchools()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar la escuela")
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    fetchSchools()
  }

  if (authLoading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escuelas</h1>
          <p className="text-muted-foreground">
            Gestiona las escuelas del sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Escuela
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Escuelas</CardTitle>
          <CardDescription>
            {schools.length} escuela{schools.length !== 1 ? "s" : ""} registrada{schools.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay escuelas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Coordinador</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow 
                    key={school.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/escuelas/${school.id}`)}
                  >
                    <TableCell>
                      {school.logoUrl ? (
                        <img
                          src={school.logoUrl}
                          alt={`Logo de ${school.name}`}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Sin logo
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.address || "-"}</TableCell>
                    <TableCell>{school.contact || "-"}</TableCell>
                    <TableCell>
                      {school.coordinator
                        ? school.coordinator.name || school.coordinator.email
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(school)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(school.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SchoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        school={selectedSchool}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
