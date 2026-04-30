export default function SectionHead({ title, count, action }) {
  return (
    <div className="ss-section-head">
      <h3>{title}</h3>
      {action ?? (count != null ? <span className="count">{count}</span> : null)}
    </div>
  );
}
