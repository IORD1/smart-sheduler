'use client';

import { useEffect, useRef } from 'react';
import { parseTodo } from '../../lib/parseTodo';
import { CATEGORIES } from '../../lib/categories';
import { formatDuration } from '../../lib/time';
import Chip from '../ui/Chip';
import Icon from '../ui/Icon';

export default function ChipComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Try: tennis @1h #health !',
}) {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const parsed = parseTodo(value);
  const empty =
    !parsed.task && !parsed.category && !parsed.priority && parsed.duration == null;
  const hasMetaOnly =
    !parsed.task && (parsed.category || parsed.priority || parsed.duration != null);

  const submit = () => {
    if (!parsed.task) return;
    onSubmit(parsed);
    onChange('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && parsed.task) {
      submit();
    }
  };

  return (
    <div>
      {!empty && (
        <div className="ss-parsed-preview">
          {parsed.task ? (
            <span style={{ color: 'var(--fg-1)', fontWeight: 500 }}>{parsed.task}</span>
          ) : null}
          {parsed.duration != null ? (
            <Chip kind="duration" icon="clock">
              {formatDuration(parsed.duration)}
            </Chip>
          ) : null}
          {parsed.category ? (
            <Chip kind={parsed.category}>{CATEGORIES[parsed.category].label}</Chip>
          ) : null}
          {parsed.priority ? <Chip kind="prio">priority</Chip> : null}
          {hasMetaOnly ? (
            <span
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                marginLeft: 4,
              }}
            >
              Add a task name
            </span>
          ) : null}
        </div>
      )}
      <div className="ss-composer">
        <input
          ref={inputRef}
          className="ss-composer-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          type="button"
          className="ss-composer-send"
          onClick={submit}
          disabled={!parsed.task}
        >
          <Icon name="plus" size={20} stroke={2.4} />
        </button>
      </div>
    </div>
  );
}
