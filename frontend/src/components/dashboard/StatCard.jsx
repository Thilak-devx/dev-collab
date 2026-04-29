export default function StatCard({ label, value, hint, icon: Icon, accent = "text-brand-300" }) {
  return (
    <article className="app-panel-primary p-4 hover:-translate-y-[1px] hover:border-white/12 hover:shadow-[0_22px_46px_rgba(2,6,23,0.3)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-kicker">{label}</p>
          <p className="mt-3 text-[1.9rem] font-semibold tracking-[-0.03em] text-text-primary">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Icon className={`h-4.5 w-4.5 ${accent}`} />
        </div>
      </div>
      <p className="mt-2 app-muted-copy">{hint}</p>
    </article>
  );
}
