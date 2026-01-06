import Link from "next/link";
import { School, Users, BookOpen, CreditCard, Bell, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CoordinatorDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  stats: {
    totalStudents: number;
    totalTeachers: number;
    activeLicenses: number;
    expiringLicenses: number;
    unreadNotifications: number;
    schoolName: string;
  };
}

export function CoordinatorDashboard({ user, stats }: CoordinatorDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user.name || "Coordinador"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Panel de administración de {stats.schoolName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Total registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profesores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Expirar</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Próximas a vencer
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
            <CardTitle>Gestión Escolar</CardTitle>
            <CardDescription>
              Administra tu institución educativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/escuela">
                <School className="mr-2 h-4 w-4" />
                Mi Escuela
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/usuarios">
                <Users className="mr-2 h-4 w-4" />
                Gestión de Usuarios
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/suscripciones">
                <CreditCard className="mr-2 h-4 w-4" />
                Suscripciones y Licencias
                {stats.expiringLicenses > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {stats.expiringLicenses}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/libros">
                <BookOpen className="mr-2 h-4 w-4" />
                Catálogo de Libros
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Importantes</CardTitle>
            <CardDescription>
              Requieren tu atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.expiringLicenses > 0 && (
                <div className="flex items-start space-x-4">
                  <CreditCard className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Licencias por expirar</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.expiringLicenses} licencia(s) próximas a vencer
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/suscripciones">Ver detalles →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.unreadNotifications > 0 && (
                <div className="flex items-start space-x-4">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notificaciones pendientes</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.unreadNotifications} notificación(es) sin leer
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/notificaciones">Ver todas →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.expiringLicenses === 0 && stats.unreadNotifications === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
          <CardDescription>
            Estadísticas generales de tu institución
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total de Usuarios</p>
              <p className="text-2xl font-bold">{stats.totalStudents + stats.totalTeachers}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Licencias Activas</p>
              <p className="text-2xl font-bold">{stats.activeLicenses}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tasa de Uso</p>
              <p className="text-2xl font-bold">
                {stats.activeLicenses > 0 
                  ? Math.round((stats.totalStudents / stats.activeLicenses) * 100) 
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
