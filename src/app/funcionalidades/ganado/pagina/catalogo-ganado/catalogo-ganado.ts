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
    // Mensaje enviado por el formulario de registro/edición al volver.
    const texto = history.state?.mensaje;
    if (typeof texto === 'string') {
      this.mensaje.set({ tipo: 'success', texto });
    }
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

  /** Abre el formulario de edición del lote (ahí también se activa/inactiva). */
  editarLote(lote: Lote) {
    this.router.navigate(['/catalogo', lote.id, 'editar']);
  }

  /** Acción que llega desde la tarjeta hija mediante output(). */
  venderLote(lote: Lote) {
    this.router.navigate(['/ventas/nueva'], { queryParams: { lote: lote.id } });
  }
}
