import Link from "next/link";
import { School, Users, BookOpen, CreditCard, Bell, TrendingUp, Shield, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  stats: {
    totalSchools: number;
    totalUsers: number;
    totalLicenses: number;
    activeBooks: number;
    unreadNotifications: number;
    pendingReports: number;
    systemHealth: "healthy" | "warning" | "critical";
  };
}

export function AdminDashboard({ user, stats }: AdminDashboardProps) {
  const healthColor = {
    healthy: "text-green-500",
    warning: "text-orange-500",
    critical: "text-red-500",
  }[stats.systemHealth];

  const healthLabel = {
    healthy: "Óptimo",
    warning: "Atención",
    critical: "Crítico",
  }[stats.systemHealth];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenido, {user.name || "Administrador"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escuelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchools}</div>
            <p className="text-xs text-muted-foreground">
              Instituciones registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total en la plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licencias</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLicenses}</div>
            <p className="text-xs text-muted-foreground">
              Activas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${healthColor}`}>{healthLabel}</div>
            <p className="text-xs text-muted-foreground">
              Salud general
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Plataforma</CardTitle>
            <CardDescription>
              Administración general del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/escuelas">
                <School className="mr-2 h-4 w-4" />
                Gestión de Escuelas
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/usuarios">
                <Users className="mr-2 h-4 w-4" />
                Gestión de Usuarios
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/libros">
                <BookOpen className="mr-2 h-4 w-4" />
                Catálogo de Libros
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/licencias">
                <CreditCard className="mr-2 h-4 w-4" />
                Licencias y Suscripciones
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderación</CardTitle>
            <CardDescription>
              Revisión de contenido y reportes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/reportes">
                <Shield className="mr-2 h-4 w-4" />
                Reportes de Comentarios
                {stats.pendingReports > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {stats.pendingReports}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/notificaciones">
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
                {stats.unreadNotifications > 0 && (
                  <Badge className="ml-auto" variant="destructive">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link href="/admin/actividad">
                <Activity className="mr-2 h-4 w-4" />
                Registro de Actividad
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas del Sistema</CardTitle>
            <CardDescription>
              Requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingReports > 0 && (
                <div className="flex items-start space-x-4">
                  <Shield className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Reportes pendientes</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.pendingReports} reporte(s) por revisar
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/admin/reportes">Revisar →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.systemHealth !== "healthy" && (
                <div className="flex items-start space-x-4">
                  <Activity className={`h-5 w-5 ${healthColor} mt-0.5`} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado del sistema</p>
                    <p className="text-sm text-muted-foreground">
                      El sistema requiere atención
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/admin/sistema">Ver detalles →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.unreadNotifications > 0 && (
                <div className="flex items-start space-x-4">
                  <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notificaciones</p>
                    <p className="text-sm text-muted-foreground">
                      {stats.unreadNotifications} notificación(es) nuevas
                    </p>
                    <Button asChild size="sm" variant="link" className="h-auto p-0">
                      <Link href="/admin/notificaciones">Ver todas →</Link>
                    </Button>
                  </div>
                </div>
              )}
              {stats.pendingReports === 0 && stats.systemHealth === "healthy" && stats.unreadNotifications === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas Generales</CardTitle>
            <CardDescription>
              Métricas clave de la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Escuelas Activas</p>
                  <p className="text-2xl font-bold">{stats.totalSchools}</p>
                </div>
                <School className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Usuarios Totales</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Libros en Catálogo</p>
                  <p className="text-2xl font-bold">{stats.activeBooks}</p>
                </div>
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Uso</CardTitle>
            <CardDescription>
              Análisis de actividad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Promedio usuarios/escuela</span>
                  <span className="font-medium">
                    {stats.totalSchools > 0 
                      ? Math.round(stats.totalUsers / stats.totalSchools) 
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Licencias activas</span>
                  <span className="font-medium">{stats.totalLicenses}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Libros disponibles</span>
                  <span className="font-medium">{stats.activeBooks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tasa de adopción</span>
                  <span className="font-medium">
                    {stats.totalLicenses > 0 && stats.totalUsers > 0
                      ? Math.round((stats.totalLicenses / stats.totalUsers) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
