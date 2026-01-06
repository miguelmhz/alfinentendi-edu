'use client'

import React from 'react'
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
  // Agrega más según necesites
}

const SectionIndicator = () => {
  const pathname = usePathname()
  
  const pathnames = pathname.split('/').filter(x => x)
  
  const getDisplayName = (segment: string) => {
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
          const displayName = getDisplayName(segment)
          
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