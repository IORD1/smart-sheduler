export default function AppHeader({ left, center, right }) {
  return (
    <div className="ss-header">
      <div>{left}</div>
      <div>{center}</div>
      <div>{right}</div>
    </div>
  );
}
