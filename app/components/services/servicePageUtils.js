/** Parse plain-text section content into intro, list heading, items, and tagline. */
export function parseSectionContent(content) {
  if (!content?.trim()) {
    return { paragraphs: [], listHeading: '', items: [], tagline: '' };
  }

  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const paragraphs = [];
  const items = [];
  let listHeading = '';
  let tagline = '';
  let mode = 'intro';

  const isTagline = (line) =>
    line.includes('—') ||
    line.includes(' – ') ||
    (/^(Grow|Transform|Boost|Elevate|Scale|Build|Drive)\s/i.test(line) && line.length > 30);

  const looksLikeListItem = (line) => {
    const wordCount = line.split(/\s+/).length;
    return (
      wordCount <= 12 &&
      line.length < 100 &&
      !line.endsWith(':') &&
      !line.match(/^[A-Z][^.!?]{80,}[.!?]$/)
    );
  };

  for (const line of lines) {
    const bullet = line.match(/^[-•*✓✔]\s*(.+)/);
    if (bullet) {
      mode = 'list';
      items.push(bullet[1].trim());
      continue;
    }

    if (line.endsWith(':') && /service|offer|include|provide|feature|we do|smo/i.test(line)) {
      listHeading = line.replace(/:$/, '').trim();
      mode = 'list';
      continue;
    }

    if (isTagline(line)) {
      if (mode === 'list' && items.length > 0) {
        tagline = line;
        mode = 'outro';
      } else if (paragraphs.length > 0 || items.length > 0) {
        tagline = line;
        mode = 'outro';
      } else {
        paragraphs.push(line);
      }
      continue;
    }

    if (mode === 'list') {
      if (looksLikeListItem(line)) {
        items.push(line);
        continue;
      }
      if (items.length > 0) {
        tagline = line;
        mode = 'outro';
        continue;
      }
    }

    if (mode === 'intro') {
      if (paragraphs.length > 0 && looksLikeListItem(line)) {
        mode = 'list';
        items.push(line);
        continue;
      }
      paragraphs.push(line);
      continue;
    }

    if (!tagline) tagline = line;
  }

  return { paragraphs, listHeading, items, tagline };
}

export function mergeSectionItems(section) {
  const parsed = parseSectionContent(section.content || '');
  const bullets = [...(section.bullets || []), ...parsed.items];
  const uniqueBullets = [...new Set(bullets.map((b) => b.trim()).filter(Boolean))];

  const itemSet = new Set([...parsed.items, ...uniqueBullets].map((b) => b.trim()));
  const intro = parsed.paragraphs
    .filter((p) => {
      const t = p.trim();
      return t && !itemSet.has(t) && t !== parsed.listHeading;
    })
    .join('\n\n');

  return {
    ...parsed,
    bullets: uniqueBullets,
    intro,
    hasListContent: uniqueBullets.length > 0,
  };
}
