import { Injectable } from '@angular/core';
import { Lote } from '../modelos/lote';
import { NuevaVenta, Venta } from '../modelos/venta';
import { LOTES_INICIALES } from '../modelos/datos-iniciales';

const NOMBRE_BD = 'ganaderia-el-puente';
const VERSION_BD = 2;
const LOTES = 'lotes';
const VENTAS = 'ventas';

/** Convierte una petición de IndexedDB en una promesa. */
function peticion<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Servicio que guarda, lee y actualiza los lotes y las ventas en IndexedDB.
 */
@Injectable({ providedIn: 'root' })
export class GanaderiaDb {
  private readonly bd: Promise<IDBDatabase> = this.abrir();

  private abrir(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(NOMBRE_BD, VERSION_BD);

      // Solo se ejecuta cuando la base no existe (o cambia de versión):
      // por eso los datos iniciales se cargan una sola vez.
      req.onupgradeneeded = (evento) => {
        const bd = req.result;
        if (evento.oldVersion < 1) {
          const lotes = bd.createObjectStore(LOTES, { keyPath: 'id', autoIncrement: true });
          const ventas = bd.createObjectStore(VENTAS, { keyPath: 'id', autoIncrement: true });
          ventas.createIndex('estado', 'estado');
          for (const lote of LOTES_INICIALES) {
            lotes.add(lote);
          }
        }
        if (evento.oldVersion < 2) {
          const tx = req.transaction!;
          // Los lotes guardados antes de esta versión no tenían "activo": se marcan activos.
          if (evento.oldVersion >= 1) {
            const cursorReq = tx.objectStore(LOTES).openCursor();
            cursorReq.onsuccess = () => {
              const cursor = cursorReq.result;
              if (!cursor) return;
              const lote = cursor.value as Lote;
              if (lote.activo === undefined) {
                lote.activo = true;
                cursor.update(lote);
              }
              cursor.continue();
            };
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /** Ejecuta un trabajo dentro de una transacción y espera a que se confirme. */
  private async transaccion<T>(
    almacenes: string[],
    modo: IDBTransactionMode,
    trabajo: (tx: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    const bd = await this.bd;
    const tx = bd.transaction(almacenes, modo);
    const fin = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error('Transacción cancelada'));
    });
    fin.catch(() => undefined); // evita rechazos no controlados si abortamos
    try {
      const resultado = await trabajo(tx);
      await fin;
      return resultado;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* la transacción ya terminó */
      }
      throw error;
    }
  }

  // ---------- Lotes ----------

  listarLotes(): Promise<Lote[]> {
    return this.transaccion([LOTES], 'readonly', (tx) =>
      peticion(tx.objectStore(LOTES).getAll() as IDBRequest<Lote[]>),
    );
  }

  obtenerLote(id: number): Promise<Lote | undefined> {
    return this.transaccion([LOTES], 'readonly', (tx) =>
      peticion(tx.objectStore(LOTES).get(id) as IDBRequest<Lote | undefined>),
    );
  }

  /** Registra un nuevo lote de animales y devuelve su id. */
  crearLote(datos: Omit<Lote, 'id'>): Promise<number> {
    return this.transaccion([LOTES], 'readwrite', async (tx) =>
      (await peticion(tx.objectStore(LOTES).add(datos))) as number,
    );
  }

  /** Actualiza los datos de un lote, incluido su estado (activo / inactivo). */
  actualizarLote(lote: Lote): Promise<void> {
    return this.transaccion([LOTES], 'readwrite', async (tx) => {
      const lotes = tx.objectStore(LOTES);
      const existente = (await peticion(lotes.get(lote.id))) as Lote | undefined;
      if (!existente) {
        throw new Error('El lote no existe.');
      }
      await peticion(lotes.put(lote));
    });
  }

  // ---------- Ventas ----------

  async listarVentas(): Promise<Venta[]> {
    const ventas = await this.transaccion([VENTAS], 'readonly', (tx) =>
      peticion(tx.objectStore(VENTAS).getAll() as IDBRequest<Venta[]>),
    );
    return ventas.sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
  }

  obtenerVenta(id: number): Promise<Venta | undefined> {
    return this.transaccion([VENTAS], 'readonly', (tx) =>
      peticion(tx.objectStore(VENTAS).get(id) as IDBRequest<Venta | undefined>),
    );
  }

  /**
   * Registra la venta y descuenta las cabezas del lote en la misma transacción.
   * Regla: la cantidad vendida no puede superar las existencias del lote.
   */
  registrarVenta(datos: NuevaVenta): Promise<number> {
    return this.transaccion([LOTES, VENTAS], 'readwrite', async (tx) => {
      const lotes = tx.objectStore(LOTES);
      const lote = (await peticion(lotes.get(datos.loteId))) as Lote | undefined;
      if (!lote) {
        throw new Error('El lote seleccionado ya no existe.');
      }
      if (!lote.activo) {
        throw new Error('El lote está inactivo; no se puede vender.');
      }
      if (datos.cantidad > lote.existencias) {
        throw new Error(`Solo hay ${lote.existencias} cabezas disponibles en el lote.`);
      }

      lote.existencias -= datos.cantidad;
      await peticion(lotes.put(lote));

      const venta: Omit<Venta, 'id'> = {
        ...datos,
        loteNombre: lote.nombre,
        raza: lote.raza,
        precioCabeza: lote.precioCabeza,
        total: lote.precioCabeza * datos.cantidad,
        estado: 'pendiente',
        fechaRegistro: new Date().toISOString(),
        fechaActualizacion: null,
      };
      return (await peticion(tx.objectStore(VENTAS).add(venta))) as number;
    });
  }

  /** Marca la venta como entregada. Solo se permite si está pendiente. */
  entregarVenta(id: number): Promise<Venta> {
    return this.transaccion([VENTAS], 'readwrite', async (tx) => {
      const ventas = tx.objectStore(VENTAS);
      const venta = await this.ventaPendiente(ventas, id);
      venta.estado = 'entregada';
      venta.fechaActualizacion = new Date().toISOString();
      await peticion(ventas.put(venta));
      return venta;
    });
  }

  /**
   * Anula la venta y devuelve las cabezas al lote.
   * Solo se permite una vez (cuando la venta está pendiente).
   */
  anularVenta(id: number): Promise<{ venta: Venta; lote: Lote | undefined }> {
    return this.transaccion([LOTES, VENTAS], 'readwrite', async (tx) => {
      const ventas = tx.objectStore(VENTAS);
      const venta = await this.ventaPendiente(ventas, id);
      venta.estado = 'anulada';
      venta.fechaActualizacion = new Date().toISOString();
      await peticion(ventas.put(venta));

      const lotes = tx.objectStore(LOTES);
      const lote = (await peticion(lotes.get(venta.loteId))) as Lote | undefined;
      if (lote) {
        lote.existencias += venta.cantidad;
        await peticion(lotes.put(lote));
      }
      return { venta, lote };
    });
  }

  private async ventaPendiente(ventas: IDBObjectStore, id: number): Promise<Venta> {
    const venta = (await peticion(ventas.get(id))) as Venta | undefined;
    if (!venta) {
      throw new Error('La venta no existe.');
    }
    if (venta.estado !== 'pendiente') {
      throw new Error(`La venta ya fue ${venta.estado}; no se puede modificar.`);
    }
    return venta;
  }
}
