import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { Lote } from '../../../../compartido/modelos/lote';
import { Venta } from '../../../../compartido/modelos/venta';

@Component({
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit {
  private readonly db = inject(GanaderiaDb);

  readonly lotes = signal<Lote[]>([]);
  readonly ventas = signal<Venta[]>([]);

  readonly cabezasDisponibles = computed(() => this.lotes()
      .filter((l) => l.activo)
      .reduce((s, l) => s + l.existencias, 0));
  readonly pendientes = computed(() => this.ventas().filter((v) => v.estado === 'pendiente').length);
  readonly ingresos = computed(() =>
    this.ventas()
      .filter((v) => v.estado === 'entregada')
      .reduce((s, v) => s + v.total, 0),
  );

  async ngOnInit() {
    const [lotes, ventas] = await Promise.all([this.db.listarLotes(), this.db.listarVentas()]);
    this.lotes.set(lotes);
    this.ventas.set(ventas);
  }
}
