import { Routes } from '@angular/router';
import { Principal } from './estructura/principal/principal';
import { Inicio } from './funcionalidades/inicio/pagina/inicio/inicio';
import { CatalogoGanado } from './funcionalidades/ganado/pagina/catalogo-ganado/catalogo-ganado';
import { RegistroLote } from './funcionalidades/ganado/pagina/registro-lote/registro-lote';
import { RegistroVenta } from './funcionalidades/ventas/pagina/registro-venta/registro-venta';
import { HistorialVentas } from './funcionalidades/ventas/pagina/historial-ventas/historial-ventas';
import { DetalleVenta } from './funcionalidades/ventas/pagina/detalle-venta/detalle-venta';

export const routes: Routes = [
  {
    path: '',
    component: Principal,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', component: Inicio, title: 'Inicio | Ganadería El Puente' },
      { path: 'catalogo', component: CatalogoGanado, title: 'Catálogo | Ganadería El Puente' },
      { path: 'catalogo/nuevo', component: RegistroLote, title: 'Registrar animales | Ganadería El Puente' },
      { path: 'catalogo/:id/editar', component: RegistroLote, title: 'Editar lote | Ganadería El Puente' },
      { path: 'ventas', component: HistorialVentas, title: 'Ventas | Ganadería El Puente' },
      { path: 'ventas/nueva', component: RegistroVenta, title: 'Nueva venta | Ganadería El Puente' },
      { path: 'ventas/:id', component: DetalleVenta, title: 'Detalle de venta | Ganadería El Puente' },
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
