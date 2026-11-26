export const ESTADOS_VENTA = ['pendiente', 'entregada', 'anulada'] as const;

export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

/** Venta de cabezas de ganado de un lote a un comprador. */
export interface Venta {
  id: number;
  loteId: number;
  loteNombre: string;
  raza: string;
  cantidad: number;
  precioCabeza: number;
  total: number;
  compradorNombre: string;
  compradorCi: string;
  telefono: string;
  fechaEntrega: string; // yyyy-MM-dd
  observaciones: string;
  estado: EstadoVenta;
  fechaRegistro: string; // ISO
  fechaActualizacion: string | null; // ISO
}

/** Datos que el formulario envía para registrar una venta. */
export type NuevaVenta = Pick<
  Venta,
  'loteId' | 'cantidad' | 'compradorNombre' | 'compradorCi' | 'telefono' | 'fechaEntrega' | 'observaciones'
>;
