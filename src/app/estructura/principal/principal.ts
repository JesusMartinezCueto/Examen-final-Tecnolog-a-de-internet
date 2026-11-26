import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Encabezado } from '../encabezado/encabezado';
import { PiePagina } from '../pie-pagina/pie-pagina';

@Component({
  imports: [RouterOutlet, Encabezado, PiePagina],
  selector: 'app-principal',
  styleUrl: './principal.css',
  templateUrl: './principal.html',
})
export class Principal {}
