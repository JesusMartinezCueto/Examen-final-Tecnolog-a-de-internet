import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuNavegacion } from '../menu-navegacion/menu-navegacion';

@Component({
  imports: [RouterLink, MenuNavegacion],
  selector: 'app-encabezado',
  styleUrl: './encabezado.css',
  templateUrl: './encabezado.html',
})
export class Encabezado {
  /** Controla el menú colapsable en pantallas de celular. */
  readonly menuAbierto = signal(false);
}
