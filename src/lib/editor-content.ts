/**
 * Minimal, dependency-free converters from plain text / a Markdown subset
 * into Tiptap-compatible ProseMirror JSON. Intentionally covers only what
 * the brief asks for: headings (# / ##), paragraphs, bold, italic, bullet
 * and numbered lists. Anything fancier (tables, links, nested lists, code
 * blocks) is out of scope for this exercise.
 */

export interface TiptapMark {
  type: string;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

export function emptyDoc(): TiptapDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Parses inline bold (**text**) and italic (*text* or _text_) runs into Tiptap text nodes. */
function parseInline(text: string): TiptapNode[] {
  if (text.length === 0) return [];

  const nodes: TiptapNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      nodes.push({ type: "text", text: match[2], marks: [{ type: "bold" }] });
    } else {
      const italicText = match[3] ?? match[4] ?? "";
      nodes.push({ type: "text", text: italicText, marks: [{ type: "italic" }] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

function paragraphNode(text: string): TiptapNode {
  return { type: "paragraph", content: text ? parseInline(text) : [] };
}

function headingNode(level: number, text: string): TiptapNode {
  return { type: "heading", attrs: { level }, content: parseInline(text) };
}

type ListKind = "bulletList" | "orderedList";

function flushList(nodes: TiptapNode[], listKind: ListKind | null, items: string[]) {
  if (!listKind || items.length === 0) return;
  nodes.push({
    type: listKind,
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraphNode(item)],
    })),
  });
}

/** Converts a Markdown subset (headings, paragraphs, bold/italic, lists) into a Tiptap doc. */
export function markdownToTiptapDoc(markdown: string): TiptapDoc {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: TiptapNode[] = [];

  let listKind: ListKind | null = null;
  let listItems: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      nodes.push(paragraphNode(paragraphBuffer.join(" ")));
      paragraphBuffer = [];
    }
  };

  const flushCurrentList = () => {
    flushList(nodes, listKind, listItems);
    listKind = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph();
      flushCurrentList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushCurrentList();
      const level = Math.min(headingMatch[1].length, 2); // brief only requires H1/H2
      nodes.push(headingNode(level, headingMatch[2].trim()));
      continue;
    }

    const bulletMatch = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraph();
      if (listKind !== "bulletList") flushCurrentList();
      listKind = "bulletList";
      listItems.push(bulletMatch[1].trim());
      continue;
    }

    const orderedMatch = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      if (listKind !== "orderedList") flushCurrentList();
      listKind = "orderedList";
      listItems.push(orderedMatch[1].trim());
      continue;
    }

    flushCurrentList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushCurrentList();

  return { type: "doc", content: nodes.length > 0 ? nodes : [{ type: "paragraph" }] };
}

/** Plain text becomes one paragraph per non-empty line (blank lines separate paragraphs). */
export function plainTextToTiptapDoc(text: string): TiptapDoc {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: TiptapNode[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length > 0) {
      nodes.push(paragraphNode(buffer.join(" ")));
      buffer = [];
    }
  };

  for (const line of lines) {
    if (line.trim().length === 0) {
      flush();
    } else {
      buffer.push(line.trim());
    }
  }
  flush();

  return { type: "doc", content: nodes.length > 0 ? nodes : [{ type: "paragraph" }] };
}
