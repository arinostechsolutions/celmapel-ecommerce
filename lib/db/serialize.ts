/**
 * Converte documentos Mongoose (com ObjectId, Date, etc.)
 * em objetos JSON puros antes de passar para Client Components.
 */
export function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc))
}
