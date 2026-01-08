"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, MoreVertical, Pencil, Trash2, Eye, Mail, Filter, ArrowUpDown } from "lucide-react"
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

interface User {
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
  groups?: {
    id: string
    name: string
    grade: {
      name: string
      level: string | null
    }
  }[]
  lastLogin: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

interface School {
  id: string
  name: string
}

interface Grade {
  id: string
  name: string
  level: string | null
}

type SortField = "name" | "email" | "createdAt" | "lastLogin"
type SortOrder = "asc" | "desc"

function UsuariosContent() {
  const searchParams = useSearchParams()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [viewMode, setViewMode] = useState<"view" | "edit">("edit")
  const [prefilledRole, setPrefilledRole] = useState<string | null>(null)
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSchool, setFilterSchool] = useState<string>("all")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("active")
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsers()
      fetchSchools()
      fetchGrades()
      
      const createParam = searchParams.get("create")
      if (createParam) {
        const roleMap: Record<string, string> = {
          coordinator: "COORDINATOR",
          teacher: "TEACHER",
          student: "STUDENT",
          admin: "ADMIN",
        }
        const role = roleMap[createParam.toLowerCase()]
        if (role) {
          setPrefilledRole(role)
          setDialogOpen(true)
        }
      }
    }
  }, [authLoading, isAdmin, searchParams])

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let result = [...users]

    // Filtrar por estado (activo/eliminado)
    if (filterStatus === "active") {
      result = result.filter(u => !u.deletedAt)
    } else if (filterStatus === "deleted") {
      result = result.filter(u => u.deletedAt)
    }

    // Búsqueda por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(u => 
        u.name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }

    // Filtrar por escuela
    if (filterSchool !== "all") {
      result = result.filter(u => u.schoolId === filterSchool)
    }

    // Filtrar por rol
    if (filterRole !== "all") {
      result = result.filter(u => u.roles.includes(filterRole))
    }

    // Filtrar por grado (a través de grupos)
    if (filterGrade !== "all") {
      result = result.filter(u => 
        u.groups?.some(g => g.grade.name === filterGrade || (grades.find(gr => gr.id === filterGrade)?.name === g.grade.name))
      )
    }

    // Ordenar
    result.sort((a, b) => {
      let aVal: any
      let bVal: any

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

    setFilteredUsers(result)
  }, [users, searchQuery, filterSchool, filterRole, filterGrade, filterStatus, sortField, sortOrder])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users?includeDeleted=true")
      if (!response.ok) throw new Error("Error al cargar usuarios")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cargar usuarios")
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

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades")
      if (!response.ok) throw new Error("Error al cargar grados")
      const data = await response.json()
      setGrades(data.grades || [])
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setPrefilledRole(null)
    setViewMode("edit")
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setViewMode("edit")
    setDialogOpen(true)
  }

  const handleView = (user: User) => {
    setSelectedUser(user)
    setViewMode("view")
    setDialogOpen(true)
  }

  const handleDelete = async (userId: string, isDeleted: boolean) => {
    const action = isDeleted ? "restaurar" : "eliminar"
    if (!confirm(`¿Estás seguro de ${action} este usuario?`)) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: isDeleted }),
      })
      if (!response.ok) throw new Error(`Error al ${action} usuario`)
      await fetchUsers()
      toast.success(`Usuario ${isDeleted ? "restaurado" : "eliminado"} exitosamente`)
    } catch (error) {
      console.error("Error:", error)
      toast.error(`Error al ${action} el usuario`)
    }
  }

  const handleResendInvite = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/resend-invite`, {
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
    setPrefilledRole(null)
    setViewMode("edit")
    fetchUsers()
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
    setFilterRole("all")
    setFilterGrade("all")
    setFilterStatus("active")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "COORDINATOR":
        return "default"
      case "TEACHER":
        return "secondary"
      case "STUDENT":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "INVITED":
        return "secondary"
      case "INACTIVE":
        return "outline"
      default:
        return "outline"
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      COORDINATOR: "Coordinador",
      TEACHER: "Profesor",
      STUDENT: "Estudiante",
      PUBLIC: "Público",
    }
    return labels[role] || role
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      INVITED: "Invitado",
      INACTIVE: "Inactivo",
    }
    return labels[status] || status
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
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus roles en el sistema
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
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
            </div>
            <div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="COORDINATOR">Coordinador</SelectItem>
                  <SelectItem value="TEACHER">Profesor</SelectItem>
                  <SelectItem value="STUDENT">Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Grado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grados</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.level ? `${grade.level} - ${grade.name}` : grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
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
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
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
                    <TableHead>Roles</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Escuela</TableHead>
                    <TableHead>Grupos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={user.deletedAt ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        {user.name || "Sin nombre"}
                        {user.deletedAt && (
                          <Badge variant="destructive" className="ml-2">Eliminado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                            >
                              {getRoleLabel(role)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.school?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {user.groups && user.groups.length > 0 ? (
                          <div className="text-sm">
                            {user.groups.slice(0, 2).map((group) => (
                              <div key={group.id}>
                                {group.name}
                              </div>
                            ))}
                            {user.groups.length > 2 && (
                              <span className="text-muted-foreground">
                                +{user.groups.length - 2} más
                              </span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            {!user.deletedAt && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(user)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                {user.status === "INVITED" && (
                                  <DropdownMenuItem onClick={() => handleResendInvite(user.id)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Reenviar invitación
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user.id, false)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.deletedAt && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id, true)}
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
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setPrefilledRole(null)
        }}
        user={selectedUser}
        prefilledRole={prefilledRole}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default function UsuariosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <UsuariosContent />
    </Suspense>
  )
}
