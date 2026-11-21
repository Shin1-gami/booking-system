import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, List, ListOrdered, Quote, Redo2, Undo2 } from 'lucide-react';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  error?: string;
}

export default function RichTextEditor({ label, value, onChange, error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-32 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none',
      },
    },
    onUpdate: ({ editor: instance }) => {
      const text = instance.getText().trim();
      onChange(text ? instance.getHTML() : '');
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const toolbarButtons = [
    {
      label: 'Жирний',
      icon: Bold,
      active: editor.isActive('bold'),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Курсив',
      icon: Italic,
      active: editor.isActive('italic'),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Заголовок',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Маркований список',
      icon: List,
      active: editor.isActive('bulletList'),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Нумерований список',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Цитата',
      icon: Quote,
      active: editor.isActive('blockquote'),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      )}

      <div
        className={`overflow-hidden rounded-xl border bg-white dark:bg-slate-800 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900/60">
          {toolbarButtons.map(({ label: btnLabel, icon: Icon, active, action }) => (
            <button
              key={btnLabel}
              type="button"
              title={btnLabel}
              aria-label={btnLabel}
              onClick={action}
              className={`rounded-md p-1.5 transition ${
                active
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}

          <div className="mx-1 h-4 w-px bg-slate-300 dark:bg-slate-700" />

          <button
            type="button"
            title="Скасувати"
            aria-label="Скасувати"
            onClick={() => editor.chain().focus().undo().run()}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Повторити"
            aria-label="Повторити"
            onClick={() => editor.chain().focus().redo().run()}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}