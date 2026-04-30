'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PhoneFrame from '../../components/ui/PhoneFrame';
import AppHeader from '../../components/ui/AppHeader';
import Greeting from '../../components/ui/Greeting';
import Segment from '../../components/ui/Segment';
import SectionHead from '../../components/ui/SectionHead';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import ChipComposer from '../../components/features/ChipComposer';
import QuickAdd from '../../components/features/QuickAdd';
import TodoRow from '../../components/features/TodoRow';
import DraggableList from '../../components/features/DraggableList';
import { formatDuration } from '../../lib/time';
import { useTodos } from '../../hooks/useTodos';

export default function TasksPage() {
  const router = useRouter();
  const { todos = [], addTodo, removeTodo, reorderTodos } = useTodos();
  const [draft, setDraft] = useState('');
  // pendingDeletion: { id, task, timeoutId } | null
  // Holds the row that is hidden but not yet deleted on the server. The
  // timeout fires removeTodo after a grace window; Undo clears it.
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const pendingRef = useRef(null);
  pendingRef.current = pendingDeletion;

  // Note: if the page unmounts with a pending deletion, the setTimeout still
  // fires and removeTodo is the module-level singleton from useTodos, so the
  // deletion commits as the user intended. No cleanup needed.

  // Hide pending row from the list so the UI updates immediately.
  const visibleTodos = pendingDeletion
    ? todos.filter((t) => t._id !== pendingDeletion.id)
    : todos;
  const totalMin = visibleTodos.reduce((s, t) => s + (t.duration || 0), 0);

  const handleSegmentChange = (val) => {
    if (val === 'schedule') router.push('/schedule');
  };

  const handleScheduleClick = () => {
    if (visibleTodos.length === 0) return;
    router.push('/preview');
  };

  const handleRequestDelete = (todo) => {
    // If another deletion is already pending, commit it now before queuing
    // the next — keeps state simple (only one pending at a time).
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timeoutId);
      removeTodo(pendingRef.current.id);
    }
    const id = todo._id;
    const timeoutId = setTimeout(() => {
      removeTodo(id);
      setPendingDeletion((cur) => (cur && cur.id === id ? null : cur));
    }, 3500);
    setPendingDeletion({ id, task: todo.task, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!pendingDeletion) return;
    clearTimeout(pendingDeletion.timeoutId);
    setPendingDeletion(null);
  };

  return (
    <PhoneFrame>
      <AppHeader
        left={
          <button
            type="button"
            className="ss-iconbtn"
            onClick={() => router.push('/schedule')}
            aria-label="Back to schedule"
          >
            <Icon name="arrowL" size={16} />
          </button>
        }
        center={<Greeting day="TODAY · BRAIN DUMP" />}
        right={
          <Link href="/settings" aria-label="Settings">
            <button type="button" className="ss-iconbtn">
              <Icon name="settings" size={16} />
            </button>
          </Link>
        }
      />

      <Segment
        value="tasks"
        onChange={handleSegmentChange}
        options={[
          { value: 'schedule', label: 'Schedule', icon: 'calendar' },
          { value: 'tasks', label: 'Tasks', icon: 'list' },
        ]}
      />

      <SectionHead
        title="Drafts"
        count={`${visibleTodos.length} · ${formatDuration(totalMin) || '0m'} total`}
      />

      <div
        className="ss-scroll"
        style={{ flex: 1, padding: '0 16px', minHeight: 0, position: 'relative' }}
      >
        <div className="ss-stack ss-stack-tight">
          <DraggableList
            items={visibleTodos}
            getId={(t) => t._id}
            onReorder={(orderedIds) => reorderTodos(orderedIds)}
            renderItem={(t, { dragHandleProps }) => (
              <TodoRow
                todo={t}
                idx={t.position}
                onRequestDelete={() => handleRequestDelete(t)}
                dragHandleProps={dragHandleProps}
              />
            )}
          />
        </div>
        <div style={{ height: 8 }} />
      </div>

      {pendingDeletion ? (
        <div
          role="status"
          aria-live="polite"
          className="ss-card"
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 88,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 12,
            color: 'var(--fg)',
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-mono)',
            zIndex: 5,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Deleted {pendingDeletion.task}
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--go)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              flexShrink: 0,
            }}
          >
            Undo
          </button>
        </div>
      ) : null}

      <QuickAdd onAdd={(parsed) => addTodo(parsed)} />

      <ChipComposer
        value={draft}
        onChange={setDraft}
        onSubmit={(parsed) => addTodo(parsed)}
      />

      <div style={{ padding: '0 16px 18px' }}>
        <Button
          variant="go"
          onClick={handleScheduleClick}
          disabled={visibleTodos.length === 0}
          style={{ width: '100%', padding: 14 }}
        >
          <Icon name="sparkles" size={16} stroke={2} />
          Schedule {visibleTodos.length} {visibleTodos.length === 1 ? 'task' : 'tasks'} with AI
        </Button>
      </div>
    </PhoneFrame>
  );
}
