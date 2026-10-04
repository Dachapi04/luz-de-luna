'use client';

import type { jsPDF } from 'jspdf';
import type { Pedido } from '@/domain/types';
import { pagosDe, totalPedido } from '@/domain/pedidos';
import { formatMoney } from '@/lib/utils/money';
import { formatDateCorta, horaDe } from '@/lib/utils/date';

/**
 * Comprobante de pago para impresora térmica de rollo (80 mm): ancho fijo y
 * alto según el contenido. No es la factura electrónica de Hacienda — solo
 * un comprobante para entregar al cliente.
 */

const NEGOCIO = 'LUZ DE LUNA';
const TELEFONO = '6050-8706';
const DESPEDIDA = '¡Gracias por su visita!';
const ANCHO_MM = 80;
const MARGEN = 4;
const UTIL = ANCHO_MM - MARGEN * 2;

/**
 * Las fuentes estándar de PDF solo traen el juego WinAnsi: no existe ₡ ni
 * emojis. Los colones van como ¢ y cualquier otro carácter raro se quita
 * (los espacios especiales de toLocaleString pasan a espacio normal).
 */
const dinero = (n: number) => formatMoney(n).replace('₡', '¢').replace(/\s/g, ' ');
const limpio = (s: string) =>
  s
    .replace(/\s/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/ {2,}/g, ' ')
    .trim();

/** Dibuja el comprobante y devuelve el alto usado (mm). Se llama dos veces: una para medir, otra para el PDF final. */
function dibujar(doc: jsPDF, pedido: Pedido): number {
  let y = MARGEN + 2;
  const der = ANCHO_MM - MARGEN;

  const texto = (
    s: string,
    opts: { size?: number; bold?: boolean; italic?: boolean; align?: 'left' | 'center' | 'right'; sangria?: number } = {}
  ) => {
    const size = opts.size ?? 9;
    doc.setFont('helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
    doc.setFontSize(size);
    const sangria = opts.sangria ?? 0;
    const lineas: string[] = doc.splitTextToSize(limpio(s), UTIL - sangria);
    const alto = size * 0.3528 * 1.25; // pt → mm, con interlineado
    for (const l of lineas) {
      y += alto;
      const x = opts.align === 'center' ? ANCHO_MM / 2 : opts.align === 'right' ? der : MARGEN + sangria;
      doc.text(l, x, y, { align: opts.align ?? 'left' });
    }
  };

  /** Texto a la izquierda (con ajuste de línea) y monto alineado a la derecha en la primera línea. */
  const fila = (izq: string, monto: string, opts: { size?: number; bold?: boolean; sangria?: number } = {}) => {
    const size = opts.size ?? 9;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const anchoMonto = doc.getTextWidth(monto) + 2;
    const sangria = opts.sangria ?? 0;
    const lineas: string[] = doc.splitTextToSize(limpio(izq), UTIL - anchoMonto - sangria);
    const alto = size * 0.3528 * 1.25;
    lineas.forEach((l, i) => {
      y += alto;
      doc.text(l, MARGEN + sangria, y);
      if (i === 0) doc.text(monto, der, y, { align: 'right' });
    });
  };

  const separador = () => {
    y += 2;
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.setLineWidth(0.2);
    doc.line(MARGEN, y, der, y);
    y += 0.5;
  };

  texto(NEGOCIO, { size: 15, bold: true, align: 'center' });
  texto(`Tel. ${TELEFONO}`, { size: 8, align: 'center' });
  texto('Comprobante de pago', { size: 9, align: 'center' });
  separador();

  const hora = pedido.cobro?.fechaHora ? horaDe(pedido.cobro.fechaHora) : pedido.horaCreacion;
  texto(`No. ${pedido.id.slice(-6).toUpperCase()}`, { size: 8 });
  texto(`Fecha: ${formatDateCorta(pedido.fecha)} · Hora: ${hora}`, { size: 8 });
  texto(`Mesa: ${pedido.mesa}`, { size: 8 });
  texto(`Atendió: ${pedido.meseroNombre}`, { size: 8 });
  if (pedido.cobro?.cajeroNombre) texto(`Cajero: ${pedido.cobro.cajeroNombre}`, { size: 8 });
  separador();

  for (const i of pedido.items) {
    fila(`${i.cantidad} x ${i.producto}`, dinero(i.total));
    if (i.cantidad > 1) texto(`${dinero(i.precioUnitario)} c/u`, { size: 7, sangria: 3 });
    if (i.detalle) texto(i.detalle, { size: 7, italic: true, sangria: 3 });
  }
  separador();

  y += 1;
  fila('TOTAL', dinero(totalPedido(pedido)), { size: 12, bold: true });
  y += 1;

  const pagos = pagosDe(pedido);
  if (pagos.length) {
    separador();
    for (const pg of pagos) {
      fila(pg.nota ? `${pg.metodoPago} (${pg.nota})` : pg.metodoPago, dinero(pg.monto), { size: 8 });
      if (pg.metodoPago === 'Efectivo' && pg.vuelto > 0) {
        fila('Recibido', dinero(pg.recibido), { size: 7, sangria: 3 });
        fila('Vuelto', dinero(pg.vuelto), { size: 7, sangria: 3 });
      }
    }
  }
  separador();

  y += 1;
  texto(DESPEDIDA, { size: 9, align: 'center' });
  return y + MARGEN + 4;
}

export async function crearComprobantePdf(pedido: Pedido): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const medida = new jsPDF({ unit: 'mm', format: [ANCHO_MM, 2000] });
  const alto = dibujar(medida, pedido);
  // jsPDF pone siempre el lado mayor como alto en vertical: un comprobante
  // más corto que ancho necesita 'landscape' para no quedar girado.
  const doc = new jsPDF({ unit: 'mm', format: [ANCHO_MM, alto], orientation: alto >= ANCHO_MM ? 'portrait' : 'landscape' });
  doc.setProperties({ title: `Comprobante ${pedido.mesa}` });
  dibujar(doc, pedido);
  return doc;
}

/**
 * Abre el comprobante en una pestaña nueva con el diálogo de impresión. La
 * pestaña se abre antes de generar el PDF (todavía dentro del clic) para que
 * el bloqueador de ventanas emergentes no la frene; si igual se bloquea, se
 * descarga el archivo.
 */
export async function imprimirComprobante(pedido: Pedido): Promise<void> {
  const ventana = window.open('', '_blank');
  try {
    const doc = await crearComprobantePdf(pedido);
    if (ventana) {
      doc.autoPrint();
      ventana.location.href = String(doc.output('bloburl'));
    } else {
      doc.save(`comprobante-${pedido.mesa}-${pedido.fecha}.pdf`);
    }
  } catch (err) {
    ventana?.close();
    throw err;
  }
}
