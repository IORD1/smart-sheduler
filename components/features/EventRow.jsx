import Icon from '../ui/Icon';
import Chip from '../ui/Chip';
import { CATEGORIES } from '../../lib/categories';
import { tToMin, minToT, durMin, formatDuration } from '../../lib/time';

export default function EventRow({ ev, onClick }) {
  const cat = CATEGORIES[ev.category];
  const clickable = typeof onClick === 'function';
  const handleKeyDown = clickable
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(ev);
        }
      }
    : undefined;
  return (
    <div
      className="ss-row"
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onClick(ev) : undefined}
      onKeyDown={handleKeyDown}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      <span
        className="row-cat"
        style={{ background: cat ? cat.color : 'var(--surface-3)' }}
      />
      <div className="row-body">
        <div className="row-title">
          {ev.priority ? <span style={{ color: 'var(--prio)' }}>! </span> : null}
          {ev.title}
        </div>
        <div className="row-meta">
          <span>
            {minToT(tToMin(ev.start))} – {minToT(tToMin(ev.end))}
          </span>
          <span>· {formatDuration(durMin(ev.start, ev.end))}</span>
        </div>
      </div>
      {ev.locked ? <Icon name="pin" size={13} color="var(--fg-3)" /> : null}
      {ev.new ? <Chip kind="go">NEW</Chip> : null}
    </div>
  );
}
