'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useViewGuard } from '@/hooks/useViewGuard';
import { usePedidosAbiertos } from '@/hooks/usePedidos';
import { useProductos } from '@/hooks/useProductos';
import { pedidoAbierto, totalPedido } from '@/domain/pedidos';
import { disponiblePlatillo } from '@/domain/inventory';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductSearch } from '@/components/pedido/ProductSearch';
import { CartLineEditor } from '@/components/pedido/CartLineEditor';
import { SentLines } from '@/components/pedido/SentLines';
import { addToCart, type CartLine } from '@/components/pedido/cart';
import { formatMoney } from '@/lib/utils/money';
import { useToast } from '@/components/ui/ToastProvider';
import { usePinPrompt } from '@/components/ui/PinProvider';
import { pedidosService } from '@/services/pedidosService';
import { ApiClientError } from '@/lib/api/client';
import type { PedidoItem } from '@/domain/types';

export default function PedidoPage() {
  useViewGuard('pedido');
  const router = useRouter();
  const { show } = useToast();
  const pinPrompt = usePinPrompt();
  const mesa = useSearchParams().get('mesa') ?? '';
  const { data: abiertos } = usePedidosAbiertos();
  const { data: productos } = useProductos();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sending, setSending] = useState(false);

  const pedido = mesa ? pedidoAbierto(abiertos, mesa) : undefined;

  function pick(p: (typeof productos)[number]) {
    const disp = disponiblePlatillo(p, productos);
    if (disp <= 0) {
      show(`Sin insumos para ${p.nombre}`, 'error');
      return;
    }
    setCart((c) => addToCart(c, p));
  }

  const updateLine = (i: number, patch: Partial<CartLine>) =>
    setCart((c) => c.map((line, j) => (j === i ? { ...line, ...patch } : line)));

  const removeLine = (i: number) => setCart((c) => c.filter((_, j) => j !== i));

  const pendientes = cart.reduce((a, c) => a + c.cantidad, 0);

  async function enviar() {
    if (!cart.length) {
      show('No hay líneas por enviar', 'error');
      return;
    }
    setSending(true);
    try {
      await pedidosService.enviar(
        mesa,
        cart.map((c) => ({ productoId: c.productoId, cantidad: c.cantidad, detalle: c.detalle, destino: c.destino }))
      );
      setCart([]);
      setQuery('');
      show(`Comanda enviada · ${mesa}`);
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo enviar la comanda', 'error');
    } finally {
      setSending(false);
    }
  }

  /** Pide el PIN de un administrador y solo entonces ejecuta la acción. */
  async function autorizarYEjecutar(titulo: string, cuerpo: string, accion: (pin: string) => Promise<void>) {
    const pin = await pinPrompt(titulo, cuerpo);
    if (!pin) return false;
    try {
      await accion(pin);
      return true;
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo completar la acción', 'error');
      return false;
    }
  }

  async function onCambiarCantidad(item: PedidoItem, nuevaCantidad: number) {
    if (!pedido || nuevaCantidad < 1) return;
    const ok = await autorizarYEjecutar(
      'Cambiar cantidad',
      `Cambiar "${item.producto}" de ${item.cantidad} a ${nuevaCantidad}. Pídele el PIN a un administrador.`,
      (pin) => pedidosService.cambiarCantidad(pedido.id, item.id, nuevaCantidad, pin)
    );
    if (ok) show('Cantidad actualizada');
  }

  async function onQuitarItem(item: PedidoItem) {
    if (!pedido) return;
    const ok = await autorizarYEjecutar(
      'Quitar producto',
      `Quitar "${item.producto}" del pedido de ${mesa}. Se restituye el inventario. Pídele el PIN a un administrador.`,
      (pin) => pedidosService.quitarItem(pedido.id, item.id, pin)
    );
    if (ok) show('Producto quitado');
  }

  async function onEliminarMesa() {
    if (!pedido) return;
    const ok = await autorizarYEjecutar(
      'Eliminar mesa',
      `Eliminar todo el pedido de ${mesa} y dejar la mesa libre. Se restituye el inventario. Pídele el PIN a un administrador.`,
      (pin) => pedidosService.eliminar(pedido.id, pin)
    );
    if (ok) {
      show(`Mesa ${mesa} eliminada`);
      router.push('/mesas');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.pedido.label} subtitle={VIEW_META.pedido.subtitle} />

      {!mesa && <EmptyState>Elige una mesa para tomar el pedido.</EmptyState>}

      {mesa && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-[18px]">
          <ProductSearch productos={productos} query={query} onQuery={setQuery} onPick={pick} />

          <section className="flex flex-col gap-3.5">
            <div className="rounded-lg border border-border bg-surface p-[15px]">
              <div className="flex items-baseline justify-between gap-2.5 border-b border-border pb-[11px]">
                <div>
                  <div className="font-serif text-[21px] font-semibold">{mesa}</div>
                  <div className="font-mono text-[11px] text-muted-2">
                    {pedido ? `abierta ${pedido.horaCreacion} · ${pedido.meseroNombre}` : 'nueva mesa'}
                  </div>
                </div>
                <Badge tone={pedido ? 'warn' : 'luna'}>{pedido ? 'Ocupada' : 'Libre'}</Badge>
              </div>

              <div className="mb-2 mt-[13px] font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                Por enviar
              </div>
              {cart.length === 0 && (
                <div className="pb-1 pt-2 text-[13px] text-muted-2">Toca un platillo del buscador para agregarlo.</div>
              )}
              <div className="flex flex-col gap-2.5">
                {cart.map((line, i) => (
                  <CartLineEditor
                    key={line.productoId}
                    line={line}
                    onInc={() => updateLine(i, { cantidad: line.cantidad + 1 })}
                    onDec={() => (line.cantidad > 1 ? updateLine(i, { cantidad: line.cantidad - 1 }) : removeLine(i))}
                    onDetalle={(v) => updateLine(i, { detalle: v })}
                    onDestino={(d) => updateLine(i, { destino: d })}
                    onRemove={() => removeLine(i)}
                  />
                ))}
              </div>
              <Button fullWidth className="mt-3.5" disabled={!pendientes || sending} onClick={enviar}>
                {sending ? 'Enviando…' : pendientes ? `Enviar ${pendientes} a cocina y bar` : 'Nada por enviar'}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-surface-sunken p-[15px]">
              <div className="mb-2.5 flex items-center justify-between gap-2.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
                  Ya pedido en esta mesa
                </div>
                {pedido && (
                  <button
                    onClick={onEliminarMesa}
                    className="transition-fast cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-1 text-[11px] text-[oklch(0.72_0.08_30)] hover:border-[oklch(0.6_0.14_30)]"
                  >
                    Eliminar mesa
                  </button>
                )}
              </div>
              <SentLines items={pedido?.items ?? []} onCambiarCantidad={onCambiarCantidad} onQuitar={onQuitarItem} />
              <div className="mt-3.5 flex items-baseline justify-between border-t border-border pt-2.5 font-mono">
                <span className="text-xs">Total mesa</span>
                <span className="text-lg">{formatMoney(pedido ? totalPedido(pedido) : 0)}</span>
              </div>
              {pedido && (
                <div className="mt-2.5 text-[11px] leading-relaxed text-muted-2">
                  Cambiar cantidad, quitar un producto o eliminar la mesa necesita el PIN de un administrador.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
