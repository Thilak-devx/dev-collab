const tabs = [
  { id: "tasks", label: "Tasks" },
  { id: "chat", label: "Chat" },
  { id: "activity", label: "Activity" },
  { id: "members", label: "Members" },
];

export default function ProjectWorkspaceTabs({ activeTab, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-slate-950/55 p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === tab.id
              ? "bg-white/[0.08] text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              : "text-text-muted hover:bg-white/[0.04] hover:text-text-primary"
          }`}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
