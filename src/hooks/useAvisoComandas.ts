'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { itemsDeEstacion } from '@/domain/pedidos';
import type { Destino, Pedido, PedidoItem } from '@/domain/types';
import { desbloquearSonido, escucharDesbloqueo, sonarComanda, sonidoBloqueado } from '@/lib/audio/alertas';

/** Marca como vistas las líneas recibidas; true si alguna es nueva y sigue pendiente. */
export function registrarNuevas(vistos: Set<string>, items: Pick<PedidoItem, 'id' | 'listo'>[]): boolean {
  let hayNuevas = false;
  for (const i of items) {
    if (vistos.has(i.id)) continue;
    vistos.add(i.id);
    if (!i.listo) hayNuevas = true;
  }
  return hayNuevas;
}

/**
 * Suena cuando llega una comanda nueva a la estación: es decir, cuando
 * aparece una línea suya (por id) que no se había visto antes y que aún no
 * está lista. Lo que ya estaba al abrir la pantalla no suena, ni tampoco
 * tachar/destachar, cambiar cantidades o quitar líneas.
 */
export function useAvisoComandas(estacion: Destino | undefined, pedidos: Pedido[], cargando: boolean) {
  const vistos = useRef<Set<string> | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (!estacion) return;
    setBloqueado(sonidoBloqueado());
    return escucharDesbloqueo(() => setBloqueado(sonidoBloqueado()));
  }, [estacion]);

  useEffect(() => {
    if (!estacion || cargando) return;
    const items = pedidos.flatMap((p) => itemsDeEstacion(p, estacion));
    if (!vistos.current) {
      // Primera carga: lo que ya existe es la línea base, no algo "nuevo".
      vistos.current = new Set(items.map((i) => i.id));
      return;
    }
    if (registrarNuevas(vistos.current, items)) sonarComanda(estacion);
  }, [estacion, pedidos, cargando]);

  /** Para el botón de "activar sonido": desbloquea y suena una vez como prueba. */
  const activar = useCallback(async () => {
    if (!estacion) return;
    await desbloquearSonido();
    setBloqueado(sonidoBloqueado());
    sonarComanda(estacion);
  }, [estacion]);

  return { bloqueado: !!estacion && bloqueado, activar };
}
