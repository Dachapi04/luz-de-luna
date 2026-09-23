'use client';

import { useState } from 'react';
import { useViewGuard } from '@/hooks/useViewGuard';
import { useUsuarios } from '@/hooks/useUsuarios';
import { PageHeader } from '@/components/layout/PageHeader';
import { VIEW_META } from '@/domain/permissions';
import { ROLES, type Rol, type Usuario } from '@/domain/types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonRows } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { usuariosService } from '@/services/usuariosService';
import { ApiClientError } from '@/lib/api/client';

const emptyForm = { nombre: '', usuario: '', clave: '', rol: 'mesero' as Rol, pin: '' };

export default function UsuariosPage() {
  useViewGuard('usuarios');
  const { show } = useToast();
  const confirm = useConfirm();
  const { data: usuarios, loading } = useUsuarios();
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const admins = usuarios.filter((u) => u.rol === 'admin').length;
  const set = <K extends keyof typeof emptyForm>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value as (typeof emptyForm)[K] }));

  function editar(u: Usuario) {
    setEditId(u.id);
    setForm({ nombre: u.nombre, usuario: u.usuario, clave: '', rol: u.rol, pin: '' });
  }

  function cancelar() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.usuario.trim()) {
      show('Falta nombre o usuario');
      return;
    }
    if (form.pin && !/^\d{4,6}$/.test(form.pin)) {
      show('El PIN debe tener entre 4 y 6 dígitos');
      return;
    }
    setSaving(true);
    try {
      if (editId) await usuariosService.editar(editId, form);
      else await usuariosService.crear(form);
      show(editId ? 'Usuario actualizado' : 'Usuario creado');
      cancelar();
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo guardar el usuario');
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(u: Usuario) {
    const last = u.rol === 'admin' && admins === 1;
    if (last) {
      show('No se puede eliminar al último admin');
      return;
    }
    const ok = await confirm({ title: 'Eliminar usuario', body: `¿Eliminar la cuenta de ${u.nombre} (@${u.usuario})?` });
    if (!ok) return;
    try {
      await usuariosService.eliminar(u.id);
      show('Usuario eliminado');
    } catch (err) {
      show(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el usuario');
    }
  }

  return (
    <>
      <PageHeader title={VIEW_META.usuarios.label} subtitle={VIEW_META.usuarios.subtitle} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        <section className="flex flex-col gap-2">
          {loading ? (
            <SkeletonRows count={5} />
          ) : (
            usuarios.map((u) => {
              const last = u.rol === 'admin' && admins === 1;
              return (
                <div
                  key={u.id}
                  className={`stagger-child flex flex-wrap items-center gap-2.5 rounded-md border bg-surface-sunken p-3.5 ${
                    editId === u.id ? 'border-[oklch(0.42_0.06_70)]' : 'border-border'
                  }`}
                >
                  <span className="min-w-[140px] flex-1">
                    <span className="block text-sm font-semibold">{u.nombre}</span>
                    <span className="block font-mono text-[11px] text-muted-2">
                      @{u.usuario}
                      {last ? ' · único admin' : ''}
                    </span>
                  </span>
                  <Badge tone={u.rol === 'admin' ? 'warn' : 'luna'}>{u.rol}</Badge>
                  <button
                    onClick={() => editar(u)}
                    className="cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs text-text-soft hover:border-gold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(u)}
                    className={`cursor-pointer rounded-[7px] border border-border-strong bg-transparent px-2.5 py-[7px] text-xs ${
                      last ? 'text-[oklch(0.5_0.02_60)]' : 'text-[oklch(0.74_0.09_30)]'
                    }`}
                  >
                    Eliminar
                  </button>
                </div>
              );
            })
          )}
          <div className="mt-1 text-xs leading-relaxed text-muted">
            Siempre debe quedar al menos un usuario admin: el sistema bloquea eliminar o degradar al último.
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-[17px]">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">
            {editId ? 'Editar usuario' : 'Nuevo usuario'}
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
            <Input label="Nombre" wrapperClassName="col-span-full" value={form.nombre} onChange={set('nombre')} placeholder="Nombre y apellido" />
            <Input label="Usuario" value={form.usuario} onChange={set('usuario')} placeholder="único" />
            <Input label="Contraseña" type="password" value={form.clave} onChange={set('clave')} placeholder={editId ? 'dejar en blanco para no cambiar' : '••••'} />
            <Select
              label="Rol"
              wrapperClassName="col-span-full"
              value={form.rol}
              onChange={set('rol')}
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            {form.rol === 'admin' && (
              <Input
                label="PIN de autorización"
                wrapperClassName="col-span-full"
                value={form.pin}
                onChange={set('pin')}
                placeholder={editId ? 'dejar en blanco para no cambiar' : '4 a 6 dígitos, opcional'}
                inputMode="numeric"
                maxLength={6}
              />
            )}
          </div>
          {form.rol === 'admin' && (
            <div className="mt-1.5 text-xs leading-relaxed text-muted">
              Este PIN lo puede usar mesero o cajero para autorizar cambios en una comanda ya enviada (quitar un
              producto, cambiar cantidad o eliminar la mesa) sin necesitar tu usuario y contraseña.
            </div>
          )}
          <div className="mt-3.5 flex gap-2.5">
            <Button fullWidth disabled={saving} onClick={guardar}>
              {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
            {editId && (
              <Button variant="secondary" onClick={cancelar}>
                Cancelar
              </Button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
