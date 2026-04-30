import Icon from '../ui/Icon';

export default function AISummaryCard({ newCount, eventCount, summary }) {
  const taskWord = newCount === 1 ? 'task' : 'tasks';
  const eventWord = eventCount === 1 ? 'event' : 'events';
  const headline =
    eventCount === 0
      ? `Plan ${newCount} ${taskWord} for today`
      : `Fit ${newCount} ${taskWord} around ${eventCount} ${eventWord}`;
  return (
    <div
      style={{
        margin: '0 16px 14px',
        padding: '12px 14px',
        background:
          'linear-gradient(135deg, var(--go-glow), transparent 70%), var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'var(--go)',
            color: 'var(--go-fg)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="sparkles" size={13} stroke={2.5} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>
          {headline}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-2)',
          lineHeight: 1.45,
        }}
      >
        {summary}
      </div>
    </div>
  );
}
