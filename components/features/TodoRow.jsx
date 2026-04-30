'use client';

import { CATEGORIES } from '../../lib/categories';
import { formatDuration } from '../../lib/time';
import Icon from '../ui/Icon';

export default function TodoRow({ todo, idx, onRemove, onRequestDelete, dragHandleProps }) {
  const cat = CATEGORIES[todo.category];
  return (
    <div className="ss-row" style={{ padding: '10px 12px' }}>
      {dragHandleProps ? (
        <button
          type="button"
          className="ss-iconbtn"
          {...dragHandleProps}
          style={{
            width: 22,
            height: 28,
            borderRadius: 6,
            cursor: 'grab',
            touchAction: 'none',
            background: 'transparent',
            border: 'none',
          }}
          aria-label="Drag to reorder"
        >
          <Icon name="grip" size={14} color="var(--fg-3)" />
        </button>
      ) : null}
      <span
        className="row-cat"
        style={{ background: cat ? cat.color : 'var(--surface-3)' }}
      />
      <div className="row-body">
        <div className="row-title">
          {todo.priority ? (
            <span style={{ color: 'var(--prio)', marginRight: 4 }}>!</span>
          ) : null}
          {todo.task}
        </div>
        <div className="row-meta">
          {cat ? (
            <span style={{ color: cat.color }}>#{todo.category}</span>
          ) : null}
          {todo.duration ? <span>· {formatDuration(todo.duration)}</span> : null}
        </div>
      </div>
      <button
        type="button"
        className="ss-iconbtn"
        style={{ width: 28, height: 28, borderRadius: 8 }}
        onClick={onRequestDelete || onRemove}
        aria-label="Remove todo"
      >
        <Icon name="x" size={12} />
      </button>
    </div>
  );
}
