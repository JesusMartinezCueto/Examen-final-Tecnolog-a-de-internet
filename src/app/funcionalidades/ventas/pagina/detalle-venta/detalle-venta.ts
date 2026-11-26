import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { Venta } from '../../../../compartido/modelos/venta';
import { Lote } from '../../../../compartido/modelos/lote';
import { EstadoVentaBadge } from '../../componente/estado-venta/estado-venta';

@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, DecimalPipe, TitleCasePipe, EstadoVentaBadge],
  selector: 'app-detalle-venta',
  templateUrl: './detalle-venta.html',
})
export class DetalleVenta {
  private readonly db = inject(GanaderiaDb);

  /** Parámetro :id de la ruta (withComponentInputBinding). */
  readonly id = input.required<string>();
  /** Query param ?nueva=1 cuando se acaba de registrar. */
  readonly nueva = input<string>();

  readonly cargando = signal(true);
  readonly venta = signal<Venta | null>(null);
  readonly lote = signal<Lote | null>(null);
  readonly procesando = signal(false);
  readonly mensaje = signal<{ tipo: 'success' | 'danger' | 'info'; texto: string } | null>(null);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      const nueva = this.nueva();
      untracked(() => this.cargar(id, nueva === '1'));
    });
  }

  private async cargar(id: number, esNueva: boolean) {
    this.cargando.set(true);
    this.mensaje.set(null);
    try {
      const venta = Number.isInteger(id) && id > 0 ? await this.db.obtenerVenta(id) : undefined;
      this.venta.set(venta ?? null);
      this.lote.set(venta ? ((await this.db.obtenerLote(venta.loteId)) ?? null) : null);
      if (venta && esNueva) {
        this.mensaje.set({ tipo: 'success', texto: 'Venta registrada correctamente. Las cabezas se descontaron del lote.' });
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async entregar() {
    const venta = this.venta();
    if (!venta || !confirm(`¿Confirmar la entrega de ${venta.cantidad} cabezas a ${venta.compradorNombre}?`)) return;
    this.procesando.set(true);
    try {
      this.venta.set(await this.db.entregarVenta(venta.id));
      this.mensaje.set({ tipo: 'success', texto: 'La venta se marcó como entregada.' });
    } catch (e) {
      this.mensaje.set({ tipo: 'danger', texto: e instanceof Error ? e.message : 'No se pudo actualizar.' });
    } finally {
      this.procesando.set(false);
    }
  }

  async anular() {
    const venta = this.venta();
    if (!venta || !confirm('¿Anular esta venta? Las cabezas volverán al lote.')) return;
    this.procesando.set(true);
    try {
      const { venta: actualizada, lote } = await this.db.anularVenta(venta.id);
      this.venta.set(actualizada);
      this.lote.set(lote ?? null);
      this.mensaje.set({
        tipo: 'info',
        texto: `Venta anulada. Se devolvieron ${actualizada.cantidad} cabezas al lote` +
          (lote ? ` (existencias actuales: ${lote.existencias}).` : '.'),
      });
    } catch (e) {
      this.mensaje.set({ tipo: 'danger', texto: e instanceof Error ? e.message : 'No se pudo anular.' });
    } finally {
      this.procesando.set(false);
    }
  }
}
