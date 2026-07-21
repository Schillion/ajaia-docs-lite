"use client";

import type { Editor } from "@tiptap/react";

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isActive}
      title={label}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2 py-2"
    >
      <ToolbarButton
        label="Bold (Ctrl+B)"
        isActive={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Italic (Ctrl+I)"
        isActive={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        label="Underline (Ctrl+U)"
        isActive={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <ToolbarButton
        label="Heading 1"
        isActive={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        isActive={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        label="Paragraph"
        isActive={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        P
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <ToolbarButton
        label="Bulleted list"
        isActive={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        isActive={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.≡
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />

      <ToolbarButton
        label="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        ↺
      </ToolbarButton>
      <ToolbarButton
        label="Redo (Ctrl+Shift+Z)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        ↻
      </ToolbarButton>
    </div>
  );
}
