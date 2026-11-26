import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { CATEGORIAS_GANADO, CategoriaGanado } from '../../../../compartido/modelos/lote';

/**
 * Formulario para registrar un nuevo lote de animales o editar uno existente.
 * Si la ruta trae un :id, funciona en modo edición.
 */
@Component({
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  selector: 'app-registro-lote',
  templateUrl: './registro-lote.html',
})
export class RegistroLote implements OnInit {
  private readonly db = inject(GanaderiaDb);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly categorias = CATEGORIAS_GANADO;
  /** Id del lote que se edita; null cuando se registra uno nuevo. */
  readonly idLote = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly enviado = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(60)]],
    raza: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    categoria: ['' as CategoriaGanado | '', [Validators.required]],
    pesoPromedioKg: [0, [Validators.required, Validators.min(1), Validators.max(2000)]],
    precioCabeza: [0, [Validators.required, Validators.min(1)]],
    existencias: [1, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    descripcion: ['', [Validators.maxLength(200)]],
    activo: [true],
  });

  async ngOnInit() {
    const id = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!id) return;

    this.idLote.set(id);
    this.cargando.set(true);
    try {
      const lote = await this.db.obtenerLote(id);
      if (!lote) {
        this.error.set('El lote que intenta editar no existe.');
        this.form.disable();
        return;
      }
      const { id: _, ...datos } = lote;
      this.form.setValue(datos);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Indica si un campo debe mostrarse como inválido. */
  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  async guardar() {
    this.enviado.set(true);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revise los campos marcados en rojo antes de guardar.');
      return;
    }
    this.guardando.set(true);
    try {
      const v = this.form.getRawValue();
      const datos = {
        nombre: v.nombre.trim().toLowerCase(),
        raza: v.raza.trim(),
        categoria: v.categoria as CategoriaGanado,
        pesoPromedioKg: Number(v.pesoPromedioKg),
        precioCabeza: Number(v.precioCabeza),
        existencias: Number(v.existencias),
        descripcion: v.descripcion.trim(),
        activo: v.activo,
      };
      const id = this.idLote();
      let mensaje: string;
      if (id) {
        await this.db.actualizarLote({ id, ...datos });
        mensaje = `Lote "${datos.nombre}" actualizado${datos.activo ? '' : ' (inactivo)'}.`;
      } else {
        await this.db.crearLote(datos);
        mensaje = `Lote "${datos.nombre}" registrado.`;
      }
      // El mensaje viaja en el estado de la navegación y lo muestra el catálogo.
      this.router.navigate(['/catalogo'], { state: { mensaje } });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo guardar el lote.');
    } finally {
      this.guardando.set(false);
    }
  }
}
