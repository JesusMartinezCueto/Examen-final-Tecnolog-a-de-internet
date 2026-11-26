import { Component, input } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { EstadoVenta } from '../../../../compartido/modelos/venta';

/** Insignia reutilizable que pinta el estado de una venta. */
@Component({
  imports: [NgClass, TitleCasePipe],
  selector: 'app-estado-venta',
  template: `
    <span
      class="badge"
      [ngClass]="{
        'text-bg-warning': estado() === 'pendiente',
        'text-bg-success': estado() === 'entregada',
        'text-bg-secondary': estado() === 'anulada'
      }"
      >{{ estado() | titlecase }}</span
    >
  `,
})
export class EstadoVentaBadge {
  readonly estado = input.required<EstadoVenta>();
}
