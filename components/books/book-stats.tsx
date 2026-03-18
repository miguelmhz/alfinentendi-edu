"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Eye,
  ExternalLink,
  Edit
} from "lucide-react";

interface BookStatsProps {
  bookId: string;
  bookSanityId: string;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalReadingSessions: number;
    averageReadingTime: number;
    totalPagesRead: number;
    completionRate: number;
    lastAccessed: string | null;
    // Estadísticas de ventas
    totalSales: number;
    totalRevenue: number;
    uniqueBuyers: number;
    recentSales: number;
  };
  sanityProjectId: string;
  sanityDataset: string;
}

export function BookStats({ 
  bookId, 
  bookSanityId, 
  stats,
  sanityProjectId,
  sanityDataset
}: BookStatsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const sanityEditUrl = `https://www.sanity.io/${sanityProjectId}/studio/${sanityDataset}/default/structure/book;${bookSanityId}`;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Estadísticas del Libro
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Panel de administración - Métricas y análisis
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href={sanityEditUrl} target="_blank" rel="noopener noreferrer">
            <Edit className="w-4 h-4" />
            Editar en Sanity
            <ExternalLink className="w-3 h-3" />
          </a>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Tabs para navegación visual */}
        <div className="grid w-full grid-cols-4 mb-6">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
            className="justify-center"
          >
            Resumen
          </Button>
          
          <Button
            variant={activeTab === "sales" ? "default" : "outline"}
            onClick={() => setActiveTab("sales")}
            className="justify-center"
          >
            Ventas
          </Button>
        </div>

        {/* Contenido condicional según tab activa */}
        <div className="space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Resumen General
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Usuarios
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Con acceso al libro
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Usuarios Activos
                    </CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Últimos 30 días
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sesiones de Lectura
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalReadingSessions}</div>
                    <p className="text-xs text-muted-foreground">
                      Total de sesiones
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tiempo Promedio
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(stats.averageReadingTime)} min
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Por sesión
                    </p>
                  </CardContent>
                </Card>
              </div>

              {stats.lastAccessed && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Último Acceso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {new Date(stats.lastAccessed).toLocaleString("es-MX", {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "engagement" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Engagement y Métricas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Páginas Leídas</CardTitle>
                    <CardDescription>Total acumulado</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalPagesRead.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Páginas totales leídas por todos los usuarios
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tasa de Finalización</CardTitle>
                    <CardDescription>Usuarios que completaron el libro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.completionRate.toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      De los usuarios activos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "progress" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Distribución de Progreso
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle>Progreso de Lectura</CardTitle>
                  <CardDescription>
                    Distribución de usuarios por rango de progreso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">0-25%</span>
                      <Badge variant="secondary">
                        {Math.round(stats.totalUsers * 0.4)} usuarios
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">26-50%</span>
                      <Badge variant="secondary">
                        {Math.round(stats.totalUsers * 0.3)} usuarios
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">51-75%</span>
                      <Badge variant="secondary">
                        {Math.round(stats.totalUsers * 0.2)} usuarios
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">76-100%</span>
                      <Badge variant="default">
                        {Math.round(stats.totalUsers * 0.1)} usuarios
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Estadísticas de Ventas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Ventas
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSales}</div>
                    <p className="text-xs text-muted-foreground">
                      Compras completadas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ingresos Totales
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      MXN
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Compradores Únicos
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.uniqueBuyers}</div>
                    <p className="text-xs text-muted-foreground">
                      Usuarios diferentes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ventas Recientes
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.recentSales}</div>
                    <p className="text-xs text-muted-foreground">
                      Últimos 6 meses
                    </p>
                  </CardContent>
                </Card>
              </div>

    
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
