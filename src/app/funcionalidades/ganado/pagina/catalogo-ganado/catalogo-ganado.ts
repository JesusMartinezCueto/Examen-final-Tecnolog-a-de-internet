import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { CATEGORIAS_GANADO, Lote } from '../../../../compartido/modelos/lote';
import { LoteTarjeta } from '../../componente/lote-tarjeta/lote-tarjeta';

@Component({
  imports: [LoteTarjeta, RouterLink],
  selector: 'app-catalogo-ganado',
  templateUrl: './catalogo-ganado.html',
})
export class CatalogoGanado implements OnInit {
  private readonly db = inject(GanaderiaDb);
  private readonly router = inject(Router);

  readonly categorias = CATEGORIAS_GANADO;
  readonly lotes = signal<Lote[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly busqueda = signal('');
  readonly categoria = signal('');
  readonly verInactivos = signal(false);
  readonly mensaje = signal<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  /** Búsqueda por texto, filtro por categoría y por estado aplicados juntos. */
  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const cat = this.categoria();
    const inactivos = this.verInactivos();
    return this.lotes().filter(
      (l) =>
        (inactivos || l.activo) &&
        (!cat || l.categoria === cat) &&
        (!texto ||
          l.nombre.toLowerCase().includes(texto) ||
          l.raza.toLowerCase().includes(texto) ||
          l.descripcion.toLowerCase().includes(texto)),
    );
  });

  async ngOnInit() {
    try {
      this.lotes.set(await this.db.listarLotes());
    } catch (e) {
      this.error.set('No se pudo leer el catálogo de ganado.');
      console.error(e);
    } finally {
      this.cargando.set(false);
    }
  }

  limpiarFiltros() {
    this.busqueda.set('');
    this.categoria.set('');
    this.verInactivos.set(false);
  }

  /** Activa o inactiva el lote (borrado lógico). */
  async cambiarEstado(lote: Lote) {
    this.mensaje.set(null);
    try {
      const actualizado = await this.db.cambiarEstadoLote(lote.id, !lote.activo);
      this.lotes.update((ls) => ls.map((l) => (l.id === actualizado.id ? actualizado : l)));
      this.mensaje.set({
        tipo: 'success',
        texto: `Lote "${lote.nombre}" ${actualizado.activo ? 'activado' : 'inactivado'}.`,
      });
    } catch (e) {
      this.mensaje.set({ tipo: 'danger', texto: e instanceof Error ? e.message : 'No se pudo cambiar el estado.' });
    }
  }

  /** Acción que llega desde la tarjeta hija mediante output(). */
  venderLote(lote: Lote) {
    this.router.navigate(['/ventas/nueva'], { queryParams: { lote: lote.id } });
  }
}
