"use client"

import * as React from "react"
import {
  BookOpen,
  GraduationCap,
  School,
  Users,
  Settings,
  BookMarked,
  FileText,
  Layers,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar/sidebar"
import { NavMain } from "../ui/sidebar/nav-main"
import { NavProjects } from "../ui/sidebar/nav-projects"
import { NavUser } from "../ui/sidebar/nav-user"
import { useAuth } from "@/hooks/useAuth"

const adminNavigation = [
  {
    title: "Accesos",
    url: "#",
    icon: Layers,
    isActive: true,
    items: [
      {
        title: "Escuelas",
        url: "/escuelas",
      },
      {
        title: "Profesores",
        url: "/profesores",
      },
      {
        title: "Grados y Grupos",
        url: "/grados-grupos",
      },
    ],
  },
  {
    title: "Materias",
    url: "#",
    icon: BookOpen,
    items: [
      {
        title: "Libros",
        url: "/libros",
      },
      {
        title: "Guias",
        url: "/guias",
      },
    ],
  },
  {
    title: "Configuración",
    url: "#",
    icon: Settings,
    items: [
      {
        title: "Usuarios",
        url: "/usuarios",
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, loading } = useAuth()
  const navUser = React.useMemo(
    () => ({
      name: user?.name ?? user?.email ?? (loading ? "Cargando..." : "Usuario"),
      email: user?.email ?? (loading ? "Obteniendo datos" : "Sin correo"),
      avatar: null,
    }),
    [user?.name, user?.email, loading],
  )

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="top-[95px]"
      style={{
        height: "calc(100vh - 95px)",
      }}
      {...props}
    >
      <SidebarHeader>
        <NavUser user={navUser} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminNavigation} />
      </SidebarContent>
    </Sidebar>
  )
}
