'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, item, renderItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const dragHandleProps = { ref: setNodeRef, ...attributes, ...listeners };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, { dragHandleProps: { ...attributes, ...listeners }, isDragging })}
    </div>
  );
}

export default function DraggableList({ items, getId, onReorder, renderItem, disabled }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (disabled) {
    return (
      <>
        {items.map((item) => (
          <div key={getId(item)}>
            {renderItem(item, { dragHandleProps: {}, isDragging: false })}
          </div>
        ))}
      </>
    );
  }

  const ids = items.map((item) => String(getId(item)));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    onReorder(next);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item) => {
          const id = String(getId(item));
          return <SortableItem key={id} id={id} item={item} renderItem={renderItem} />;
        })}
      </SortableContext>
    </DndContext>
  );
}
