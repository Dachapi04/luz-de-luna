import type { Pedido } from '@/domain/types';
import { MesaButton } from './MesaButton';
import { pedidoAbierto } from '@/domain/pedidos';

export function MesaSection({
  titulo,
  nombres,
  pedidos,
  onSelect,
}: {
  titulo: string;
  nombres: string[];
  pedidos: Pedido[];
  onSelect: (mesa: string) => void;
}) {
  if (!nombres.length) return null;
  return (
    <section className="mb-[22px]">
      <div className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-2">{titulo}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(146px,1fr))] gap-2.5">
        {nombres.map((nombre) => (
          <MesaButton
            key={nombre}
            nombre={nombre}
            pedido={pedidoAbierto(pedidos, nombre)}
            onTap={() => onSelect(nombre)}
          />
        ))}
      </div>
    </section>
  );
}
