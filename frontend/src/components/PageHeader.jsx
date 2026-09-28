export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-widest text-slate-500">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}