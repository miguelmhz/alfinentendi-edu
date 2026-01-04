"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Mail } from "lucide-react"
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
  lastLogin: string | null
  createdAt: string
  updatedAt: string
}

export default function UsuariosPage() {
  const searchParams = useSearchParams()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [prefilledRole, setPrefilledRole] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsers()
      
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

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Error al cargar usuarios")
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setPrefilledRole(null)
    setDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Error al eliminar usuario")
      await fetchUsers()
      toast.success("Usuario eliminado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al eliminar el usuario")
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
    fetchUsers()
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay usuarios registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Escuela</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "Sin nombre"}
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.status === "INVITED" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResendInvite(user.id)}
                            title="Reenviar invitación"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
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
