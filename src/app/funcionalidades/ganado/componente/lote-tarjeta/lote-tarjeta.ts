import { Component, computed, input, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { Lote } from '../../../../compartido/modelos/lote';

/** Tarjeta reutilizable que muestra un lote y avisa al padre de las acciones del usuario. */
@Component({
  imports: [NgClass, CurrencyPipe, DecimalPipe, TitleCasePipe],
  selector: 'app-lote-tarjeta',
  templateUrl: './lote-tarjeta.html',
  styleUrl: './lote-tarjeta.css',
})
export class LoteTarjeta {
  readonly lote = input.required<Lote>();
  readonly vender = output<Lote>();
  readonly cambiarEstado = output<Lote>();

  readonly nivelStock = computed(() => {
    const n = this.lote().existencias;
    if (n === 0) return 'agotado';
    if (n < 5) return 'bajo';
    return 'normal';
  });
}
