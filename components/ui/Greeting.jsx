export default function Greeting({ day = 'TODAY', date }) {
  const today = date ?? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return (
    <div className="ss-greeting">
      <div className="day">{day}</div>
      <div className="date">{today}</div>
    </div>
  );
}
