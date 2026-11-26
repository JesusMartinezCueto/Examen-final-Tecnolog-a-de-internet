import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, NgClass, TitleCasePipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GanaderiaDb } from '../../../../compartido/servicios/ganaderia-db';
import { Lote } from '../../../../compartido/modelos/lote';

/** Fecha de hoy en formato yyyy-MM-dd (hora local). */
function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** La fecha de entrega no puede estar en el pasado. */
function fechaNoPasada(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  return valor && valor < hoy() ? { fechaPasada: true } : null;
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, NgClass, CurrencyPipe, TitleCasePipe],
  selector: 'app-registro-venta',
  templateUrl: './registro-venta.html',
})
export class RegistroVenta implements OnInit {
  private readonly db = inject(GanaderiaDb);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly fechaMinima = hoy();
  readonly lotes = signal<Lote[]>([]);
  readonly enviado = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      loteId: [0, [Validators.required, Validators.min(1)]],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      compradorNombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
      compradorCi: ['', [Validators.required, Validators.pattern(/^\d{5,10}$/)]],
      telefono: ['', [Validators.pattern(/^[67]\d{7}$/)]],
      fechaEntrega: [hoy(), [Validators.required, fechaNoPasada]],
      observaciones: ['', [Validators.maxLength(200)]],
    },
    // Regla del negocio: no se pueden vender más cabezas de las que hay en el lote.
    { validators: (grupo) => this.validarExistencias(grupo) },
  );

  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly loteSeleccionado = computed(() =>
    this.lotes().find((l) => l.id === Number(this.valores().loteId)),
  );

  readonly total = computed(() => {
    const lote = this.loteSeleccionado();
    const cantidad = Number(this.valores().cantidad) || 0;
    return lote ? lote.precioCabeza * cantidad : 0;
  });

  async ngOnInit() {
    this.lotes.set((await this.db.listarLotes()).filter((l) => l.activo));
    const loteParam = Number(this.ruta.snapshot.queryParamMap.get('lote'));
    if (loteParam && this.lotes().some((l) => l.id === loteParam)) {
      this.form.controls.loteId.setValue(loteParam);
    }
    this.form.updateValueAndValidity();
  }

  private validarExistencias(grupo: AbstractControl): ValidationErrors | null {
    const loteId = Number(grupo.get('loteId')?.value);
    const cantidad = Number(grupo.get('cantidad')?.value);
    const lote = this.lotes?.().find((l) => l.id === loteId);
    if (lote && cantidad > lote.existencias) {
      return { sinExistencias: { disponibles: lote.existencias } };
    }
    return null;
  }

  /** Indica si un campo debe mostrarse como inválido. */
  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.enviado());
  }

  excedeExistencias(): boolean {
    return this.form.hasError('sinExistencias') && (this.form.controls.cantidad.touched || this.enviado());
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
      const id = await this.db.registrarVenta({
        loteId: Number(v.loteId),
        cantidad: Number(v.cantidad),
        compradorNombre: v.compradorNombre.trim(),
        compradorCi: v.compradorCi.trim(),
        telefono: v.telefono.trim(),
        fechaEntrega: v.fechaEntrega,
        observaciones: v.observaciones.trim(),
      });
      this.router.navigate(['/ventas', id], { queryParams: { nueva: 1 } });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo registrar la venta.');
      this.lotes.set((await this.db.listarLotes()).filter((l) => l.activo)); // refresca existencias
      this.form.updateValueAndValidity();
    } finally {
      this.guardando.set(false);
    }
  }
}
