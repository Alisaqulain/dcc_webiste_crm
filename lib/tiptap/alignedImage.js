import Image from '@tiptap/extension-image';

export const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          const a = attributes.align || 'center';
          const style =
            a === 'left'
              ? 'float:left;margin:0 1rem 0.75rem 0;max-width:min(100%,520px);height:auto;'
              : a === 'right'
                ? 'float:right;margin:0 0 0.75rem 1rem;max-width:min(100%,520px);height:auto;'
                : 'display:block;margin:1.25rem auto;max-width:100%;height:auto;';
          return { 'data-align': a, style };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes('image', { align }),
    };
  },
});
