'use client';

import { useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { AlignedImage } from '@/lib/tiptap/alignedImage';

function parseInitialContent(initialJson, initialHtml) {
  if (initialJson && typeof initialJson === 'string' && initialJson.trim()) {
    try {
      return JSON.parse(initialJson);
    } catch {
      /* fall through */
    }
  }
  if (initialHtml && initialHtml.trim()) return initialHtml;
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

const btn =
  'px-2 py-1.5 text-sm rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed';
const btnActive = 'bg-red-50 border-red-200 text-red-800';

export default function BlogRichEditor({
  initialJson = '',
  initialHtml = '',
  onChange,
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'rounded-lg bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto' } },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-red-600 underline font-medium' },
      }),
      AlignedImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: 'Write your article…' }),
    ],
    content: parseInitialContent(initialJson, initialHtml),
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[280px] px-3 py-3 focus:outline-none prose-headings:font-semibold',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current?.({
        json: JSON.stringify(ed.getJSON()),
        html: ed.getHTML(),
      });
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        window.alert('Image must be 5MB or smaller');
        return;
      }
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.url) {
          editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
        } else {
          window.alert(data.message || 'Upload failed');
        }
      } catch {
        window.alert('Upload failed');
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[320px] rounded-lg border border-gray-200 bg-gray-50 animate-pulse" />
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <select
          className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white"
          onChange={(e) => {
            const v = e.target.value;
            if (v === 'p') editor.chain().focus().setParagraph().run();
            else if (v === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (v === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (v === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            e.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Heading
          </option>
          <option value="p">Paragraph</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
        </select>
        <button
          type="button"
          className={`${btn} ${editor.isActive('bold') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('italic') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('underline') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          Underline
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('highlight') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          Highlight
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('bulletList') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('orderedList') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button type="button" className={btn} onClick={setLink}>
          Link
        </button>
        <button type="button" className={btn} onClick={addImage}>
          Image
        </button>
        <span className="text-gray-300 self-center">|</span>
        <button
          type="button"
          className={`${btn} ${editor.isActive({ textAlign: 'left' }) ? btnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          ←
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive({ textAlign: 'center' }) ? btnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          ↔
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive({ textAlign: 'right' }) ? btnActive : ''}`}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          →
        </button>
        <span className="text-gray-300 self-center">|</span>
        <button
          type="button"
          className={`${btn} ${editor.isActive('image') ? '' : 'opacity-40'}`}
          disabled={!editor.isActive('image')}
          onClick={() => editor.chain().focus().setImageAlign('left').run()}
        >
          Img L
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('image') ? '' : 'opacity-40'}`}
          disabled={!editor.isActive('image')}
          onClick={() => editor.chain().focus().setImageAlign('center').run()}
        >
          Img C
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('image') ? '' : 'opacity-40'}`}
          disabled={!editor.isActive('image')}
          onClick={() => editor.chain().focus().setImageAlign('right').run()}
        >
          Img R
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('codeBlock') ? btnActive : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            className={`${btn} border-0`}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            type="button"
            className={`${btn} border-0`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>
          <button type="button" className={`${btn} border-0`} onClick={setLink}>
            Link
          </button>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="blog-tiptap-editor" />
    </div>
  );
}
