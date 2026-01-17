'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Mapa de rutas a nombres personalizados
const routeNames: Record<string, string> = {
  'dashboard': 'Panel de Control',
  'productos': 'Productos',
  'configuracion': 'Configuración',
  'perfil': 'Mi Perfil',
  'usuarios': 'Usuarios',
  'libros': 'Libros',
  'vista': 'Lector',
  'mis-libros': 'Mis Libros',
  // Agrega más según necesites
}

// Regex para detectar UUIDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SectionIndicator = () => {
  const pathname = usePathname()
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  
  const pathnames = pathname.split('/').filter(x => x)
  
  // Detectar y cargar nombres de usuarios
  useEffect(() => {
    const userIds = pathnames.filter(segment => UUID_REGEX.test(segment))
    
    if (userIds.length > 0) {
      // Cargar nombres de usuarios
      userIds.forEach(async (userId) => {
        if (!userNames[userId]) {
          try {
            const response = await fetch(`/api/users/${userId}`)
            if (response.ok) {
              const data = await response.json()
              setUserNames(prev => ({
                ...prev,
                [userId]: data.name || 'Usuario'
              }))
            }
          } catch (error) {
            console.error('Error fetching user name:', error)
          }
        }
      })
    }
  }, [pathname])
  
  const getDisplayName = (segment: string, index: number) => {
    // Si es un UUID, intentar mostrar el nombre del usuario
    if (UUID_REGEX.test(segment)) {
      return userNames[segment] || 'Cargando...'
    }
    
    // Si existe en el mapa, usar ese nombre
    if (routeNames[segment]) {
      return routeNames[segment]
    }
    
    // Si no, capitalizar y limpiar
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="text-primary text-base lg:text-2xl font-bold">EDU</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathnames.map((segment, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1
          const displayName = getDisplayName(segment, index)
          
          return (
            <React.Fragment key={routeTo}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-xs lg:text-xl">{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link className="text-xs lg:text-xl" href={routeTo}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default SectionIndicator