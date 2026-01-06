import Link from "next/link";
import { BookOpen, Bell, MessageSquare, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  stats: {
    activeBooks: number;
    unreadNotifications: number;
    recentComments: number;
    expiringAccess: number;
  };
}

export function StudentDashboard({ user, stats }: StudentDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user.name || "Estudiante"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Accede rápidamente a tus libros y recursos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libros Activos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBooks}</div>
            <p className="text-xs text-muted-foreground">
              Disponibles para leer
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarios</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentComments}</div>
            <p className="text-xs text-muted-foreground">
              Actividad reciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Expirar</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringAccess}</div>
            <p className="text-xs text-muted-foreground">
              Accesos próximos a vencer
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Rápido</CardTitle>
            <CardDescription>
              Accede directamente a tus recursos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/libros">
                <BookOpen className="mr-2 h-4 w-4" />
                Mis Libros
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/guias">
                <MessageSquare className="mr-2 h-4 w-4" />
                Guías de Estudio
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/notificaciones">
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
                {stats.unreadNotifications > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas actualizaciones en tus libros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.expiringAccess > 0 && (
                <div className="flex items-start space-x-4">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Accesos por expirar</p>
                    <p className="text-sm text-muted-foreground">
                      Tienes {stats.expiringAccess} libro(s) próximos a vencer
                    </p>
                  </div>
                </div>
              )}
              {stats.recentComments > 0 && (
                <div className="flex items-start space-x-4">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nuevos comentarios</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.recentComments} respuestas a tus comentarios
                    </p>
                  </div>
                </div>
              )}
              {stats.activeBooks === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
