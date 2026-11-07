'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { SECTION_LABELS } from '@/features/weddings/section-defaults';
import type { WeddingSection } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Handlers = {
  onMove: (ids: string[]) => void;
  onToggle: (section: WeddingSection) => void;
  onEdit: (section: WeddingSection) => void;
  onDelete: (section: WeddingSection) => void;
};

function SortableRow({
  section,
  index,
  ids,
  handlers,
}: {
  section: WeddingSection;
  index: number;
  ids: string[];
  handlers: Handlers;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    handlers.onMove(arrayMove(ids, index, target));
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-60' : ''}
    >
      <Card className={section.is_enabled ? '' : 'opacity-60'}>
        <CardContent className="flex items-center gap-3 p-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag to reorder ${section.title || SECTION_LABELS[section.type]}`}
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {section.title || SECTION_LABELS[section.type]}
            </p>
            <p className="text-xs text-muted-foreground">{SECTION_LABELS[section.type]}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handlers.onToggle(section)}>
            {section.is_enabled ? 'Enabled' : 'Disabled'}
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => move(1)}
              disabled={index === ids.length - 1}
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlers.onEdit(section)}
              aria-label="Edit section"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlers.onDelete(section)}
              aria-label="Delete section"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

export function SortableSectionList({
  sections,
  handlers,
}: {
  sections: WeddingSection[];
  handlers: Handlers;
}) {
  const [ids, setIds] = useState<string[]>(() => sections.map((s) => s.id));

  useEffect(() => {
    setIds(sections.map((s) => s.id));
  }, [sections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    setIds(next);
    handlers.onMove(next);
  }

  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {ids.map((id, index) => {
            const section = byId.get(id);
            if (!section) return null;
            return (
              <SortableRow
                key={id}
                section={section}
                index={index}
                ids={ids}
                handlers={handlers}
              />
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}