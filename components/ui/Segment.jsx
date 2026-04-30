'use client';

import Icon from './Icon';

export default function Segment({ value, onChange, options }) {
  return (
    <div className="ss-segment">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon ? <Icon name={opt.icon} size={14} /> : null}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
