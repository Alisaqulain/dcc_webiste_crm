const SECTION_PATTERNS = [
  { key: 'overview', labels: ['course overview', 'overview', 'about this course', 'introduction'] },
  { key: 'learn', labels: ['what you will learn', 'what you\'ll learn', 'learning outcomes', 'you will learn'] },
  { key: 'audience', labels: ['who should join', 'who is this for', 'who should take', 'target audience', 'ideal for'] },
  { key: 'benefits', labels: ['benefits', 'key benefits', 'why join', 'why choose'] },
];

function cleanLine(line) {
  return String(line || '')
    .replace(/^[\s•\-–—*]+/, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .replace(/^[\u{1F300}-\u{1FAFF}\u2600-\u27BF]\s*/u, '')
    .trim();
}

function isBulletLine(line) {
  const t = line.trim();
  return /^([\u{1F300}-\u{1FAFF}\u2600-\u27BF]|[•\-–—*]|\d+[\.\)])/u.test(t);
}

function parseBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let current = null;

  const startBlock = (title, type = 'text') => {
    if (current) blocks.push(current);
    current = { title, type, items: [], paragraphs: [] };
  };

  for (const raw of lines) {
    const lower = raw.toLowerCase().replace(/[:\-–—]+$/, '').trim();
    const matched = SECTION_PATTERNS.find((p) =>
      p.labels.some((label) => lower === label || lower.startsWith(`${label}:`))
    );

    if (matched) {
      startBlock(
        raw.replace(/[:\-–—]+$/, '').trim() ||
          matched.labels[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        'section'
      );
      continue;
    }

    if (!current) startBlock('Course Overview', 'section');

    if (isBulletLine(raw)) {
      current.type = 'list';
      const item = cleanLine(raw);
      if (item) current.items.push(item);
    } else {
      current.paragraphs.push(raw);
    }
  }

  if (current) blocks.push(current);
  return blocks.length ? blocks : [{ title: 'Course Overview', type: 'text', items: [], paragraphs: [text] }];
}

export function formatCourseDescription(description) {
  return parseBlocks(description);
}

export default formatCourseDescription;
