# API de Autenticación - Al Fin Entendí

Este directorio contiene las rutas API para la autenticación de usuarios en la plataforma Al Fin Entendí.

## Arquitectura

La aplicación utiliza una combinación de **Supabase Auth** + **Prisma ORM**:
- **Supabase Auth**: Maneja la autenticación (passwords, OTP/Magic Links, sesiones)
- **Prisma**: Maneja los datos del usuario en PostgreSQL (roles, status, perfiles)

## Rutas Disponibles

### 1. Login con Contraseña (Teachers/Coordinators/Admins)
**Endpoint:** `POST /api/auth/login/password`

**Descripción:** Permite a profesores, coordinadores y administradores iniciar sesión usando email y contraseña.

**Body:**
```json
{
  "email": "profesor@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "profesor@ejemplo.com",
    "name": "Nombre Completo",
    "roles": ["TEACHER"],
    "status": "ACTIVE",
    "schoolId": "school_id",
    "lastLogin": "2024-01-01T00:00:00Z"
  },
  "session": { ... }
}
```

**Errores posibles:**
- `400`: Email o contraseña faltantes
- `401`: Credenciales inválidas
- `403`: Rol no autorizado o cuenta inactiva/suspendida
- `404`: Usuario no encontrado

---

### 2. Login con OTP/Magic Link (Students/Admins)
**Endpoint:** `POST /api/auth/login/otp`

**Descripción:** Envía un enlace mágico al email del estudiante o admin para iniciar sesión.

**Body:**
```json
{
  "email": "estudiante@ejemplo.com"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Se ha enviado un enlace de acceso a tu correo electrónico",
  "email": "estudiante@ejemplo.com"
}
```

**Errores posibles:**
- `400`: Email faltante o error al enviar OTP
- `404`: Email no encontrado en el sistema
- `403`: Rol no autorizado o cuenta inactiva/suspendida

---

### 3. Obtener Usuario Actual
**Endpoint:** `GET /api/auth/user`

**Descripción:** Obtiene la información del usuario actualmente autenticado.

**Respuesta exitosa (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Completo",
    "roles": ["STUDENT"],
    "status": "ACTIVE",
    "schoolId": "school_id",
    "school": {
      "id": "school_id",
      "name": "Nombre de la Escuela"
    },
    "lastLogin": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Errores posibles:**
- `401`: Usuario no autenticado

---

### 4. Cerrar Sesión
**Endpoint:** `POST /api/auth/logout`

**Descripción:** Cierra la sesión del usuario actual.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 5. Callback de Autenticación
**Endpoint:** `GET /auth/callback`

**Descripción:** Maneja el callback después de que el usuario hace clic en el Magic Link.

**Query Parameters:**
- `code`: Código de autenticación de Supabase
- `next`: URL opcional para redirección

**Comportamiento:**
- Valida el código de autenticación
- Verifica el status del usuario en Prisma
- Actualiza el campo `lastLogin`
- Redirige según el rol:
  - `ADMIN` → `/admin/dashboard`
  - `COORDINATOR` → `/coordinator/dashboard`
  - `TEACHER` → `/teacher/dashboard`
  - `STUDENT` → `/student/dashboard`

**Errores de redirección:**
- `?error=user_not_found`: Usuario no existe en Prisma
- `?error=inactive`: Cuenta inactiva
- `?error=pending_activation`: Cuenta con status INVITED
- `?error=suspended`: Cuenta suspendida
- `?error=auth_callback_error`: Error en el callback

---

## Estructura de Base de Datos

El proyecto utiliza el schema Prisma definido en `prisma/schema.prisma`. Los modelos principales para autenticación son:

### Modelo User

```prisma
model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String?
  password     String?      // Solo para admin, coordinator, teacher
  roles        UserRole[]   // Array: permite múltiples roles
  status       UserStatus   @default(INVITED)
  schoolId     String?
  lastLogin    DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  // ... relaciones
}
```

### Enums

```prisma
enum UserRole {
  ADMIN
  COORDINATOR
  TEACHER
  STUDENT
  PUBLIC
}

enum UserStatus {
  INVITED      // Usuario invitado pero no activado
  ACTIVE       // Usuario activo
  INACTIVE     // Usuario inactivo
  SUSPENDED    // Usuario suspendido
}
```

---

## Roles y Permisos

### Roles disponibles:
- **ADMIN**: Acceso completo, puede usar ambos métodos de login (password y OTP)
- **COORDINATOR**: Coordinador de escuela, solo puede usar login con contraseña
- **TEACHER**: Profesor, solo puede usar login con contraseña
- **STUDENT**: Estudiante, solo puede usar login con OTP/Magic Link
- **PUBLIC**: Usuario público sin registro (para contenido gratuito)

**Nota:** Un usuario puede tener múltiples roles (ej. COORDINATOR + TEACHER)

### Estados disponibles:
- **INVITED**: Usuario invitado pero no ha activado su cuenta
- **ACTIVE**: Usuario puede iniciar sesión normalmente
- **INACTIVE**: Usuario no puede iniciar sesión
- **SUSPENDED**: Usuario temporalmente suspendido

---

## Variables de Entorno

Asegúrate de tener las siguientes variables de entorno configuradas en tu archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Prisma
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database
```

---

## Configuración de Supabase

### 1. Configurar el Email Redirect URL

En tu dashboard de Supabase, ve a:
1. Authentication > URL Configuration
2. Agrega tu URL de callback: `http://localhost:3000/auth/callback` (para desarrollo)
3. Para producción, agrega: `https://tu-dominio.com/auth/callback`

### 2. Configurar Templates de Email

Puedes personalizar los emails que Supabase envía para el Magic Link en:
1. Authentication > Email Templates
2. Edita el template "Magic Link"

### 3. Habilitar autenticación con contraseña

En Authentication > Providers:
1. Habilita "Email"
2. Configura las opciones de confirmación de email según tus necesidades

---

## Configuración de Prisma

### 1. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 2. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 3. Seed de datos (opcional)

Crea un script de seed para crear usuarios de prueba:

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Crear un admin
  await prisma.user.create({
    data: {
      email: "admin@ejemplo.com",
      name: "Administrador",
      roles: ["ADMIN"],
      status: "ACTIVE",
      password: "hash_del_password", // Usa bcrypt para hashear
    },
  });

  // Crear un profesor
  await prisma.user.create({
    data: {
      email: "profesor@ejemplo.com",
      name: "Profesor de Prueba",
      roles: ["TEACHER"],
      status: "ACTIVE",
      password: "hash_del_password",
    },
  });

  // Crear un estudiante
  await prisma.user.create({
    data: {
      email: "estudiante@ejemplo.com",
      name: "Estudiante de Prueba",
      roles: ["STUDENT"],
      status: "ACTIVE",
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Ejecuta el seed:
```bash
npx prisma db seed
```

---

## Uso en los Componentes

Los componentes `login-password.tsx` y `login-magicLink.tsx` ya están configurados para usar estas rutas API.

### Hook useAuth

Usa el hook personalizado `useAuth` para acceder a la información del usuario:

```typescript
import { useAuth } from "@/hooks/useAuth";

function MiComponente() {
  const {
    user,           // Usuario actual
    loading,        // Estado de carga
    error,          // Error si lo hay
    isAdmin,        // true si el usuario es ADMIN
    isCoordinator,  // true si el usuario es COORDINATOR
    isTeacher,      // true si el usuario es TEACHER
    isStudent,      // true si el usuario es STUDENT
    isAuthenticated,// true si está autenticado
    hasRole,        // función para verificar roles: hasRole(['ADMIN', 'TEACHER'])
    logout,         // función para cerrar sesión
    refetch,        // función para recargar datos del usuario
  } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) {
    return <div>Debes iniciar sesión</div>;
  }

  return (
    <div>
      <h1>Hola, {user.name}</h1>
      <p>Roles: {user.roles.join(", ")}</p>
      {isAdmin && <p>Tienes acceso de administrador</p>}
      {hasRole(['TEACHER', 'COORDINATOR']) && <p>Tienes acceso de staff</p>}
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

---

## Tipos TypeScript

Todos los tipos están definidos en `types/auth.ts`:

```typescript
export type UserRole = "ADMIN" | "COORDINATOR" | "TEACHER" | "STUDENT" | "PUBLIC";
export type UserStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  roles: UserRole[];
  status: UserStatus;
  name?: string | null;
  schoolId?: string | null;
  lastLogin?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Sincronización Supabase Auth + Prisma

**Importante:** Los usuarios deben existir tanto en Supabase Auth como en Prisma.

### Flujo de creación de usuario:

1. Crear usuario en Supabase Auth (admin dashboard o API)
2. Crear registro en Prisma con el mismo email
3. El usuario podrá iniciar sesión

### Opción: Trigger automático

Puedes crear un trigger en Supabase que automáticamente cree el registro en Prisma cuando se crea un usuario en Auth:

```sql
-- En Supabase SQL Editor
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (id, email, roles, status, "createdAt", "updatedAt")
  values (new.id, new.email, ARRAY['STUDENT']::text[], 'INVITED', now(), now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Próximos Pasos

Para expandir la funcionalidad de autenticación, considera:

1. ✅ Crear rutas para actualizar perfil de usuario
2. ✅ Crear rutas para cambiar contraseña
3. ✅ Crear rutas para recuperar contraseña
4. ✅ Implementar middleware para proteger rutas
5. ✅ Agregar manejo de permisos más granular
6. ✅ Implementar sistema de invitaciones
7. ✅ Agregar autenticación de dos factores (2FA)

---

## Troubleshooting

### Error: "Usuario no encontrado en Prisma"
- Verifica que el usuario exista en ambos sistemas (Supabase Auth + Prisma)
- Asegúrate de que los emails coincidan exactamente

### Error: "Este método de autenticación es solo para..."
- Verifica que el usuario tenga el rol correcto en Prisma
- Los roles son case-sensitive: usa "TEACHER" no "teacher"

### Error de tipo en TypeScript
- Ejecuta `npx prisma generate` para regenerar los tipos de Prisma
- Reinicia el servidor de desarrollo

### Magic Link no llega
- Verifica la configuración de email en Supabase
- Revisa la carpeta de spam
- Verifica que el email esté confirmado en Supabase Auth
