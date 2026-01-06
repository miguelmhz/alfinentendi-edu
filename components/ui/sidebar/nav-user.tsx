"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar/sidebar"
import { Separator } from "../separator"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type NavUserProps = {
  user: {
    id?: string
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const displayName = user.name ?? user.email ?? "Usuario"
  const displayEmail = user.email ?? "Sin correo"
  const initials = getInitials(user.name, user.email)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error("Error al cerrar sesión")
        return
      }
      
      toast.success("Sesión cerrada exitosamente")
      router.push("/auth/login")
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cerrar sesión")
    }
  }

  const handleProfile = () => {
    if (user.id) {
      router.push(`/usuarios/${user.id}`)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleProfile}
            >
              <User />
              Perfil
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .padEnd(2, "U")
  }

  if (email?.length) {
    return email[0]!.toUpperCase()
  }

  return "U"
}
