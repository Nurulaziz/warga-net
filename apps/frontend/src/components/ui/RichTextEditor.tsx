import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ content, onChange, minHeight = '350px' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 min-h-[${minHeight}] text-[#0F172A] dark:text-gray-200`,
      },
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-[#E2E8F0] dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#E2E8F0] dark:border-gray-700 bg-[#F8FAFC] dark:bg-gray-900">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <span className="font-bold text-xs">B</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <span className="italic text-xs">I</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <span className="underline text-xs">U</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-[#E2E8F0] dark:bg-gray-700 mx-1" />

        <ToolbarButton
          active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Rata Kiri"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M2 3h12v1H2zm0 4h8v1H2zm0 4h12v1H2z"/></svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Rata Tengah"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M2 3h12v1H2zm2 4h8v1H4zm-2 4h12v1H2z"/></svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Rata Kanan"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><path d="M2 3h12v1H2zm4 4h8v1H6zm-4 4h12v1H2z"/></svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-[#E2E8F0] dark:bg-gray-700 mx-1" />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><circle cx="3" cy="4" r="1.5"/><path d="M6 3h8v1H6zm0 4h8v1H6zm0 4h8v1H6z"/><circle cx="3" cy="8" r="1.5"/><circle cx="3" cy="12" r="1.5"/></svg>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16"><text x="1" y="5" fontSize="5">1.</text><path d="M6 3h8v1H6zm0 4h8v1H6zm0 4h8v1H6z"/><text x="1" y="9" fontSize="5">2.</text><text x="1" y="13" fontSize="5">3.</text></svg>
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({ children, active, onClick, title }: { children: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
        active
          ? 'bg-[#0054A6]/10 text-[#0054A6] dark:text-blue-400'
          : 'text-[#64748B] hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#0F172A] dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
