'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { landingPathFor } from '@/domain/permissions';
import { Logo } from '@/components/layout/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(landingPathFor(user.rol));
  }, [user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!usuario.trim() || !clave) {
      setError('Ingresa usuario y contraseña');
      return;
    }
    setLoading(true);
    try {
      await login(usuario.trim(), clave);
    } catch {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-8">
      <div className="w-full max-w-[420px] animate-slide-up">
        <div className="mb-1.5 flex items-center gap-2.5">
          <Logo size={26} />
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-luna">Control de negocio</div>
        </div>
        <h1 className="m-0 mb-1.5 font-serif text-[46px] font-semibold leading-[1.02]">Luz de Luna</h1>
        <p className="m-0 mb-6 text-sm leading-relaxed text-text-soft">
          Entra con tu usuario y contraseña. Tu rol define la pantalla con la que inicias.
        </p>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-3 rounded-xl border border-border-strong bg-surface-raised p-5"
        >
          <Input
            label="Usuario"
            value={usuario}
            onChange={(e) => {
              setUsuario(e.target.value);
              setError('');
            }}
            placeholder="usuario"
            autoComplete="username"
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={clave}
            onChange={(e) => {
              setClave(e.target.value);
              setError('');
            }}
            placeholder="••••"
            autoComplete="current-password"
          />
          {error && <div className="font-mono text-xs text-bad-fg">{error}</div>}
          <Button type="submit" disabled={loading} className="mt-1">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-[18px] text-xs leading-relaxed text-muted">
          Primer acceso: usuario <span className="font-mono text-gold">admin</span>, contraseña{' '}
          <span className="font-mono text-gold">admin123</span>. Cámbiala desde Usuarios.
        </div>
      </div>
    </div>
  );
}
