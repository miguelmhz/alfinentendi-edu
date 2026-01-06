/**
 * Genera un slug URL-friendly a partir de un string
 * @param text - Texto a convertir en slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Reemplazar caracteres especiales españoles
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Reemplazar espacios y caracteres no alfanuméricos con guiones
    .replace(/[^a-z0-9]+/g, "-")
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, "")
    // Limitar longitud
    .slice(0, 100);
}

/**
 * Genera un slug único agregando un sufijo numérico si es necesario
 * @param baseSlug - Slug base
 * @param existingSlugs - Array de slugs existentes
 * @returns Slug único
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
