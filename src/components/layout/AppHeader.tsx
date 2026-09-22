'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Logo } from './Logo';
import { VIEW_META, VIEWS_BY_ROLE, type ViewKey } from '@/domain/permissions';
import { formatDateLong, todayStr } from '@/lib/utils/date';

export function AppHeader({ wide, badges }: { wide: boolean; badges: Partial<Record<ViewKey, string>> }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;
  const views = VIEWS_BY_ROLE[user.rol];
  const shellClass = wide ? 'max-w-shell-admin' : 'max-w-shell';

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-sunken">
      <div className={clsx('mx-auto flex flex-wrap items-center gap-3.5 px-[18px] py-3', shellClass)}>
        <div className="mr-auto flex items-center gap-2.5">
          <Logo />
          <div>
            <div className="font-serif text-[17px] font-semibold leading-tight">Luz de Luna</div>
            <div className="font-mono text-[10px] text-muted-2">
              {user.nombre} · {user.rol}
            </div>
          </div>
        </div>
        {toast && (
          <div className="animate-scale-in rounded-full bg-ok px-[11px] py-1.5 font-mono text-[11px] text-ok-fg">
            {toast}
          </div>
        )}
        <div className="font-mono text-[11px] text-muted">{formatDateLong(todayStr())}</div>
        <button
          onClick={async () => {
            await logout();
            router.replace('/login');
          }}
          className="transition-fast press-scale cursor-pointer rounded-md border border-border-strong bg-transparent px-3 py-[7px] text-xs text-text-soft hover:border-gold"
        >
          Salir
        </button>
      </div>
      <nav className={clsx('mx-auto flex gap-1.5 overflow-x-auto px-[18px] pb-2.5', shellClass)}>
        {views.map((v) => {
          const active = pathname.startsWith(VIEW_META[v].path);
          return (
            <Link
              key={v}
              href={VIEW_META[v].path}
              className={clsx(
                'transition-base press-scale flex-none whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] no-underline',
                active
                  ? 'border-gold bg-gold font-semibold text-ink'
                  : 'border-border-strong bg-surface-raised text-text-soft hover:border-gold'
              )}
            >
              {VIEW_META[v].label}
              {badges[v] ? <span className="ml-1 font-mono text-[11px] opacity-75">{badges[v]}</span> : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
