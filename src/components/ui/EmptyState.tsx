export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-in rounded-lg border border-dashed border-border-strong p-9 text-center text-sm leading-relaxed text-muted">
      {children}
    </div>
  );
}
