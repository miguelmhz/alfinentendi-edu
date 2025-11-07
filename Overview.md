# Plataforma de Libros Digitales Educativos

## 📋 Descripción General

Plataforma web educativa para gestión y acceso a contenido digital (libros/PDFs) con sistema de permisos por roles, acceso temporal controlado y monetización por alumno/libro.

---

## 🎯 Objetivo

Facilitar el acceso a material educativo digital con control granular de permisos, permitiendo a profesores gestionar sus alumnos y asignar recursos por períodos específicos de tiempo.

---

## 👥 Roles de Usuario

### 1. **Admin**
- Gestión completa de la plataforma
- CRUD de libros, usuarios y escuelas
- Control de accesos y permisos
- Analytics y métricas
- **Autenticación:** Email + Password

### 2. **Coordinador**
- Gestión de su escuela
- Asignar libros por grado o grupo
- Ver todas las anotaciones de su escuela
- Moderar el foro docente
- Ver reportes y analytics de su escuela
- Gestionar profesores y grupos
- **Autenticación:** Email + Password

### 3. **Profesor**
- Registrar y gestionar sus alumnos
- Asignar libros con períodos temporales (individual o por grupo)
- Acceso a libros y recursos de docente
- Ver reportes de sus alumnos
- Ver anotaciones de sus alumnos
- Participar en el foro docente
- **Autenticación:** Email + Password

### 4. **Alumno**
- Acceso a libros asignados por su profesor
- Leer online con anotaciones personales
- Descargar libros (si está permitido)
- Lectura offline
- **Autenticación:** Magic Link (sin password)

### 5. **Público General**
- Acceso a libros gratuitos/demo
- Navegación sin registro
- Opción de registro para más contenido

---

## ⏰ Sistema de Accesos Temporales

### Modelo de Negocio
- Profesor define: **Alumnos + Libros + Período de tiempo**
- Sistema controla acceso mediante ventanas temporales
- Alertas automáticas 15 días antes de expiración
- Renovaciones y extensiones disponibles

### Ejemplo:
```
30 alumnos × 3 libros × 6 meses (semestre escolar)
```

### Estados de Acceso:
- `INVITED`: Alumno invitado, pendiente de activar
- `ACTIVE`: Acceso vigente dentro del período
- `EXPIRED`: Período terminado, acceso denegado
- `SUSPENDED`: Suspendido manualmente por admin

---

## 🏗️ Arquitectura Técnica

### Stack Principal

```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript
├── TailwindCSS + Shadcn/ui
├── React-PDF (visor)
└── Zustand (state)

Backend:
├── Next.js API Routes
├── Prisma ORM
└── Node.js

Infraestructura:
├── Supabase (PostgreSQL + Storage)
├── Sanity CMS (metadata de libros)
├── Resend/SendGrid (emails)
├── Cloudflare (CDN)
└── Vercel (hosting)
```

### Separación de Responsabilidades

**Sanity CMS:**
- Metadata de libros (título, descripción, autor, ISBN)
- Imágenes de portadas (CDN de Sanity)
- **Storage de PDFs** (archivos completos con CDN)
- Categorías y taxonomía
- Editor visual para admins
- URLs de assets con CDN global

**Supabase:**
- Base de datos relacional (usuarios, accesos, anotaciones)
- Autenticación (JWT)
- Row Level Security
- Gestión de permisos y accesos temporales

---

## 🗄️ Modelo de Base de Datos (Actualizado)

### Relaciones de Libros

Cada libro se puede asociar a:

| Entidad | Relación | Ejemplo |
|---------|----------|----------|
| **Grado** | 1:N | "Tercer Grado de Primaria" |
| **Grupo** | 1:N | "3°A - Matemáticas" |
| **Profesor** | 1:N | Propietario de la asignación |
| **Alumno** | N:M (vía book_access) | Acceso temporal al libro |

### Tablas Clave

#### **schools**
- Datos generales de la institución
- Relación con coordinador
- **Campos:** `name`, `address`, `contact`, `coordinatorId`

#### **users**
- **Roles:** Array de `admin`, `coordinator`, `teacher`, `student`, `public`
- **Múltiples roles permitidos** (ej. coordinador puede ser también profesor)
- Asociado a `schoolId`
- Campo `createdBy` (quién lo registró)
- **Campos extra:** `roles[]`, `status`, `lastLogin`
- Password solo para admin/profesor/coordinador (hash)
- Alumnos usan Magic Link/OTP de Supabase Auth

#### **grades**
- Representa grados escolares (ej. "Primaria - 3°")
- **Campos:** `name`, `level`, `schoolId`

#### **groups**
- Agrupa alumnos dentro de un grado
- **Campos:** `name`, `gradeId`, `teacherId`

#### **books**
- Referencia al documento en Sanity
- **Campos:** `sanityId`, `title`, `gradeId`, `subject`, `isDownloadable`, `version`
- URL del PDF desde Sanity (`pdfUrl` - generada por Sanity CDN)
- Control de acceso (`accessType`, `targetAudience`)

#### **book_access** ⭐
- **Control de acceso temporal INDIVIDUAL**
- **Campos:** `userId`, `bookId`, `assignedBy`, `startDate`, `endDate`, `isActive`, `status`, `groupId?`, `gradeId?`
- Relación usuario-libro-otorgante
- Estados: `INVITED`, `ACTIVE`, `EXPIRED`, `SUSPENDED`
- **Importante:** Cada alumno tiene su propio registro, incluso si fue asignado por grupo
- `groupId` y `gradeId` son opcionales para tracking de asignaciones masivas

#### **annotations**
- Notas personales o visibles según rol
- **Campos:** `userId`, `bookId`, `page`, `type`, `content`, `visibility`
- **Visibility:** `"private"` | `"teacher"` | `"coordinator"` (para reportes o revisión)
- Sincronización entre dispositivos

#### **forum_posts** (Manejado en Sanity CMS)
- Foro Docente (solo profesor y coordinador)
- **Gestionado completamente en Sanity** para aprovechar:
  - Rich text editor
  - Adjuntos y multimedia
  - Versionamiento
  - Preview y drafts
- Referenciado desde el frontend por `schoolId`

#### **sessions**
- Sesiones JWT con refresh tokens
- Tracking de dispositivos
- Expiración configurable por rol

#### **additional_resources**
- Recursos descargables para profesores
- PDFs, videos, documentos adicionales

#### **notifications**
- Sistema de alertas automáticas
- Notificaciones de expiración
- Mensajes del sistema

---

## 🔄 Flujos de Trabajo Clave

### 1. Onboarding de Alumno

```
1. Profesor agrega email del alumno
   ├── Sistema crea usuario con status INVITED
   └── Envía Magic Link + código de 6 dígitos

2. Alumno recibe email
   └── Click en Magic Link (gestionado por Supabase Auth)

3. Primera sesión
   ├── Status cambia a ACTIVE
   ├── Sesión válida por 7 días
   └── Ve biblioteca con libros asignados
```

### 2. Asignación de Libros por Grupo o Grado

```
1. Coordinador o Profesor selecciona grupo/grado
   ├── Selecciona grupo específico (ej. "3°A - Matemáticas")
   └── O selecciona grado completo (ej. "Tercer Grado de Primaria")

2. Selecciona libros disponibles
   ├── Libros desde Sanity filtrados por grado/materia
   └── Puede seleccionar múltiples libros

3. Define período de acceso
   ├── Fecha de inicio
   └── Fecha de fin

4. Sistema crea registros book_access INDIVIDUALES
   ├── Un registro por cada alumno en el grupo/grado
   ├── Con las fechas definidas (mismo período para todos)
   ├── Incluye `groupId` o `gradeId` para tracking
   └── Estado inicial: ACTIVE

5. Notificaciones automáticas
   ├── Email a cada alumno con acceso al libro
   └── Notificación in-app para el profesor
```

### 3. Asignación de Libros Temporal (Individual)

```
1. Profesor selecciona:
   ├── Alumnos (individual o múltiples)
   ├── Libros disponibles
   └── Período (fecha inicio/fin)

2. Sistema crea registros BookAccess
   └── Con ventana temporal definida

3. Verificación en cada acceso:
   ├── ¿Fecha actual entre startDate y endDate?
   ├── ¿isActive = true?
   └── ¿Usuario status = ACTIVE?

4. Al expirar:
   ├── Libro desaparece de biblioteca del alumno
   ├── Notificación automática enviada
   └── Profesor puede renovar si lo desea
```

### 4. Visualización de Anotaciones

```
1. Alumno
   └── Ve solo sus anotaciones (visibility = "private")

2. Profesor
   ├── Ve sus propias anotaciones
   └── Ve anotaciones de sus alumnos (visibility = "teacher" o "coordinator")

3. Coordinador
   ├── Ve todas las anotaciones de su escuela
   └── Puede generar reportes de anotaciones por grado/grupo
```

### 5. Foro Docente

```
1. Profesor o coordinador crea un post
   ├── Título y contenido
   ├── Tags opcionales (ej. "Matemáticas", "Recursos")
   └── Visible solo dentro de su escuela

2. Otros profesores/coordinadores pueden comentar
   ├── Respuestas anidadas
   └── Notificaciones al autor del post

3. Moderación por coordinador
   ├── Puede editar o eliminar posts
   ├── Puede destacar posts importantes
   └── Puede cerrar discusiones
```

### 6. Lectura de Libro

```
1. Usuario abre libro
   └── Verificación de acceso en Supabase

2. Backend obtiene URL del PDF desde Sanity
   ├── Valida permisos del usuario
   └── Genera token de acceso temporal

3. Visor PDF carga con:
   ├── URL del PDF desde Sanity CDN
   ├── Lazy loading de páginas
   ├── Anotaciones previas del usuario
   └── Opciones de subrayado/notas

4. Anotaciones se guardan:
   ├── En tiempo real en Supabase
   └── Sincronización entre dispositivos
```

---

## 🔐 Sistema de Autenticación Dual

### Magic Link (Alumnos) - Supabase Auth

```typescript
// Usando Supabase Auth directamente
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'alumno@email.com',
  options: {
    emailRedirectTo: 'https://tu-app.com/auth/callback'
  }
})

Flujo:
├── Supabase envía email con link mágico
├── Alumno hace click
├── Redirige a /auth/callback
└── Sesión creada automáticamente

Expiración:
└── Configurable en Supabase (default: 1 hora para el link)
```

### Password (Admin/Profesor)

```typescript
POST /api/auth/login
Body: { email: "profesor@escuela.com", password: "xxx" }

Response:
├── accessToken (JWT)
├── refreshToken
└── userData

Expiración:
├── Admin: 24 horas (mayor seguridad)
└── Profesor: 30 días
```

---

## 📚 Funcionalidades del Visor de Libros

### Para Todos los Usuarios:
- ✅ Vista tipo Adobe Acrobat
- ✅ Navegación por páginas (barra + miniaturas)
- ✅ Modo 1 o 2 páginas
- ✅ Zoom in/out
- ✅ Búsqueda en el documento
- ✅ Enlaces internos/externos funcionales
- ✅ Scroll fluido o paginado

### Solo Usuarios Registrados (Restringido):
- ✅ **Anotaciones personales** (privadas)
- ✅ **Subrayado de texto** (múltiples colores)
- ✅ **Panel de notas** lateral
- ✅ **Lectura offline** (PWA)
- ✅ **Sincronización** entre dispositivos
- ✅ **Progreso de lectura** guardado
- ✅ **Descarga PDF** (si `isDownloadable = true`)

### Protecciones de Copyright:
- 🔒 URLs firmadas temporales (1 hora)
- 🔒 Watermark dinámico con email del usuario
- 🔒 Rate limiting en descargas
- 🔒 Deshabilitar menú contextual
- 🔒 Lazy loading (no se descarga todo el PDF)

---

## 📊 Paneles de Usuario

### Dashboard Admin

```
├── 📈 Estadísticas Generales
│   ├── Total usuarios activos
│   ├── Libros en plataforma
│   ├── Descargas del mes
│   ├── Accesos próximos a expirar
│   └── Gráficas de uso
│
├── 👥 Gestión de Usuarios
│   ├── Listar/crear/editar/eliminar
│   ├── Cambiar roles y estados
│   ├── Ver historial de accesos
│   └── Importación masiva (CSV)
│
├── 📚 Gestión de Libros
│   ├── Integración con Sanity Studio
│   ├── Subir PDFs a Sanity (con CDN automático)
│   ├── Configurar acceso y permisos
│   └── Activar/desactivar libros
│
├── 🏫 Gestión de Escuelas
│   ├── CRUD de escuelas
│   ├── Asignar profesores
│   └── Ver métricas por escuela
│
└── 🔑 Control de Accesos
    ├── Asignación masiva de libros
    ├── Extender períodos
    ├── Revocar accesos
    └── Ver historial de cambios
```

### Dashboard Coordinador

```
├── 🏫 Mi Escuela
│   ├── Información general de la escuela
│   ├── Total de profesores, alumnos y grupos
│   ├── Libros activos en la escuela
│   └── Estadísticas de uso
│
├── 📋 Grados y Grupos
│   ├── CRUD de grados (ej. "Primaria - 3°")
│   ├── CRUD de grupos (ej. "3°A - Matemáticas")
│   ├── Asignar profesores a grupos
│   └── Ver alumnos por grupo
│
├── 📚 Asignar Libros
│   ├── Asignación por grado completo
│   ├── Asignación por grupo específico
│   ├── Definir período de acceso
│   └── Ver historial de asignaciones
│
├── 📝 Anotaciones y Reportes
│   ├── Ver todas las anotaciones de la escuela
│   ├── Filtrar por grado, grupo o alumno
│   ├── Generar reportes de uso
│   └── Exportar datos (CSV/PDF)
│
├── 💬 Foro Docente
│   ├── Ver y crear posts
│   ├── Moderar discusiones
│   ├── Destacar posts importantes
│   └── Cerrar o eliminar posts
│
└── 📈 Analytics
    ├── Alumnos activos vs inactivos
    ├── Libros más utilizados por grado
    ├── Accesos por expirar
    └── Estadísticas de profesores
```

### Dashboard Profesor

```
├── 👨‍🎓 Mis Alumnos
│   ├── Agregar alumnos (emails individuales o masivos)
│   ├── Ver lista completa con estados
│   ├── Reenviar invitaciones
│   └── Ver libros asignados por alumno
│
├── 📚 Asignar Libros
│   ├── Seleccionar uno o varios alumnos o grupo completo
│   ├── Elegir libros disponibles
│   ├── Definir período (inicio/fin)
│   └── Confirmar y notificar
│
├── 📖 Mi Biblioteca
│   ├── Libros de docente
│   ├── Recursos descargables
│   └── Guías y materiales adicionales
│
├── 📝 Anotaciones de Alumnos
│   ├── Ver anotaciones de sus alumnos
│   ├── Filtrar por alumno o libro
│   └── Generar reportes
│
├── 💬 Foro Docente
│   ├── Ver posts de la escuela
│   ├── Crear nuevos posts
│   ├── Comentar en discusiones
│   └── Buscar por tags
│
└── 📊 Reportes y Analytics
    ├── Alumnos activos vs inactivos
    ├── Libros más utilizados
    ├── Accesos por expirar (próximos 30 días)
    └── Descargas por libro
```

### Dashboard Alumno

```
├── 📚 Mi Biblioteca
│   ├── Libros activos (con acceso)
│   ├── Filtros por materia/categoría
│   └── Indicador de tiempo restante
│
├── 📖 Continuar Leyendo
│   ├── Últimos libros abiertos
│   └── Progreso de lectura
│
├── 📝 Mis Notas
│   ├── Ver todas las anotaciones
│   ├── Filtrar por libro
│   └── Buscar en notas
│
└── ⚙️ Configuración
    ├── Sesiones activas (dispositivos)
    └── Preferencias de lectura
```

---

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones

1. **ACCESS_GRANTED**
   - Cuando se te asigna un nuevo libro
   - En app + email

2. **ACCESS_EXPIRING**
   - 15 días antes de expiración
   - En app + email al alumno y profesor

3. **ACCESS_EXPIRED**
   - Cuando el acceso termina
   - Solo en app

4. **STUDENT_ADDED**
   - Bienvenida cuando eres agregado como alumno
   - Email con Magic Link

5. **NEW_RESOURCE**
   - Nuevo material disponible para profesores
   - En app

6. **SYSTEM**
   - Mantenimientos, actualizaciones
   - En app

### Cron Jobs Automatizados

```javascript
// Ejecutar diariamente a las 9:00 AM
- Verificar accesos que expiran en 15 días
- Enviar notificaciones a alumnos y profesores
- Marcar accesos expirados como EXPIRED
- Generar reporte diario para admin
```

---

## 💰 Modelo de Monetización

### Fase Actual (Manual)
- Profesor contacta por WhatsApp/Email
- Negociación de precio y condiciones
- Admin crea accesos manualmente en la plataforma
- Pago fuera de plataforma (transferencia/efectivo)

### Fase Futura (Automatizada)
```
Integración con Stripe/MercadoPago:

├── Paquetes Predefinidos
│   ├── Básico: 1 libro × 10 alumnos × 3 meses
│   ├── Estándar: 3 libros × 30 alumnos × 6 meses
│   ├── Premium: 5 libros × 50 alumnos × 12 meses
│   └── Personalizado: Configuración a medida
│
├── Checkout Online
│   ├── Profesor selecciona paquete
│   ├── Ingresa lista de emails de alumnos
│   ├── Paga con tarjeta/transferencia
│   └── Recibe factura automática
│
└── Activación Inmediata
    ├── Sistema crea todos los accesos
    ├── Envía invitaciones a alumnos
    └── Notifica al profesor del éxito
```

---

## 🔒 Seguridad y Protección

### Protección de PDFs
- URLs de Sanity CDN con tokens de acceso
- Validación de permisos en backend antes de servir PDF
- Watermark dinámico con email del usuario (procesado en servidor)
- Control de descarga según flag `isDownloadable`
- Lazy loading: solo se transmiten páginas vistas
- Sanity CDN con caché global optimizado

### Seguridad General
- Rate limiting en todas las APIs
- JWT con refresh tokens
- Encriptación de passwords con bcrypt (12 rounds)
- CORS configurado correctamente
- Validación de inputs (Zod)
- SQL injection protection (Prisma ORM)
- XSS protection
- HTTPS obligatorio en producción

### Control de Sesiones
- Máximo 3 dispositivos simultáneos por usuario
- Opción de cerrar sesiones remotas
- Tracking de IP y user agent
- Expiración automática de sesiones inactivas

---

## 📱 PWA y Funcionalidad Offline

### Service Worker
```javascript
Caché de recursos:
├── Páginas estáticas (layout, navegación)
├── Assets (iconos, logos)
├── Libros abiertos recientemente (últimas 50 páginas)
└── Anotaciones locales (sync cuando vuelva online)

Estrategia:
├── Network First: APIs (datos frescos)
├── Cache First: Assets estáticos
└── Stale While Revalidate: Libros
```

### Sincronización
- Anotaciones se guardan en IndexedDB localmente
- Background sync cuando vuelve conexión
- Indicador visual de sincronización pendiente
- Resolución de conflictos (last-write-wins)

---

## 📈 Métricas y Analytics

### Métricas del Sistema
- Usuarios activos diarios (DAU)
- Usuarios activos mensuales (MAU)
- Libros más leídos
- Libros más descargados
- Tiempo promedio de lectura
- Páginas más anotadas
- Tasa de renovación de accesos

### Métricas por Escuela
- Total alumnos activos
- Libros en uso
- Accesos próximos a expirar
- Tasa de uso (alumnos que leen vs asignados)

### Métricas por Profesor
- Alumnos gestionados
- Libros asignados
- Tasa de activación (invited → active)
- Alumnos más activos

---

## 🚀 Roadmap de Desarrollo

### Fase 1: MVP (Semanas 1-4)
- [ ] Setup de proyecto (Next.js + Supabase + Sanity)
- [ ] Autenticación dual (Magic Link + Password)
- [ ] CRUD básico de usuarios
- [ ] Sistema de accesos temporales
- [ ] Subida de PDFs
- [ ] Visor básico de libros
- [ ] Panel admin básico

### Fase 2: Core Features (Semanas 5-6)
- [ ] Panel de profesor completo
- [ ] Sistema de anotaciones y subrayados
- [ ] Lectura offline (PWA)
- [ ] Sistema de notificaciones
- [ ] Recursos adicionales para profesores
- [ ] Métricas básicas

### Fase 3: Optimización (Semanas 7-8)
- [ ] Optimización de performance
- [ ] Compresión de PDFs
- [ ] CDN con Cloudflare
- [ ] Testing completo (unit + e2e)
- [ ] Documentación de usuario
- [ ] Deploy a producción

### Fase 4: Post-Lanzamiento
- [ ] Recopilar feedback de usuarios
- [ ] Foro de profesores (opcional)
- [ ] Integración de pagos (Stripe/MercadoPago)
- [ ] App móvil (React Native - opcional)
- [ ] Gamificación (logros, badges - opcional)

---

## 📦 Entregables

### Documentación Técnica
- README con instrucciones de setup
- Documentación de API
- Guía de contribución
- Diagrama de arquitectura
- Schema de base de datos

### Documentación de Usuario
- Manual para administradores
- Guía para profesores
- Tutorial para alumnos
- FAQs
- Videos tutoriales

### Código
- Repositorio en GitHub
- CI/CD configurado
- Tests automatizados
- Linting y formatting (ESLint + Prettier)
- Git hooks (Husky)

---

## 🌐 Configuración de Entornos

### Development
```bash
# Local
DATABASE_URL=postgresql://localhost:5432/biblioteca_dev
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SANITY_STUDIO_URL=http://localhost:3333

# Sin costos
# Todo corre localmente
```

### Staging
```bash
# Vercel Preview
# Base de datos de desarrollo en Supabase
# Sanity con dataset de staging

# Para testing antes de producción
```

### Production
```bash
# Dominio: biblioteca-digital.com
# Supabase Production
# Sanity Production
# Cloudflare CDN
# Monitoreo con Sentry
# Analytics con Vercel Analytics
```

---

## 💡 Consideraciones Importantes

### Performance
- Lazy loading obligatorio para PDFs grandes
- Compresión de PDFs antes de subir (70% reducción)
- Optimización de imágenes con Next.js Image
- Code splitting automático
- Caché agresivo con Cloudflare

### Escalabilidad
- Base de datos con índices optimizados
- Queries eficientes con Prisma
- Storage escalable con Supabase
- Serverless functions (auto-scaling)
- CDN para distribución global

### Costos Estimados
```
Fase Inicial (0-100 usuarios):
├── Supabase: $0 (free tier)
├── Sanity: $0 (free tier)
├── Vercel: $0 (hobby plan)
├── Cloudflare: $0 (free tier)
└── Resend: $0 (free tier)
TOTAL: $0/mes

Fase Crecimiento (100-500 usuarios):
├── Supabase Pro: $25/mes
├── Sanity: $0 (free tier suficiente)
├── Vercel Pro: $20/mes
├── Cloudflare: $0
└── Resend: $10/mes
TOTAL: $55/mes

Fase Escalamiento (500-2000 usuarios):
├── Supabase Team: $599/mes
├── Sanity Team: $99/mes
├── Vercel Pro: $20/mes
├── Cloudflare Pro: $20/mes
└── Resend: $50/mes
TOTAL: $788/mes
```

### Legal y Compliance
- Términos y condiciones
- Política de privacidad
- Cumplimiento LFPDPPP (México)
- Derechos de autor de libros
- Acuerdos con editoriales (si aplica)

---

## 📞 Contacto y Soporte

### Para Desarrollo
- GitHub Issues para bugs y features
- Documentación en /docs
- Wiki del proyecto

### Para Usuarios
- Email: soporte@biblioteca-digital.com
- Chat en vivo (Intercom/Crisp)
- Centro de ayuda con FAQs
- Videos tutoriales en YouTube

---

## 🎓 Próximos Pasos

1. **Setup Inicial**
   - Crear proyecto en Supabase
   - Configurar Sanity Studio
   - Inicializar proyecto Next.js
   - Configurar Prisma

2. **Desarrollo del MVP**
   - Implementar autenticación
   - Crear modelos de base de datos
   - Desarrollar paneles básicos
   - Implementar visor de PDFs

3. **Testing y Ajustes**
   - Testing con usuarios beta
   - Recopilar feedback
   - Optimizaciones
   - Corrección de bugs

4. **Lanzamiento**
   - Deploy a producción
   - Marketing inicial
   - Onboarding de primeros usuarios
   - Monitoreo intensivo

---

**Última actualización:** 4 de noviembre, 2025  
**Versión del documento:** 1.1  
**Estado del proyecto:** Planeación