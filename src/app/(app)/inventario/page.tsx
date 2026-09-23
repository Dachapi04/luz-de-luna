'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { useProductos } from '@/hooks/useProductos';
import { insumosBajoStock } from '@/domain/inventory';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { CATEGORIAS, type Producto } from '@/domain/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Spinner';
import { ProductoCard } from '@/components/inventario/ProductoCard';
import { ProductoForm, emptyProductoForm, type ProductoFormState, type RecetaFormLine } from '@/components/inventario/ProductoForm';
import { includesNorm } from '@/lib/utils/normalize';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { productosService } from '@/services/productosService';
import { ApiClientError } from '@/lib/api/client';

export default function InventarioPage() {
  useViewGuard('inventario');
  const { show } = useToast();
  const confirm = useConfirm();
  const { data: productos, loading } = useProductos();

  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todas');
  const [form, setForm] = useState<ProductoFormState>(emptyProductoForm);
  const [receta, setReceta] = useState<RecetaFormLine[]>([]);
  const [saving, setSaving] = useState(false);

  const bajos = insumosBajoStock(productos);
  const filtrados = productos.filter(
    (p) => (!query || includesNorm(p.nombre, query)) && (cat === 'Todas' || p.categoria === cat)
  );

  function editar(p: Producto) {
    setForm({
      id: p.id,
      nombre: p.nombre,
      tipo: p.tipo,
      categoria: p.categoria,
      unidad: p.unidad,
      cantidad: String(p.cantidad ?? ''),
      stockMinimo: String(p.stockMinimo ?? ''),
      precio: String(p.precio ?? ''),
    });
    setReceta((p.receta ?? []).map((r) => ({ insumoId: r.insumoId, nombre: r.insumoNombre, cantidad: String(r.cantidad) })));
  }

  function cancelar() {
    setForm(emptyProductoForm);
    setReceta([]);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      show('Falta el nombre', 'error');
      return;
    }
    setSaving(true);
    try {
      const input = {
        nombre: form.nombre,
        tipo: form.tipo,
        categoria: form.categoria,
        unidad: form.unidad,
        cantidad: form.tipo === 'insumo' ? Number(form.cantidad) || 0 : undefined,
        stockMinimo: form.tipo === 'insumo' ? Number(form.stockMinimo) || 0 : undefined,
        precio: form.tipo === 'platillo' ? Number(form.precio) || 0 : undefined,
        receta:
          form.tipo === 'platillo'
            ? receta.map((r) => ({ insumoId: r.insumoId, insumoNombre: r.nombre, cantidad: Number(r.cantidad) || 0 }))
            : [],
      };
      if (form.id) await productosService.editar(form.id, input);
      else await productosService.crear(input);
      show(form.id ? 'Producto actualizado' : 'Producto creado');
      cancelar();
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo guardar el producto', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(p: Producto) {
    const ok = await confirm({
      title: 'Eliminar producto',
      body: `¿Eliminar "${p.nombre}"? Si es insumo, las recetas que lo usan quedarán incompletas.`,
    });
    if (!ok) return;
    try {
      await productosService.eliminar(p.id);
      show('Producto eliminado');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el producto', 'error');
    }
  }

  async function ajustar(p: Producto, delta: number) {
    try {
      await productosService.ajustarStock(p.id, delta);
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo ajustar el stock', 'error');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.inventario.label} subtitle={VIEW_META.inventario.subtitle} />

      {bajos.length > 0 && (
        <div className="mb-4 rounded-lg border border-[oklch(0.45_0.09_62)] bg-[oklch(0.27_0.05_60)] px-4 py-3.5">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-warn-fg">Reabastecer</div>
          <div className="text-[13px] leading-relaxed text-[oklch(0.93_0.02_80)]">
            {bajos.map((p) => `${p.nombre} (${p.cantidad}/${p.stockMinimo} ${p.unidad})`).join(' · ')}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-[18px]">
        <section>
          <div className="mb-2.5 flex flex-wrap gap-2.5">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre" className="min-w-[150px] flex-1 text-[13px]" />
            <Select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              options={['Todas', ...CATEGORIAS].map((c) => ({ value: c, label: c }))}
              className="w-[160px] text-[13px]"
            />
          </div>
          {loading ? (
            <SkeletonRows count={6} />
          ) : filtrados.length === 0 ? (
            <EmptyState>
              {productos.length === 0
                ? 'Aún no hay productos. Crea el primer insumo o platillo en el panel de la derecha.'
                : 'Ningún producto coincide con la búsqueda o la categoría.'}
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-2">
              {filtrados.map((p) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  productos={productos}
                  onAjustar={(d) => ajustar(p, d)}
                  onEdit={() => editar(p)}
                  onDelete={() => eliminar(p)}
                />
              ))}
            </div>
          )}
        </section>

        <ProductoForm
          form={form}
          setForm={setForm}
          receta={receta}
          setReceta={setReceta}
          productos={productos}
          saving={saving}
          onSubmit={guardar}
          onCancel={cancelar}
        />
      </div>
    </>
  );
}
