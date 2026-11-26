/** Categorías de ganado que maneja la hacienda. */
export const CATEGORIAS_GANADO = [
  'Engorde',
  'Lechero',
  'Reproductor',
  'Ternero',
  'Descarte',
] as const;

export type CategoriaGanado = (typeof CATEGORIAS_GANADO)[number];

/** Lote de ganado disponible para la venta (se vende por cabeza). */
export interface Lote {
  id: number;
  nombre: string;
  raza: string;
  categoria: CategoriaGanado;
  pesoPromedioKg: number;
  precioCabeza: number;
  existencias: number;
  descripcion: string;
  /** false = lote inactivo: no se muestra para la venta, pero se conserva. */
  activo: boolean;
}
