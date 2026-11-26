import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { ESTADOS_VENTA, EstadoVenta, Venta } from '../../../../compartido/modelos/venta';
import { EstadoVentaBadge } from '../../componente/estado-venta/estado-venta';

@Component({
  imports: [RouterLink, NgClass, DatePipe, CurrencyPipe, TitleCasePipe, EstadoVentaBadge],
  selector: 'app-historial-ventas',
  templateUrl: './historial-ventas.html',
})
export class HistorialVentas implements OnInit {
  private readonly db = inject(GanaderiaDb);
  private readonly router = inject(Router);

  readonly estados = ESTADOS_VENTA;
  readonly ventas = signal<Venta[]>([]);
  readonly cargando = signal(true);
  readonly filtroEstado = signal<EstadoVenta | ''>('');

  readonly filtradas = computed(() => {
    const estado = this.filtroEstado();
    return this.ventas().filter((v) => !estado || v.estado === estado);
  });

  readonly conteo = computed(() => {
    const c: Record<string, number> = { pendiente: 0, entregada: 0, anulada: 0 };
    for (const v of this.ventas()) c[v.estado]++;
    return c;
  });

  async ngOnInit() {
    try {
      this.ventas.set(await this.db.listarVentas());
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(venta: Venta) {
    this.router.navigate(['/ventas', venta.id]);
  }
}
