'use client';

import { apiFetch } from '@/lib/api/client';
import type { Rol, Usuario } from '@/domain/types';

export interface UsuarioInput {
  nombre: string;
  usuario: string;
  clave?: string;
  rol: Rol;
}

export const usuariosService = {
  crear: (input: UsuarioInput) =>
    apiFetch<Usuario>('/api/usuarios', { method: 'POST', body: JSON.stringify(input) }),

  editar: (id: string, input: UsuarioInput) =>
    apiFetch<Usuario>(`/api/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  eliminar: (id: string) => apiFetch<void>(`/api/usuarios/${id}`, { method: 'DELETE' }),
};
