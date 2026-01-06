"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, BookOpen, Users, School, GraduationCap, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { BookAccessDialog } from "@/components/book-access/book-access-dialog";

interface BookAccess {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    school: {
      id: string;
      name: string;
    } | null;
  };
  book: {
    id: string;
    title: string;
    subject: string | null;
  };
  assigner: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

export default function BookAccessManagementPage() {
  const { user, isAdmin, isCoordinator, loading: authLoading } = useAuth();
  const [accesses, setAccesses] = useState<BookAccess[]>([]);
  const [filteredAccesses, setFilteredAccesses] = useState<BookAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBook, setFilterBook] = useState<string>("all");

  const canManageAccess = isAdmin || isCoordinator;

  useEffect(() => {
    if (!authLoading && canManageAccess) {
      fetchAccesses();
    }
  }, [authLoading, canManageAccess]);

  useEffect(() => {
    let result = [...accesses];

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (access) =>
          access.user.name?.toLowerCase().includes(query) ||
          access.user.email.toLowerCase().includes(query) ||
          access.book.title.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (filterStatus !== "all") {
      result = result.filter((access) => access.status === filterStatus);
    }

    // Filtrar por libro
    if (filterBook !== "all") {
      result = result.filter((access) => access.book.id === filterBook);
    }

    setFilteredAccesses(result);
  }, [accesses, searchQuery, filterStatus, filterBook]);

  const fetchAccesses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/book-access");
      if (!response.ok) throw new Error("Error al cargar accesos");
      const data = await response.json();
      setAccesses(data.accesses || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al cargar los accesos");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchAccesses();
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const isExpired = new Date(endDate) < new Date();
    
    if (isExpired) {
      return { variant: "outline" as const, label: "Expirado" };
    }
    
    switch (status) {
      case "ACTIVE":
        return { variant: "default" as const, label: "Activo" };
      case "EXPIRED":
        return { variant: "outline" as const, label: "Expirado" };
      case "REVOKED":
        return { variant: "destructive" as const, label: "Revocado" };
      default:
        return { variant: "secondary" as const, label: status };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const uniqueBooks = Array.from(
    new Map(accesses.map((a) => [a.book.id, a.book])).values()
  );

  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          No tienes permisos para acceder a esta página
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Accesos a Libros</h1>
          <p className="text-muted-foreground">
            Asigna y administra el acceso a libros para usuarios, grupos y escuelas
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Asignar Acceso
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Accesos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accesses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accesses.filter((a) => a.status === "ACTIVE" && new Date(a.endDate) >= new Date()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accesses.filter((a) => new Date(a.endDate) < new Date()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros Únicos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueBooks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterBook("all");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar por usuario o libro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activos</SelectItem>
                  <SelectItem value="EXPIRED">Expirados</SelectItem>
                  <SelectItem value="REVOKED">Revocados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterBook} onValueChange={setFilterBook}>
                <SelectTrigger>
                  <SelectValue placeholder="Libro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los libros</SelectItem>
                  {uniqueBooks.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredAccesses.length} de {accesses.length} accesos
          </div>
        </CardContent>
      </Card>

      {/* Tabla de accesos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Accesos</CardTitle>
          <CardDescription>
            Todos los accesos asignados a usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAccesses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron accesos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Libro</TableHead>
                    <TableHead>Escuela</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Expiración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Asignado por</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccesses.map((access) => {
                    const statusBadge = getStatusBadge(access.status, access.endDate);
                    return (
                      <TableRow key={access.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {access.user.name || "Sin nombre"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {access.user.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{access.book.title}</p>
                            {access.book.subject && (
                              <p className="text-sm text-muted-foreground">
                                {access.book.subject}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {access.user.school?.name || "-"}
                        </TableCell>
                        <TableCell>{formatDate(access.startDate)}</TableCell>
                        <TableCell>{formatDate(access.endDate)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {access.assigner.name || access.assigner.email}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BookAccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
