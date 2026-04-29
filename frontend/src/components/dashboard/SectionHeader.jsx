export default function SectionHeader({ label, title, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="app-kicker">{label}</p>
        <h2 className="app-section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}
