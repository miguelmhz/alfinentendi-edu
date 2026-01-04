# Schemas de Sanity para el Sistema de Libros

Este documento contiene los schemas que debes agregar a tu proyecto de Sanity Studio para soportar las guías y el sistema de libros.

## 1. Schema para Guías (Guide)

Las guías son documentos educativos asociados a libros, con contenido rico y flexible.

```typescript
import {defineField, defineType} from 'sanity'

export const guideType = defineType({
  name: 'guide',
  title: 'Guía',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'books',
      title: 'Libros Asociados',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'book'}]}],
      validation: (rule) => rule.required().min(1),
      description: 'Una guía puede estar asociada a uno o más libros',
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Contenido',
      type: 'array',
      of: [
        {type: 'block'},
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Texto alternativo',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Pie de foto',
            },
          ],
        },
        {
          type: 'file',
          title: 'Archivo adjunto',
          options: {
            accept: 'application/pdf,.doc,.docx,.xls,.xlsx',
          },
        },
        {
          type: 'object',
          name: 'video',
          title: 'Video',
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'URL del video',
              description: 'YouTube, Vimeo, etc.',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Descripción',
            },
          ],
        },
      ],
      description: 'Contenido rico: texto, imágenes, videos, archivos',
    }),
    defineField({
      name: 'pdfFile',
      title: 'Archivo PDF (opcional)',
      type: 'file',
      options: {
        accept: 'application/pdf',
      },
      description: 'Si prefieres subir un PDF en lugar de contenido rico',
    }),
    defineField({
      name: 'order',
      title: 'Orden',
      type: 'number',
      validation: (rule) => rule.min(0),
      description: 'Orden de la guía dentro del libro',
    }),
    defineField({
      name: 'targetAudience',
      title: 'Audiencia',
      type: 'string',
      options: {
        list: [
          {title: 'Solo Profesores', value: 'teachers'},
          {title: 'Profesores y Coordinadores', value: 'teachers_coordinators'},
        ],
      },
      initialValue: 'teachers',
    }),
    defineField({
      name: 'tags',
      title: 'Etiquetas',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'isPublished',
      title: 'Publicado',
      type: 'boolean',
      initialValue: false,
      description: 'Solo las guías publicadas serán visibles',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Fecha de Publicación',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      books: 'books',
      isPublished: 'isPublished',
    },
    prepare({title, books, isPublished}) {
      const bookCount = books?.length || 0
      return {
        title: title,
        subtitle: `${bookCount} libro(s) • ${isPublished ? '✓ Publicado' : '○ Borrador'}`,
      }
    },
  },
})
```

## 2. Actualización del Schema de Book

Agrega el campo `isPublic` al schema existente de `book`:

```typescript
defineField({
  name: 'isPublic',
  title: 'Acceso Público',
  type: 'boolean',
  description: 'Indica si el libro tiene acceso público o requiere suscripción/compra',
  initialValue: false,
}),
```

## 3. Schema para Autor (si no existe)

```typescript
import {defineField, defineType} from 'sanity'

export const authorType = defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Biografía',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Foto',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
```

## 4. Schema para Categoría (si no existe)

```typescript
import {defineField, defineType} from 'sanity'

export const categoryType = defineType({
  name: 'category',
  title: 'Categoría',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nombre',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Descripción',
      type: 'text',
      rows: 3,
    }),
  ],
})
```

## Instrucciones de Implementación

1. **Ubicación de los schemas**: Estos archivos deben ir en tu proyecto de Sanity Studio, típicamente en una carpeta como `schemas/` o `schemaTypes/`.

2. **Registrar los schemas**: Asegúrate de importar y registrar estos schemas en tu configuración de Sanity (usualmente `sanity.config.ts` o similar):

```typescript
import {guideType} from './schemas/guideType'
import {bookType} from './schemas/bookType'
import {authorType} from './schemas/authorType'
import {categoryType} from './schemas/categoryType'

export default defineConfig({
  // ... otras configuraciones
  schema: {
    types: [
      guideType,
      bookType,
      authorType,
      categoryType,
      // ... otros tipos
    ],
  },
})
```

3. **Desplegar cambios**: Después de agregar los schemas, despliega tu Sanity Studio para que los cambios tomen efecto.

## Notas Importantes

- **Guías**: Solo accesibles para profesores y coordinadores
- **Foro de Guías**: Los comentarios se manejan en la base de datos de Prisma (no en Sanity)
- **Reviews de Libros**: Se manejan en Prisma para mejor rendimiento y queries complejas
- **Asignaciones**: Completamente manejadas en Prisma para control granular de permisos
