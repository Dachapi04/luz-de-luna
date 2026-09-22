/**
 * Importa el respaldo Excel de la versión anterior de Luz de Luna a
 * Firestore (ver sección 8 de la especificación del proyecto).
 *
 * Formato esperado (el que genera la app vieja):
 *   Inventario: Producto | Categoria | CantidadReal | Unidad | Precio
 *     -> Precio > 0 se importa como platillo; Precio == 0 como insumo.
 *   Compras:    Fecha | Concepto | Categoria | Cantidad | Unidad | Total
 *   Ventas:     Fecha | Pedido | Producto | Cantidad | PrecioUnitario | Total | Detalle | Mesero | Cajero | MetodoPago
 *     -> se agrupan por (Fecha, Pedido) para reconstruir un pedido por mesa/día.
 *   "Cierres de caja": Fecha | Vendido | Comprado | Ganancia | Efectivo | Sinpe | Tarjeta | CerradoPor
 *
 * Los pedidos reconstruidos se marcan SIEMPRE como pagado=true (son
 * historial cerrado) para no aparecer como mesas "ocupadas" en la app
 * nueva. Si el respaldo no trae mesero/cajero/método de pago por línea
 * (la app vieja no los exportaba), se usa "Importado" / "Efectivo" como
 * relleno — son solo para lectura del historial, no afectan operación.
 *
 * Los platillos importados NO traen receta (la app vieja no la tenía):
 * agrégala manualmente desde Inventario si quieres que vender ese
 * platillo descuente insumos automáticamente.
 *
 * Uso:
 *   npm run import-backup -- "C:\ruta\a\respaldo.xlsx"
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import * as XLSX from 'xlsx';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type DocumentData, type DocumentReference } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';

const CATEGORIAS = ['Insumos', 'Botellas', 'Alcohol', 'Comidas', 'Otros'] as const;
type Categoria = (typeof CATEGORIAS)[number];

const COMPRA_CATEGORIA_MAP: Record<string, Categoria> = {
  otros: 'Otros',
  'frescos / verduras': 'Insumos',
  carnes: 'Insumos',
  bebidas: 'Botellas',
  servicios: 'Otros',
};

function norm(s: unknown): string {
  return String(s ?? '').trim().toLowerCase();
}

function toCategoria(raw: unknown, fallbackMap?: Record<string, Categoria>): Categoria {
  const s = String(raw ?? '').trim();
  if ((CATEGORIAS as readonly string[]).includes(s)) return s as Categoria;
  const mapped = fallbackMap?.[norm(raw)];
  return mapped ?? 'Otros';
}

interface Pending {
  ref: DocumentReference;
  data: DocumentData;
}

async function commitInChunks(db: FirebaseFirestore.Firestore, pending: Pending[]) {
  const CHUNK = 400; // margen bajo el límite de 500 escrituras por batch de Firestore
  for (let i = 0; i < pending.length; i += CHUNK) {
    const batch = db.batch();
    for (const { ref, data } of pending.slice(i, i + CHUNK)) batch.set(ref, data);
    await batch.commit();
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: npm run import-backup -- "C:\\ruta\\a\\respaldo.xlsx"');
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error('Faltan variables FIREBASE_ADMIN_* en .env.local.');
    process.exit(1);
  }

  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const db = getFirestore(app);

  const wb = XLSX.read(readFileSync(filePath));
  const sheet = <T,>(name: string): T[] =>
    wb.Sheets[name] ? XLSX.utils.sheet_to_json<T>(wb.Sheets[name]!, { defval: null }) : [];

  // ---- 1. Inventario -> productos ------------------------------------
  interface InvRow {
    Producto: string;
    Categoria: string;
    CantidadReal: number | null;
    Unidad: string | null;
    Precio: number | null;
  }
  const invRows = sheet<InvRow>('Inventario');
  const productoPending: Pending[] = [];
  // nombre normalizado -> { id, categoria } para poder enlazar los items de Ventas
  const productoIndex = new Map<string, { id: string; categoria: Categoria; tipo: 'insumo' | 'platillo' }>();

  for (const row of invRows) {
    const nombre = String(row.Producto ?? '').trim();
    if (!nombre) continue;
    const precio = Number(row.Precio) || 0;
    const tipo: 'insumo' | 'platillo' = precio > 0 ? 'platillo' : 'insumo';
    const categoria = toCategoria(row.Categoria);
    const ref = db.collection('productos').doc();
    productoPending.push({
      ref,
      data: {
        nombre,
        tipo,
        categoria,
        unidad: String(row.Unidad ?? ''),
        ...(tipo === 'insumo'
          ? { cantidad: Number(row.CantidadReal) || 0, stockMinimo: 0 }
          : { precio, receta: [] }),
      },
    });
    productoIndex.set(norm(nombre), { id: ref.id, categoria, tipo });
  }

  // ---- 2. Compras ------------------------------------------------------
  interface CompraRow {
    Fecha: string;
    Concepto: string;
    Categoria: string;
    Cantidad: string | number | null;
    Unidad: string | null;
    Total: number | null;
  }
  const compraRows = sheet<CompraRow>('Compras');
  const compraPending: Pending[] = compraRows.map((row) => ({
    ref: db.collection('compras').doc(),
    data: {
      fecha: String(row.Fecha ?? ''),
      concepto: String(row.Concepto ?? ''),
      categoria: toCategoria(row.Categoria, COMPRA_CATEGORIA_MAP),
      cantidad: row.Cantidad != null && row.Cantidad !== '' ? Number(row.Cantidad) : null,
      unidad: row.Unidad || null,
      total: Number(row.Total) || 0,
    },
  }));

  // ---- 3. Ventas -> pedidos (agrupadas por Fecha + Pedido/mesa) --------
  interface VentaRow {
    Fecha: string;
    Pedido: string;
    Producto: string;
    Cantidad: number;
    PrecioUnitario: number;
    Total: number;
    Detalle: string | null;
    Mesero: string | null;
    Cajero: string | null;
    MetodoPago: string | null;
  }
  const ventaRows = sheet<VentaRow>('Ventas');
  const grupos = new Map<string, VentaRow[]>();
  for (const row of ventaRows) {
    const key = `${row.Fecha}|${row.Pedido}`;
    const arr = grupos.get(key) ?? [];
    arr.push(row);
    grupos.set(key, arr);
  }

  const pedidoPending: Pending[] = [];
  let productosNoEncontrados = 0;
  for (const [, rows] of grupos) {
    const first = rows[0]!;
    const items = rows.map((r) => {
      const prod = productoIndex.get(norm(r.Producto));
      if (!prod) productosNoEncontrados++;
      const destino = prod && (prod.categoria === 'Alcohol' || prod.categoria === 'Botellas') ? 'bartender' : 'cocina';
      const total = Number(r.Total) || 0;
      return {
        id: crypto.randomUUID(),
        productoId: prod?.id ?? '',
        producto: String(r.Producto ?? '').trim(),
        cantidad: Number(r.Cantidad) || 0,
        precioUnitario: Number(r.PrecioUnitario) || 0,
        total,
        detalle: r.Detalle ? String(r.Detalle) : '',
        destino,
        listo: true,
      };
    });
    const total = items.reduce((a, i) => a + i.total, 0);
    const metodoPago = first.MetodoPago && String(first.MetodoPago).trim() ? String(first.MetodoPago) : 'Efectivo';
    const cajeroNombre = first.Cajero && String(first.Cajero).trim() ? String(first.Cajero) : 'Importado';
    const meseroNombre = first.Mesero && String(first.Mesero).trim() ? String(first.Mesero) : 'Importado';
    const fecha = String(first.Fecha ?? '');

    pedidoPending.push({
      ref: db.collection('pedidos').doc(),
      data: {
        mesa: String(first.Pedido ?? 'Importado').trim() || 'Importado',
        fecha,
        horaCreacion: '00:00',
        meseroId: 'legacy',
        meseroNombre,
        pagado: true,
        items,
        cobro: {
          total,
          metodoPago,
          recibido: total,
          vuelto: 0,
          cajeroId: 'legacy',
          cajeroNombre,
          fechaHora: fecha ? `${fecha}T12:00:00.000Z` : new Date().toISOString(),
        },
      },
    });
  }

  // ---- 4. Cierres de caja -----------------------------------------------
  interface CierreRow {
    Fecha: string;
    Vendido: number;
    Comprado: number;
    Ganancia: number;
    Efectivo: number;
    Sinpe: number;
    Tarjeta: number;
    CerradoPor: string | null;
  }
  const cierreRows = sheet<CierreRow>('Cierres de caja');
  const cierrePending: Pending[] = cierreRows
    .filter((row) => row.Fecha)
    .map((row) => ({
      ref: db.collection('cierresCaja').doc(String(row.Fecha)),
      data: {
        fecha: String(row.Fecha),
        totalVendido: Number(row.Vendido) || 0,
        totalComprado: Number(row.Comprado) || 0,
        ganancia: Number(row.Ganancia) || 0,
        efectivo: Number(row.Efectivo) || 0,
        sinpe: Number(row.Sinpe) || 0,
        tarjeta: Number(row.Tarjeta) || 0,
        cerradoPorId: 'legacy',
        cerradoPorNombre: row.CerradoPor || 'Administrador',
        hora: '23:59',
      },
    }));

  const all = [...productoPending, ...compraPending, ...pedidoPending, ...cierrePending];
  if (all.length === 0) {
    console.log('No se encontraron filas para importar. Revisa los nombres de hoja del Excel.');
    return;
  }

  await commitInChunks(db, all);

  console.log('Importación completa:');
  console.log(`  ${productoPending.length} productos (Inventario)`);
  console.log(`  ${compraPending.length} compras`);
  console.log(`  ${pedidoPending.length} pedidos reconstruidos de ${ventaRows.length} líneas de venta`);
  console.log(`  ${cierrePending.length} cierres de caja`);
  if (productosNoEncontrados) {
    console.log(`  Aviso: ${productosNoEncontrados} líneas de venta no encontraron un producto con ese nombre en Inventario (quedaron con productoId vacío).`);
  }
  console.log('  Nota: los platillos se importaron SIN receta — agrégala desde Inventario si quieres descuento automático de insumos.');
  console.log('  Nota: mesero/cajero/método de pago no venían en el respaldo de Ventas, se rellenaron como "Importado" / "Efectivo".');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
