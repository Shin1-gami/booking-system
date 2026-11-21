import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle2, Circle, GripVertical, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/common/Button';

export interface BoardTask {
  id: string;
  title: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  completed: boolean;
}

const STORAGE_KEY = 'booking_system_priority_tasks';

const DEFAULT_TASKS: BoardTask[] = [
  { id: 'task-1', title: 'Перевірити бронювання конференц-залів на тиждень', priority: 'HIGH', completed: false },
  { id: 'task-2', title: 'Оновити опис та фотографії нового обладнання', priority: 'NORMAL', completed: false },
  { id: 'task-3', title: 'Підтвердити заявки зі статусом PENDING', priority: 'HIGH', completed: false },
  { id: 'task-4', title: 'Провести планове обслуговування проєктора', priority: 'LOW', completed: true },
];

function SortableTaskItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border bg-white p-3.5 shadow-xs transition dark:bg-slate-900 ${
        isDragging
          ? 'border-primary-500 shadow-lg ring-2 ring-primary-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <button
        type="button"
        aria-label="Перетягнути елемент"
        className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing dark:hover:bg-slate-800"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<BoardTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as BoardTask[]) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      { id: `task-${crypto.randomUUID()}`, title: trimmed, priority: 'NORMAL', completed: false },
      ...prev,
    ]);
    setNewTitle('');
  };

  const toggleCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Пріоритетний чекліст адміністрування (Drag & Drop)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Перетягуйте завдання мишею або клавіатурою (Пробіл + стрілки) для зміни пріоритету
          </p>
        </div>
      </div>

      <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Додати нове завдання підготовки ресурсу..."
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <Button type="submit" size="sm">
          <Plus className="h-4 w-4" />
          Додати
        </Button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {tasks.map((task, idx) => (
              <SortableTaskItem key={task.id} id={task.id}>
                <button
                  type="button"
                  onClick={() => toggleCompleted(task.id)}
                  aria-label="Позначити виконаним"
                  className="text-primary-600 dark:text-primary-400"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      task.completed
                        ? 'text-slate-400 line-through'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {task.title}
                  </p>
                </div>

                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  #{idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  aria-label="Видалити завдання"
                  className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </SortableTaskItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}