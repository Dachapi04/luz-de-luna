'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { useCompras } from '@/hooks/useCompras';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { CATEGORIAS, type Categoria } from '@/domain/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Spinner';
import { formatMoney } from '@/lib/utils/money';
import { includesNorm } from '@/lib/utils/normalize';
import { todayStr } from '@/lib/utils/date';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { comprasService } from '@/services/comprasService';
import { ApiClientError } from '@/lib/api/client';

const initialForm = { fecha: todayStr(), concepto: '', categoria: 'Insumos' as Categoria, cantidad: '', unidad: '', total: '' };

export default function ComprasPage() {
  useViewGuard('compras');
  const { show } = useToast();
  const confirm = useConfirm();
  const { data: compras, loading } = useCompras();
  const [form, setForm] = useState(initialForm);
  const [filtro, setFiltro] = useState('');
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof typeof initialForm>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value as (typeof initialForm)[K] }));

  async function guardar() {
    if (!form.concepto.trim() || !form.total) {
      show('Falta concepto o total', 'error');
      return;
    }
    setSaving(true);
    try {
      const { insumoActualizado } = await comprasService.crear({
        fecha: form.fecha || todayStr(),
        concepto: form.concepto,
        categoria: form.categoria,
        cantidad: form.cantidad ? Number(form.cantidad) : null,
        unidad: form.unidad || null,
        total: Number(form.total),
      });
      setForm(initialForm);
      show(insumoActualizado ? `Compra guardada · stock de ${insumoActualizado} actualizado` : 'Compra guardada');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo guardar la compra', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(id: string, concepto: string, fecha: string) {
    const ok = await confirm({
      title: 'Eliminar compra',
      body: `¿Eliminar "${concepto}" del ${fecha}? Esta acción no se puede deshacer.`,
    });
    if (!ok) return;
    try {
      await comprasService.eliminar(id);
      show('Compra eliminada');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la compra', 'error');
    }
  }

  const filtradas = compras.filter((c) => !filtro || includesNorm(c.concepto, filtro) || c.fecha.includes(filtro));

  return (
    <>
      <PageHeader title={VIEW_META.compras.label} subtitle={VIEW_META.compras.subtitle} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        <section className="rounded-lg border border-border bg-surface p-[17px]">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Registrar compra o gasto</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
            <Input label="Concepto" wrapperClassName="col-span-full" value={form.concepto} onChange={set('concepto')} placeholder="Nombre del insumo o del gasto" />
            <Input label="Fecha" value={form.fecha} onChange={set('fecha')} placeholder={todayStr()} />
            <Select label="Categoría" value={form.categoria} onChange={set('categoria')} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
            <Input label="Cantidad" value={form.cantidad} onChange={set('cantidad')} placeholder="opcional" />
            <Input label="Unidad" value={form.unidad} onChange={set('unidad')} placeholder="kg, botella" />
            <Input label="Total" mono value={form.total} onChange={set('total')} placeholder="0" />
          </div>
          <Button fullWidth className="mt-3.5" disabled={saving} onClick={guardar}>
            {saving ? 'Guardando…' : 'Guardar compra'}
          </Button>
          <div className="mt-2.5 text-xs leading-relaxed text-muted">
            Si el concepto coincide con un insumo y hay cantidad, el stock de ese insumo sube automáticamente.
          </div>
        </section>

        <section>
          <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
            <div className="mr-auto font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Compras registradas</div>
            <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por fecha o concepto" className="min-w-[190px] py-2 text-[13px]" />
          </div>
          {loading ? (
            <SkeletonRows count={4} />
          ) : filtradas.length === 0 ? (
            <EmptyState>Aún no hay compras registradas. Usa el formulario de la izquierda.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2">
              {filtradas.map((c) => (
                <div key={c.id} className="stagger-child flex items-center gap-2.5 rounded-md border border-border bg-surface-sunken p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">{c.concepto}</span>
                    <span className="block font-mono text-[11px] text-muted-2">
                      {c.fecha} · {c.categoria}
                      {c.cantidad ? ` · ${c.cantidad} ${c.unidad ?? ''}` : ''}
                    </span>
                  </span>
                  <span className="font-mono text-[13px]">{formatMoney(c.total)}</span>
                  <button
                    onClick={() => eliminar(c.id, c.concepto, c.fecha)}
                    className="transition-fast cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-[oklch(0.74_0.09_30)] hover:border-[oklch(0.6_0.14_30)]"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
