# Implementación del Sistema de Libros, Guías y Reviews

## Resumen

Este documento describe la implementación completa del sistema de libros con:
- ✅ Asignaciones de libros a escuelas, grados, grupos, profesores y estudiantes
- ✅ Guías educativas con contenido rico (solo para profesores)
- ✅ Foro de comentarios en guías con respuestas anidadas
- ✅ Sistema de reportes de comentarios inapropiados
- ✅ Reviews y calificaciones de libros
- ✅ Control de permisos granular

## Arquitectura

### Sanity CMS
- **Libros**: Contenido editorial (título, descripción, autores, PDF, preview, etc.)
- **Guías**: Contenido educativo rico asociado a libros

### Prisma/PostgreSQL
- **Asignaciones**: Control de acceso a libros por entidad
- **Comentarios**: Foro de discusión en guías
- **Reviews**: Calificaciones y comentarios de libros
- **Reportes**: Moderación de comentarios

## Pasos de Implementación

### 1. Ejecutar Migración de Base de Datos

```bash
# Generar el cliente de Prisma con los nuevos modelos
npx prisma generate

# Aplicar la migración
npx prisma migrate dev --name add_books_features
```

Esto creará las siguientes tablas:
- `book_assignments`: Asignaciones de libros
- `guide_comments`: Comentarios en guías
- `book_reviews`: Reviews de libros
- `comment_reports`: Reportes de comentarios

### 2. Agregar Schemas a Sanity Studio

Consulta el archivo `sanity-schemas-guide.md` para los schemas completos que debes agregar a tu proyecto de Sanity Studio:

1. **guideType**: Schema para guías educativas
2. **Actualizar bookType**: Agregar campo `isPublic`
3. **authorType**: Schema para autores (si no existe)
4. **categoryType**: Schema para categorías (si no existe)

### 3. API Endpoints Disponibles

#### Asignaciones de Libros

**POST** `/api/book-assignments`
```json
{
  "bookSanityId": "book-id-from-sanity",
  "assignedToType": "school|grade|group|teacher|student",
  "assignedToId": "entity-id",
  "endDate": "2024-12-31T23:59:59Z" // opcional
}
```

**GET** `/api/book-assignments?bookSanityId=xxx&assignedToType=xxx&assignedToId=xxx`

**PUT** `/api/book-assignments/[id]`
```json
{
  "endDate": "2024-12-31T23:59:59Z",
  "isActive": true
}
```

**DELETE** `/api/book-assignments/[id]`

#### Comentarios de Guías

**POST** `/api/guide-comments`
```json
{
  "guideSanityId": "guide-id-from-sanity",
  "content": "Comentario...",
  "imageUrls": ["url1", "url2"], // opcional
  "parentId": "comment-id" // opcional, para respuestas
}
```

**GET** `/api/guide-comments?guideSanityId=xxx&parentId=null`

**PUT** `/api/guide-comments/[id]`
```json
{
  "content": "Comentario actualizado..."
}
```

**DELETE** `/api/guide-comments/[id]`

#### Reportes de Comentarios

**POST** `/api/comment-reports`
```json
{
  "commentId": "comment-id",
  "reason": "spam|inappropriate|offensive|other",
  "description": "Descripción opcional..."
}
```

**GET** `/api/comment-reports?status=pending` (Solo ADMIN)

#### Reviews de Libros

**POST** `/api/book-reviews`
```json
{
  "bookSanityId": "book-id-from-sanity",
  "rating": 5, // 1-5
  "comment": "Excelente libro..." // opcional
}
```

**GET** `/api/book-reviews?bookSanityId=xxx&userId=xxx`
Retorna:
```json
{
  "reviews": [...],
  "stats": {
    "averageRating": 4.5,
    "totalReviews": 10
  }
}
```

**PUT** `/api/book-reviews/[id]`
```json
{
  "rating": 4,
  "comment": "Actualización..."
}
```

**DELETE** `/api/book-reviews/[id]`

### 4. Utilidades de Permisos

Importa las funciones de verificación de permisos:

```typescript
import { 
  checkBookAccess, 
  getUserBooks, 
  checkGuideAccess 
} from '@/lib/permissions/book-access';

// Verificar acceso a un libro
const access = await checkBookAccess(userId, bookSanityId);
if (access.hasAccess) {
  // Usuario tiene acceso
  console.log('Tipo de asignación:', access.assignmentType);
}

// Obtener todos los libros del usuario
const bookIds = await getUserBooks(userId);

// Verificar acceso a una guía (solo profesores)
const guideAccess = await checkGuideAccess(userId, bookSanityId);
```

## Modelo de Permisos

### Jerarquía de Asignaciones

1. **Escuela** → Todos los usuarios de la escuela tienen acceso
2. **Grado** → Todos los profesores/estudiantes del grado tienen acceso
3. **Grupo** → Todos los miembros del grupo tienen acceso
4. **Profesor** → Asignación individual al profesor
5. **Estudiante** → Asignación individual al estudiante

### Reglas de Acceso

- **Libros públicos** (`isPublic: true` en Sanity): Accesibles sin asignación
- **Libros privados**: Requieren asignación activa
- **Guías**: Solo accesibles para TEACHER, COORDINATOR, ADMIN con acceso al libro
- **Comentarios**: Todos los usuarios con acceso a la guía pueden comentar
- **Reviews**: Todos los usuarios autenticados pueden dejar reviews

### Roles y Permisos

| Acción | STUDENT | TEACHER | COORDINATOR | ADMIN |
|--------|---------|---------|-------------|-------|
| Ver libro asignado | ✅ | ✅ | ✅ | ✅ |
| Ver guías | ❌ | ✅ | ✅ | ✅ |
| Comentar en guías | ❌ | ✅ | ✅ | ✅ |
| Asignar libros | ❌ | ❌ | ✅ | ✅ |
| Ver reportes | ❌ | ❌ | ❌ | ✅ |
| Dejar reviews | ✅ | ✅ | ✅ | ✅ |

## Flujos de Trabajo

### Asignar Libro a una Escuela

1. Coordinador/Admin crea asignación con `assignedToType: "school"`
2. Todos los usuarios de la escuela obtienen acceso automáticamente
3. Profesores pueden acceder a guías asociadas
4. Estudiantes solo ven el libro (no las guías)

### Crear y Comentar en una Guía

1. Admin crea guía en Sanity Studio asociada a uno o más libros
2. Profesores con acceso al libro pueden ver la guía
3. Profesores pueden comentar y responder a otros comentarios
4. Cualquier usuario puede reportar comentarios inapropiados
5. Admin revisa reportes y toma acción

### Dejar Review de un Libro

1. Usuario autenticado accede al libro
2. Deja rating (1-5 estrellas) y comentario opcional
3. Sistema previene reviews duplicadas (un usuario = una review por libro)
4. Stats se calculan automáticamente (promedio y total)

## Próximos Pasos

1. **Ejecutar migraciones**: `npx prisma generate && npx prisma migrate dev`
2. **Agregar schemas a Sanity**: Seguir `sanity-schemas-guide.md`
3. **Crear componentes de UI**: Interfaces para asignar libros, ver guías, comentar, etc.
4. **Integrar con frontend**: Consumir los endpoints desde tus páginas Next.js
5. **Testing**: Probar flujos completos de asignación y permisos

## Notas Técnicas

- **Cascading deletes**: Los comentarios y reportes se eliminan automáticamente si se elimina el usuario o comentario padre
- **Índices optimizados**: Queries rápidas en bookSanityId, userId, status, etc.
- **Respuestas anidadas**: Los comentarios soportan un nivel de anidación (replies)
- **Timestamps automáticos**: createdAt y updatedAt se manejan automáticamente
- **Validaciones**: Todas las APIs validan permisos y datos de entrada

## Troubleshooting

### Error: Property 'bookAssignment' does not exist

Ejecuta: `npx prisma generate` para regenerar el cliente de Prisma.

### Error en migración

Si la migración falla, verifica:
1. Conexión a la base de datos
2. Variables de entorno `DATABASE_URL` y `DIRECT_URL`
3. Permisos del usuario de base de datos

### Comentarios no aparecen

Verifica:
1. Usuario tiene acceso al libro asociado a la guía
2. Usuario es TEACHER, COORDINATOR o ADMIN
3. Guía está publicada (`isPublished: true` en Sanity)
