# Setup del Sistema de Libros - Instrucciones de Ejecución

## ⚠️ IMPORTANTE: Ejecuta estos comandos en orden

### 1. Regenerar Cliente de Prisma

Esto generará los tipos TypeScript para los nuevos modelos (BookAssignment, GuideComment, BookReview, CommentReport):

```bash
npx prisma generate
```

### 2. Aplicar Migración a la Base de Datos

Esto creará las nuevas tablas en tu base de datos PostgreSQL:

```bash
npx prisma migrate dev --name add_books_features
```

Si te pregunta si quieres resetear la base de datos, responde **NO** (a menos que estés en desarrollo y no te importe perder datos).

### 3. Verificar que todo funcione

```bash
# Opcional: Ver el estado de las migraciones
npx prisma migrate status

# Opcional: Abrir Prisma Studio para ver las nuevas tablas
npx prisma studio
```

## Archivos Creados

### Backend (API Routes)
- ✅ `/app/api/book-assignments/route.ts` - Crear y listar asignaciones
- ✅ `/app/api/book-assignments/[id]/route.ts` - Actualizar y eliminar asignaciones
- ✅ `/app/api/guide-comments/route.ts` - Crear y listar comentarios
- ✅ `/app/api/guide-comments/[id]/route.ts` - Actualizar y eliminar comentarios
- ✅ `/app/api/comment-reports/route.ts` - Crear y listar reportes
- ✅ `/app/api/book-reviews/route.ts` - Crear y listar reviews
- ✅ `/app/api/book-reviews/[id]/route.ts` - Actualizar y eliminar reviews

### Utilidades
- ✅ `/lib/permissions/book-access.ts` - Funciones para verificar permisos

### Base de Datos
- ✅ `/prisma/schema.prisma` - Actualizado con nuevos modelos
- ✅ `/prisma/migrations/20260102_add_books_features/migration.sql` - Migración SQL

### Documentación
- ✅ `/docs/BOOKS_IMPLEMENTATION.md` - Guía completa de implementación
- ✅ `/docs/sanity-schemas-guide.md` - Schemas para Sanity Studio

## Próximos Pasos (Después de ejecutar los comandos)

### 1. Agregar Schemas a Sanity Studio

Ve a tu proyecto de Sanity Studio y agrega los schemas descritos en `/docs/sanity-schemas-guide.md`:
- Schema `guide` para guías educativas
- Actualizar schema `book` con campo `isPublic`
- Schemas `author` y `category` si no existen

### 2. Crear Componentes de UI (Opcional)

Algunos componentes que podrías necesitar:
- **BookAssignmentForm**: Formulario para asignar libros
- **GuideViewer**: Visualizador de guías con foro
- **CommentThread**: Componente de comentarios anidados
- **BookReviews**: Componente de reviews y ratings
- **AdminReports**: Panel para revisar reportes (solo admin)

### 3. Integrar con tus Páginas

Ejemplo de uso en una página de libro:

```typescript
// app/books/[slug]/page.tsx
import { checkBookAccess } from '@/lib/permissions/book-access';

export default async function BookPage({ params }) {
  const user = await getCurrentUser(); // Tu función para obtener usuario
  const access = await checkBookAccess(user.id, params.slug);
  
  if (!access.hasAccess) {
    return <div>No tienes acceso a este libro</div>;
  }
  
  // Mostrar libro y guías si es profesor
  return <BookContent />;
}
```

## Estructura de Datos

### BookAssignment
```typescript
{
  id: string
  bookSanityId: string // ID del libro en Sanity
  assignedToType: "school" | "grade" | "group" | "teacher" | "student"
  assignedToId: string // ID de la entidad
  assignedBy: string // ID del usuario que asignó
  startDate: Date
  endDate?: Date
  isActive: boolean
}
```

### GuideComment
```typescript
{
  id: string
  guideSanityId: string // ID de la guía en Sanity
  userId: string
  content: string
  imageUrls: string[]
  parentId?: string // Para respuestas
  isEdited: boolean
}
```

### BookReview
```typescript
{
  id: string
  bookSanityId: string
  userId: string
  rating: number // 1-5
  comment?: string
  isVerifiedPurchase: boolean
}
```

### CommentReport
```typescript
{
  id: string
  commentId: string
  reportedBy: string
  reason: "spam" | "inappropriate" | "offensive" | "other"
  description?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
}
```

## Testing Rápido

Una vez que ejecutes los comandos, puedes probar las APIs con curl o Postman:

```bash
# Crear asignación (requiere autenticación)
curl -X POST http://localhost:3000/api/book-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "bookSanityId": "book-123",
    "assignedToType": "school",
    "assignedToId": "school-456"
  }'

# Listar asignaciones
curl http://localhost:3000/api/book-assignments?bookSanityId=book-123
```

## Troubleshooting

### Error: "Property 'bookAssignment' does not exist"
- **Solución**: Ejecuta `npx prisma generate`

### Error en migración
- **Causa**: Problema de conexión a la base de datos
- **Solución**: Verifica tus variables de entorno `DATABASE_URL` y `DIRECT_URL`

### No puedo ver las guías
- **Causa**: Solo profesores pueden ver guías
- **Solución**: Verifica que el usuario tenga rol `TEACHER`, `COORDINATOR` o `ADMIN`

## Soporte

Para más detalles, consulta:
- `/docs/BOOKS_IMPLEMENTATION.md` - Documentación completa
- `/docs/sanity-schemas-guide.md` - Schemas de Sanity
