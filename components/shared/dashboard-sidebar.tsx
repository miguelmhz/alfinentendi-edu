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
  Home,
  Video,
  FileQuestion,
  FolderOpen,
  UserCircle,
  CreditCard,
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

const publicNavigation = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "Contenido",
    url: "#",
    icon: BookOpen,
    items: [
      {
        title: "Libros",
        url: "/libros",
      },
      {
        title: "Videos",
        url: "/videos",
      },
      {
        title: "Guías",
        url: "/guias",
      },
      {
        title: "Recursos",
        url: "/recursos",
      },
    ],
  },
  {
    title: "Configuración",
    url: "#",
    icon: Settings,
    items: [
      {
        title: "Perfil",
        url: "/perfil",
      },
      {
        title: "Suscripciones",
        url: "/suscripciones",
      },
    ],
  },
]

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
        title: "Accesos a Libros",
        url: "/accesos-libros",
      },
    ],
  },
  {
    title: "Contenido",
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
  const { user, loading, isAdmin } = useAuth()
  const navUser = React.useMemo(
    () => ({
      id: user?.id,
      name: user?.name ?? user?.email ?? (loading ? "Cargando..." : "Usuario"),
      email: user?.email ?? (loading ? "Obteniendo datos" : "Sin correo"),
      avatar: undefined,
    }),
    [user, loading]
  )

  const navigation = isAdmin ? adminNavigation : publicNavigation

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
        <NavMain items={navigation} />
      </SidebarContent>
    </Sidebar>
  )
}
