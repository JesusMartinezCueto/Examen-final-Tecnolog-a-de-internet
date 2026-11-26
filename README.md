# Gestión Ganadera El Puente

Aplicación web en Angular para el comercio de ganado bovino: consultar los lotes disponibles,
registrar ventas por cabeza, revisar su historial y marcarlas como entregadas o anularlas.

## Integrantes

- Estudiante 1
Jesus Martinez Cueto

## Funcionalidades

| Pantalla | Ruta | Descripción |
|---|---|---|
| Inicio | `/inicio` | Resumen de lotes, cabezas disponibles, ventas pendientes e ingresos. |
| Catálogo | `/catalogo` | Lotes de ganado en tarjetas, con búsqueda por texto y filtro por categoría. |
| Nueva venta | `/ventas/nueva` | Formulario reactivo con validaciones. La cantidad no puede superar las existencias del lote. |
| Historial | `/ventas` | Ventas con fecha, total y estado, filtrables por estado. |
| Detalle | `/ventas/:id` | Datos de la venta; permite marcarla como entregada o anularla (devuelve las cabezas al lote). |

Los datos se guardan en IndexedDB (servicio `GanaderiaDb`); los lotes iniciales se cargan una sola vez.

## Tecnologías

Angular 22, Bootstrap 5 e IndexedDB.

## Ejecución

Requiere Node.js 24.15 o superior.

```bash
npm install
npm start
```

Abrir http://localhost:4200
