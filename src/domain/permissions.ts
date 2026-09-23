import type { Rol } from './types';

export type ViewKey =
  | 'mesas'
  | 'pedido'
  | 'comandas'
  | 'cobro'
  | 'resumen'
  | 'compras'
  | 'inventario'
  | 'ventas'
  | 'cobros'
  | 'usuarios';

/** Which views each role can reach, in nav order. First entry is the landing view. */
export const VIEWS_BY_ROLE: Record<Rol, ViewKey[]> = {
  admin: ['resumen', 'compras', 'inventario', 'ventas', 'cobros', 'usuarios'],
  mesero: ['mesas', 'pedido'],
  cocina: ['comandas'],
  bartender: ['comandas'],
  // El cajero cobra (pantalla de entrada) pero también puede tomar pedidos
  // directamente en caja — mismo flujo que el mesero, para poder cobrar al
  // instante lo que piden en el mostrador.
  cajero: ['cobro', 'mesas', 'pedido'],
};

export const VIEW_META: Record<ViewKey, { label: string; subtitle: string; path: string }> = {
  mesas: {
    label: 'Mesas',
    subtitle: 'Las ocupadas tienen un pedido sin cobrar. Toca una para abrirla o seguir agregando.',
    path: '/mesas',
  },
  pedido: {
    label: 'Toma de pedido',
    subtitle:
      'Busca el platillo por nombre, define cantidad, detalle y destino. Al enviar se descuenta el inventario según la receta.',
    path: '/pedido',
  },
  comandas: {
    label: 'Comandas',
    subtitle:
      'Tacha cada producto al prepararlo. Cuando todos los tuyos quedan listos, la comanda pasa a tu historial del día.',
    path: '/comandas',
  },
  cobro: {
    label: 'Cobro',
    subtitle: 'Selecciona una mesa ocupada, revisa el pedido y cobra con Efectivo, Sinpe o Tarjeta.',
    path: '/cobro',
  },
  resumen: {
    label: 'Resumen',
    subtitle: 'Ventas, compras y ganancia por periodo, desglose de productos y cierre de caja por fecha.',
    path: '/resumen',
  },
  compras: {
    label: 'Compras',
    subtitle: 'Registra compras y gastos. Si el concepto coincide con un insumo, la cantidad entra al stock.',
    path: '/compras',
  },
  inventario: {
    label: 'Inventario',
    subtitle:
      'Insumos con stock y mínimo; platillos con receta y precio. El disponible de un platillo lo limita su insumo más escaso.',
    path: '/inventario',
  },
  ventas: {
    label: 'Ventas',
    subtitle: 'Pedidos agrupados con sus líneas. Quitar una línea o eliminar el pedido restituye el inventario.',
    path: '/ventas',
  },
  cobros: {
    label: 'Cobros',
    subtitle: 'Registro de cobros filtrable por periodo y cajero.',
    path: '/cobros',
  },
  usuarios: {
    label: 'Usuarios',
    subtitle: 'Altas, cambios de rol y bajas. Siempre debe quedar un admin.',
    path: '/usuarios',
  },
};

export function landingPathFor(rol: Rol): string {
  const first = VIEWS_BY_ROLE[rol][0]!;
  return VIEW_META[first].path;
}

export function canAccessView(rol: Rol, view: ViewKey): boolean {
  return VIEWS_BY_ROLE[rol].includes(view);
}

export const ESTACION_BY_ROLE: Partial<Record<Rol, 'cocina' | 'bartender'>> = {
  cocina: 'cocina',
  bartender: 'bartender',
};

export const ADMIN_ROLES: Rol[] = ['admin'];
