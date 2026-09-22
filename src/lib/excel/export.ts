import 'server-only';
import * as XLSX from 'xlsx';
import { getAdminDb } from '@/config/firebase.admin';
import type { CierreCaja, Compra, Pedido, Producto, Usuario } from '@/domain/types';

/** Respaldo completo del negocio: una hoja por colección. */
export async function buildBackupWorkbook(): Promise<Buffer> {
  const db = getAdminDb();
  const [productos, compras, pedidos, cierres, usuarios] = await Promise.all([
    db.collection('productos').get(),
    db.collection('compras').get(),
    db.collection('pedidos').get(),
    db.collection('cierresCaja').get(),
    db.collection('usuarios').get(),
  ]);

  const wb = XLSX.utils.book_new();

  const productosRows = productos.docs.map((d) => {
    const p = { id: d.id, ...(d.data() as Omit<Producto, 'id'>) };
    return {
      id: p.id,
      nombre: p.nombre,
      tipo: p.tipo,
      categoria: p.categoria,
      unidad: p.unidad,
      cantidad: p.cantidad ?? '',
      stockMinimo: p.stockMinimo ?? '',
      precio: p.precio ?? '',
      receta: p.tipo === 'platillo' ? JSON.stringify(p.receta ?? []) : '',
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productosRows), 'Inventario');

  const comprasRows = compras.docs.map((d) => {
    const c = { id: d.id, ...(d.data() as Omit<Compra, 'id'>) };
    return { ...c };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comprasRows), 'Compras');

  const ventasRows: Record<string, unknown>[] = [];
  const cobrosRows: Record<string, unknown>[] = [];
  pedidos.docs.forEach((d) => {
    const p = { id: d.id, ...(d.data() as Omit<Pedido, 'id'>) } as Pedido;
    p.items.forEach((i) => {
      ventasRows.push({
        pedidoId: p.id,
        mesa: p.mesa,
        fecha: p.fecha,
        horaCreacion: p.horaCreacion,
        mesero: p.meseroNombre,
        pagado: p.pagado,
        producto: i.producto,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        total: i.total,
        detalle: i.detalle,
        destino: i.destino,
        listo: i.listo,
      });
    });
    if (p.cobro) {
      cobrosRows.push({
        pedidoId: p.id,
        mesa: p.mesa,
        fecha: p.fecha,
        total: p.cobro.total,
        metodoPago: p.cobro.metodoPago,
        recibido: p.cobro.recibido,
        vuelto: p.cobro.vuelto,
        cajero: p.cobro.cajeroNombre,
        fechaHora: p.cobro.fechaHora,
      });
    }
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventasRows), 'Ventas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cobrosRows), 'Cobros');

  const cierresRows = cierres.docs.map((d) => d.data() as CierreCaja);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cierresRows), 'CierresCaja');

  const usuariosRows = usuarios.docs.map((d) => {
    const u = { id: d.id, ...(d.data() as Omit<Usuario, 'id'>) };
    return { id: u.id, nombre: u.nombre, usuario: u.usuario, rol: u.rol };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usuariosRows), 'Usuarios');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
