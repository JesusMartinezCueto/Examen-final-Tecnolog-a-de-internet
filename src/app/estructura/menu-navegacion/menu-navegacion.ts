import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-menu-navegacion',
  templateUrl: './menu-navegacion.html',
})
export class MenuNavegacion {
  readonly navegar = output<void>();

  readonly opciones = [
    { ruta: '/inicio', texto: 'Inicio', exacta: true },
    { ruta: '/catalogo', texto: 'Catálogo', exacta: true },
    { ruta: '/catalogo/nuevo', texto: 'Registrar animales', exacta: true },
    { ruta: '/ventas/nueva', texto: 'Nueva venta', exacta: true },
    { ruta: '/ventas', texto: 'Historial', exacta: true },
  ];
}
