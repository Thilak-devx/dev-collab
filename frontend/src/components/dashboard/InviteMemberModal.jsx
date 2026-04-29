import { useEffect, useState } from "react";
import {
  Copy,
  Instagram,
  Link2,
  Mail,
  MessageCircle,
  Send,
  X,
} from "lucide-react";

export default function InviteMemberModal({
  open,
  onClose,
  onSubmit,
  onGenerateLink,
  onRegenerateLink,
  onCopyLink,
  inviteLink = "",
  expiresAt = "",
  maxUses = null,
  usedCount = 0,
  loading,
  linkLoading = false,
  error,
}) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    })
    : "";

  const handleCopy = async (source) => {
    if (!inviteLink) {
      return;
    }

    await onCopyLink(inviteLink, source);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950/92 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
              Team invite
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">Invite member</h2>
          </div>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5">
          <form
            className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(email);
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Mail className="h-4 w-4 text-brand-300" />
              Invite by email
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-text-muted">Member email</span>
              <input
                className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                type="email"
                value={email}
                required
              />
            </label>

            <button
              className="h-10 rounded-xl bg-gradient-to-r from-brand-600 to-blue-500 px-4 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? "Inviting..." : "Invite member"}
            </button>
          </form>

          <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Link2 className="h-4 w-4 text-sky-300" />
                  Shareable invite link
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  Invite link expires in 24h.
                  {expiryLabel ? ` Current link expires ${expiryLabel}.` : ""}
                </p>
              </div>

              <button
                className="h-10 rounded-xl border border-white/8 px-4 text-sm font-medium text-text-primary transition hover:bg-white/[0.05] disabled:opacity-70"
                disabled={linkLoading}
                onClick={onGenerateLink}
                type="button"
              >
                {linkLoading ? "Working..." : inviteLink ? "Generate new link" : "Generate invite link"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/8 bg-slate-950/55 p-3">
                <p className="break-all text-sm text-text-primary">
                  {inviteLink || "Generate a link to share this project outside the app."}
                </p>
              </div>

              {inviteLink ? (
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                  <span>Invite link expires in 24h</span>
                  {maxUses ? <span>{Math.max(maxUses - usedCount, 0)} uses left</span> : <span>Unlimited uses</span>}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3.5 text-sm text-text-primary transition hover:bg-white/[0.05] disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("copy")}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>

                <a
                  className={`inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3.5 text-sm transition ${
                    inviteLink
                      ? "text-text-primary hover:bg-white/[0.05]"
                      : "pointer-events-none text-text-subtle opacity-50"
                  }`}
                  href={
                    inviteLink
                      ? `https://wa.me/?text=${encodeURIComponent(`Join my DevCollab project: ${inviteLink}`)}`
                      : undefined
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>

                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3.5 text-sm text-text-primary transition hover:bg-white/[0.05] disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("Discord")}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                  Discord
                </button>

                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3.5 text-sm text-text-primary transition hover:bg-white/[0.05] disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("Instagram")}
                  type="button"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </button>

                {inviteLink ? (
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3.5 text-sm text-text-primary transition hover:bg-white/[0.05] disabled:opacity-50"
                    disabled={linkLoading}
                    onClick={onRegenerateLink}
                    type="button"
                  >
                    <Link2 className="h-4 w-4" />
                    Regenerate link
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <button
              className="h-10 rounded-xl border border-white/8 px-4 text-sm text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
