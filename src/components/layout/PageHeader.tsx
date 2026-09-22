export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-[18px] animate-slide-up">
      <h2 className="m-0 font-serif text-[27px] font-semibold leading-[1.12]">{title}</h2>
      <p className="m-0 mt-[5px] max-w-[70ch] text-[13px] leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}
