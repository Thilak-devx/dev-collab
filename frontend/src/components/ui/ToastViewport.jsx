import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import useToast from "../../hooks/useToast";

const toneClasses = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-300",
    borderClass: "border-emerald-400/20",
  },
  error: {
    icon: TriangleAlert,
    iconClass: "text-red-300",
    borderClass: "border-red-400/20",
  },
  info: {
    icon: Info,
    iconClass: "text-brand-300",
    borderClass: "border-white/10",
  },
};

export default function ToastViewport() {
  const toastApi = useToast();

  if (!toastApi) {
    return null;
  }

  const { toasts, dismissToast } = toastApi;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toneClasses[toast.type] || toneClasses.info;
        const Icon = tone.icon;

        return (
          <article
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border ${tone.borderClass} bg-slate-950/88 p-4 shadow-[0_22px_60px_rgba(2,6,23,0.4)] backdrop-blur-xl`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] ${tone.iconClass}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-text-muted">{toast.description}</p>
                ) : null}
              </div>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-subtle transition hover:bg-white/[0.05] hover:text-text-primary"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
