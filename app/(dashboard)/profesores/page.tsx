"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  GraduationCap,
  Plus,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Mail,
  Users,
  Building2,
  ArrowUpDown,
  UserCheck,
  UserX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { UserDialog } from "@/components/users/user-dialog"
import { useAuth } from "@/hooks/useAuth"
import { Skeleton } from "@/components/ui/skeleton"

interface TeacherGroup {
  id: string
  name: string
  grade: {
    name: string
    level: string | null
  }
}

interface Teacher {
  id: string
  email: string
  name: string | null
  roles: string[]
  status: string
  schoolId: string | null
  school?: {
    id: string
    name: string
  } | null
  teacherGroups?: TeacherGroup[]
  lastLogin: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface School {
  id: string
  name: string
}

type SortField = "name" | "email" | "createdAt" | "lastLogin"
type SortOrder = "asc" | "desc"

function ProfesoresContent() {
  const searchParams = useSearchParams()
  const { user, isAdmin, isCoordinator, loading: authLoading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit")

  // Filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSchool, setFilterSchool] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("active")

  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    if (!authLoading && (isAdmin || isCoordinator)) {
      fetchTeachers()
      fetchSchools()

      const createParam = searchParams.get("create")
      if (createParam === "teacher") {
        setDialogOpen(true)
      }
    }
  }, [authLoading, isAdmin, searchParams])

  // Filtros y ordenamiento
  useEffect(() => {
    let result = [...teachers]

    if (filterStatus === "active") {
      result = result.filter((t) => !t.deletedAt)
    } else if (filterStatus === "deleted") {
      result = result.filter((t) => t.deletedAt)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query)
      )
    }

    if (filterSchool !== "all") {
      result = result.filter((t) => t.schoolId === filterSchool)
    }

    result.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortField) {
        case "name":
          aVal = a.name?.toLowerCase() || ""
          bVal = b.name?.toLowerCase() || ""
          break
        case "email":
          aVal = a.email.toLowerCase()
          bVal = b.email.toLowerCase()
          break
        case "createdAt":
          aVal = new Date(a.createdAt).getTime()
          bVal = new Date(b.createdAt).getTime()
          break
        case "lastLogin":
          aVal = a.lastLogin ? new Date(a.lastLogin).getTime() : 0
          bVal = b.lastLogin ? new Date(b.lastLogin).getTime() : 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredTeachers(result)
  }, [teachers, searchQuery, filterSchool, filterStatus, sortField, sortOrder])

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users?role=TEACHER&includeDeleted=true")
      if (!response.ok) throw new Error("Error al cargar profesores")
      const data = await response.json()
      setTeachers(data.users || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cargar profesores")
    } finally {
      setLoading(false)
    }
  }

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

  const handleCreate = () => {
    setSelectedTeacher(null)
    setViewMode("edit")
    setDialogOpen(true)
  }

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setViewMode("edit")
    setDialogOpen(true)
  }

  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setViewMode("view")
    setDialogOpen(true)
  }

  const handleDelete = async (teacherId: string, isDeleted: boolean) => {
    const action = isDeleted ? "restaurar" : "eliminar"
    if (!confirm(`¿Estás seguro de ${action} este profesor?`)) return

    try {
      const response = await fetch(`/api/users/${teacherId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: isDeleted }),
      })
      if (!response.ok) throw new Error(`Error al ${action} profesor`)
      await fetchTeachers()
      toast.success(`Profesor ${isDeleted ? "restaurado" : "eliminado"} exitosamente`)
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Error al ${action} el profesor`)
    }
  }

  const handleResendInvite = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/users/${teacherId}/resend-invite`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Error al reenviar invitación")
      toast.success("Invitación reenviada exitosamente")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al reenviar la invitación")
    }
  }

  const handleSuccess = () => {
    setDialogOpen(false)
    fetchTeachers()
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setFilterSchool("all")
    setFilterStatus("active")
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default" as const
      case "INVITED":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      INVITED: "Invitado",
      INACTIVE: "Inactivo",
    }
    return labels[status] || status
  }

  // Stats calculadas client-side
  const activeTeachers = teachers.filter((t) => !t.deletedAt && t.status === "ACTIVE")
  const invitedTeachers = teachers.filter((t) => !t.deletedAt && t.status === "INVITED")
  const withoutSchool = teachers.filter((t) => !t.deletedAt && !t.schoolId)

  if (authLoading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[160px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isAdmin && !isCoordinator) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No tienes permisos para acceder a esta página</p>
      </div>
    )
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profesores</h1>
          <p className="text-muted-foreground">
            Gestiona los profesores y sus grupos de enseñanza
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Profesor
        </Button>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isAdmin ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.filter((t) => !t.deletedAt).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isCoordinator && !isAdmin
                ? `En ${user?.name ? "tu escuela" : "tu escuela"}`
                : "Profesores registrados"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeachers.length}</div>
            <p className="text-xs text-muted-foreground">Con acceso activo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invitados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitedTeachers.length}</div>
            <p className="text-xs text-muted-foreground">Pendientes de activar</p>
          </CardContent>
        </Card>
        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin escuela</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{withoutSchool.length}</div>
              <p className="text-xs text-muted-foreground">Sin asignación</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isAdmin && (
              <Select value={filterSchool} onValueChange={setFilterSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Escuela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las escuelas</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="deleted">Eliminados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredTeachers.length} de {teachers.length} profesores
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profesores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">
                {teachers.length === 0
                  ? "No hay profesores registrados"
                  : "No se encontraron profesores con los filtros aplicados"}
              </p>
              {teachers.length === 0 && (
                <Button className="mt-4" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primer profesor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className="-ml-3 h-8"
                      >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort("email")}
                        className="-ml-3 h-8"
                      >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        Escuela
                      </span>
                    </TableHead>
                    <TableHead>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Grupos
                      </span>
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSort("lastLogin")}
                        className="-ml-3 h-8"
                      >
                        Último acceso
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      className={teacher.deletedAt ? "opacity-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {teacher.name || "Sin nombre"}
                        {teacher.deletedAt && (
                          <Badge variant="destructive" className="ml-2">
                            Eliminado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher.email}
                      </TableCell>
                      <TableCell>
                        {teacher.school?.name ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {teacher.school.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin escuela</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.teacherGroups && teacher.teacherGroups.length > 0 ? (
                          <div className="text-sm space-y-0.5">
                            {teacher.teacherGroups.slice(0, 2).map((group) => (
                              <div key={group.id} className="flex items-center gap-1">
                                <span className="font-medium">{group.name}</span>
                                {group.grade.level && (
                                  <span className="text-muted-foreground text-xs">
                                    · {group.grade.level}
                                  </span>
                                )}
                              </div>
                            ))}
                            {teacher.teacherGroups.length > 2 && (
                              <span className="text-muted-foreground text-xs">
                                +{teacher.teacherGroups.length - 2} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin grupos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(teacher.status)}>
                          {getStatusLabel(teacher.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {teacher.lastLogin
                          ? new Date(teacher.lastLogin).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(teacher)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            {!teacher.deletedAt && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                {teacher.status === "INVITED" && (
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(teacher.id)}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Reenviar invitación
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(teacher.id, false)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                            {teacher.deletedAt && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(teacher.id, true)}
                                className="text-green-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Restaurar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={(open) => setDialogOpen(open)}
        user={selectedTeacher}
        prefilledRole="TEACHER"
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default function ProfesoresPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Cargando...
        </div>
      }
    >
      <ProfesoresContent />
    </Suspense>
  )
}
