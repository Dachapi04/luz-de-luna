'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { CATEGORIAS, type Categoria, type Producto, type TipoProducto } from '@/domain/types';

export interface ProductoFormState {
  id?: string;
  nombre: string;
  tipo: TipoProducto;
  categoria: Categoria;
  unidad: string;
  cantidad: string;
  stockMinimo: string;
  precio: string;
}

export interface RecetaFormLine {
  insumoId: string;
  nombre: string;
  cantidad: string;
}

export const emptyProductoForm: ProductoFormState = {
  nombre: '',
  tipo: 'insumo',
  categoria: 'Insumos',
  unidad: '',
  cantidad: '',
  stockMinimo: '',
  precio: '',
};

export function ProductoForm({
  form,
  setForm,
  receta,
  setReceta,
  productos,
  saving,
  onSubmit,
  onCancel,
}: {
  form: ProductoFormState;
  setForm: (f: ProductoFormState) => void;
  receta: RecetaFormLine[];
  setReceta: (r: RecetaFormLine[]) => void;
  productos: Producto[];
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [recetaPick, setRecetaPick] = useState('');
  const editing = !!form.id;
  const insumos = productos.filter((p) => p.tipo === 'insumo');

  const set = <K extends keyof ProductoFormState>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value as ProductoFormState[K] });

  function addReceta() {
    const ins = insumos.find((p) => p.id === recetaPick);
    if (!ins) return;
    if (receta.some((r) => r.insumoId === ins.id)) return;
    setReceta([...receta, { insumoId: ins.id, nombre: ins.nombre, cantidad: '0.1' }]);
    setRecetaPick('');
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-[17px]">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
        {editing ? 'Editar producto' : 'Nuevo producto'}
      </div>
      <div className="mb-3 flex gap-1.5">
        <Chip pill={false} active={form.tipo === 'insumo'} onClick={() => setForm({ ...form, tipo: 'insumo' })}>
          Insumo
        </Chip>
        <Chip pill={false} active={form.tipo === 'platillo'} onClick={() => setForm({ ...form, tipo: 'platillo' })}>
          Platillo
        </Chip>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2.5">
        <Input label="Nombre" wrapperClassName="col-span-full" value={form.nombre} onChange={set('nombre')} placeholder="Nombre único" />
        <Select label="Categoría" value={form.categoria} onChange={set('categoria')} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
        <Input label="Unidad" value={form.unidad} onChange={set('unidad')} placeholder="kg, botella, porción" />
        {form.tipo === 'insumo' && (
          <>
            <Input label="Cantidad" value={form.cantidad} onChange={set('cantidad')} placeholder="0" />
            <Input label="Stock mínimo" value={form.stockMinimo} onChange={set('stockMinimo')} placeholder="0" />
          </>
        )}
        {form.tipo === 'platillo' && <Input label="Precio de venta" value={form.precio} onChange={set('precio')} placeholder="0" />}
      </div>

      {form.tipo === 'platillo' && (
        <div className="mt-3.5">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">Receta</div>
          <div className="flex flex-col gap-1.5">
            {receta.length === 0 && <div className="text-xs text-muted-2">Agrega los insumos que consume una porción.</div>}
            {receta.map((r, i) => (
              <div key={r.insumoId} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-[13px]">{r.nombre}</span>
                <input
                  type="text"
                  value={r.cantidad}
                  onChange={(e) => setReceta(receta.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))}
                  className="w-[82px] rounded-md border border-input-border bg-input-bg px-2.5 py-1.5 text-right font-mono text-[13px] outline-none focus-visible:border-gold"
                />
                <button
                  onClick={() => setReceta(receta.filter((_, j) => j !== i))}
                  className="cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-1.5 text-xs text-[oklch(0.74_0.09_30)]"
                >
                  −
                </button>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-2">
              <select
                value={recetaPick}
                onChange={(e) => setRecetaPick(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-input-border bg-input-bg px-2.5 py-2 text-[13px] outline-none focus-visible:border-gold"
              >
                <option value="">Elegir insumo…</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} ({i.unidad})
                  </option>
                ))}
              </select>
              <button
                onClick={addReceta}
                className="cursor-pointer rounded-[8px] border border-border-strong bg-surface-raised px-3.5 py-2 text-[13px]"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3.5 flex gap-2.5">
        <Button fullWidth disabled={saving} onClick={onSubmit}>
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
        </Button>
        {editing && (
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </section>
  );
}
