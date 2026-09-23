import 'server-only';
import { getAdminDb } from '@/config/firebase.admin';
import type { CierreCaja, Pedido, Compra, Usuario, MetodoPago } from '@/domain/types';
import { montoPorMetodo } from '@/domain/pedidos';
import { nowHHmm } from '@/lib/utils/date';

/** Recalcula y guarda (o reemplaza) el cierre de caja de una fecha. */
export async function guardarCierre(admin: Usuario, fecha: string): Promise<CierreCaja> {
  const db = getAdminDb();
  const [pedidosSnap, comprasSnap] = await Promise.all([
    db.collection('pedidos').where('fecha', '==', fecha).where('pagado', '==', true).get(),
    db.collection('compras').where('fecha', '==', fecha).get(),
  ]);

  const pedidos = pedidosSnap.docs.map((d) => d.data() as Pedido);
  const compras = comprasSnap.docs.map((d) => d.data() as Compra);

  const porMetodo = (m: MetodoPago) => pedidos.reduce((a, p) => a + montoPorMetodo(p, m), 0);

  const totalVendido = pedidos.reduce((a, p) => a + (p.cobro?.total ?? 0), 0);
  const totalComprado = compras.reduce((a, c) => a + c.total, 0);

  const cierre: CierreCaja = {
    fecha,
    totalVendido,
    totalComprado,
    ganancia: totalVendido - totalComprado,
    efectivo: porMetodo('Efectivo'),
    sinpe: porMetodo('Sinpe'),
    tarjeta: porMetodo('Tarjeta'),
    cerradoPorId: admin.id,
    cerradoPorNombre: admin.nombre,
    hora: nowHHmm(),
  };

  // Doc id = fecha, así un cierre nuevo de la misma fecha reemplaza al anterior.
  await db.collection('cierresCaja').doc(fecha).set(cierre);
  return cierre;
}
