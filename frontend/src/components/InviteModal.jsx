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

export default function InviteModal({
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
  loading = false,
  linkLoading = false,
  error = "",
}) {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!open) {
      setEmail("");
      setCopied("");
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
    setCopied(source === "copy" ? "Copied!" : `${source} link copied`);
    window.setTimeout(() => setCopied(""), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_28px_80px_rgba(2,6,23,0.58)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="app-kicker">Project access</p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">Invite Members</h2>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-text-muted transition hover:bg-white/[0.06] hover:text-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="space-y-5">
          <form
            className="app-panel-secondary p-4"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(email);
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Mail className="h-4 w-4 text-brand-300" />
              Invite by email
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-text-muted">Member email</span>
              <input
                className="premium-auth-input h-11 pl-3.5"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                type="email"
                value={email}
                required
              />
            </label>

            <button
              className="mt-4 app-primary-button disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? "Inviting..." : "Invite member"}
            </button>
          </form>

          <section className="app-panel-primary p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Link2 className="h-4 w-4 text-sky-300" />
                  Invite by link
                </div>
                <p className="mt-2 app-muted-copy">
                  Invite link expires in 24h.
                  {expiryLabel ? ` Current link expires ${expiryLabel}.` : ""}
                </p>
              </div>

              <button
                className="app-action-button disabled:opacity-70"
                disabled={linkLoading}
                onClick={onGenerateLink}
                type="button"
              >
                {linkLoading ? "Working..." : inviteLink ? "Generate Invite Link" : "Generate Invite Link"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3">
                <input
                  className="w-full bg-transparent text-sm text-text-primary outline-none"
                  readOnly
                  value={inviteLink || "Generate an invite link to share this project."}
                />
              </div>

              {inviteLink ? (
                <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                  <span>{copied || "Ready to share"}</span>
                  {maxUses ? <span>{Math.max(maxUses - usedCount, 0)} uses left</span> : <span>Unlimited uses</span>}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  className="app-action-button disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("copy")}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Copy Invite Link
                </button>

                <a
                  className={`app-action-button ${inviteLink ? "" : "pointer-events-none opacity-50"}`}
                  href={
                    inviteLink
                      ? `https://wa.me/?text=${encodeURIComponent(`Join my project: ${inviteLink}`)}`
                      : undefined
                  }
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>

                <button
                  className="app-action-button disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("Discord")}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                  Discord
                </button>

                <button
                  className="app-action-button disabled:opacity-50"
                  disabled={!inviteLink}
                  onClick={() => handleCopy("Instagram")}
                  type="button"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </button>

                {inviteLink ? (
                  <button
                    className="app-action-button disabled:opacity-50"
                    disabled={linkLoading}
                    onClick={onRegenerateLink}
                    type="button"
                  >
                    <Link2 className="h-4 w-4" />
                    Regenerate Link
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <div className="flex justify-end">
            <button className="app-action-button" onClick={onClose} type="button">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
