import Link from "next/link";
import { BookOpen, Users, MessageSquare, Bell, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeacherDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  stats: {
    totalStudents: number;
    activeGroups: number;
    assignedBooks: number;
    unreadNotifications: number;
    recentComments: number;
    pendingReviews: number;
  };
}

export function TeacherDashboard({ user, stats }: TeacherDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user.name || "Profesor"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tus clases y recursos educativos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              En tus grupos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGroups}</div>
            <p className="text-xs text-muted-foreground">
              Activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros Asignados</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedBooks}</div>
            <p className="text-xs text-muted-foreground">
              Material activo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">
              Sin leer
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Clases</CardTitle>
            <CardDescription>
              Administra tus grupos y estudiantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/grupos">
                <Users className="mr-2 h-4 w-4" />
                Mis Grupos
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/libros">
                <BookOpen className="mr-2 h-4 w-4" />
                Asignar Libros
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/guias">
                <FileText className="mr-2 h-4 w-4" />
                Guías de Estudio
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/recursos">
                <FileText className="mr-2 h-4 w-4" />
                Recursos Adicionales
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Interacciones y actualizaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentComments > 0 && (
                <div className="flex items-start space-x-4">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nuevos comentarios</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.recentComments} comentario(s) de estudiantes
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/guias">Ver comentarios →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.pendingReviews > 0 && (
                <div className="flex items-start space-x-4">
                  <FileText className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Revisiones pendientes</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingReviews} reporte(s) por revisar
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/reportes">Revisar →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.unreadNotifications > 0 && (
                <div className="flex items-start space-x-4">
                  <Bell className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notificaciones</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.unreadNotifications} notificación(es) nuevas
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/notificaciones">Ver todas →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.recentComments === 0 && stats.pendingReviews === 0 && stats.unreadNotifications === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Grupos</CardTitle>
          <CardDescription>
            Vista general de tus clases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Estudiantes</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Grupos Activos</p>
              <p className="text-2xl font-bold">{stats.activeGroups}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Promedio por Grupo</p>
              <p className="text-2xl font-bold">
                {stats.activeGroups > 0 
                  ? Math.round(stats.totalStudents / stats.activeGroups) 
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
