import { Inbox } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/85 px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-300">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-base font-semibold text-text-primary">{title}</p>
      <p className="mt-2 app-muted-copy">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
