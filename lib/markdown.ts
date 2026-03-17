/**
 * Safe markdown to HTML converter
 * Converts basic markdown syntax to HTML with XSS protection
 */

// Allowed HTML tags for sanitization
const ALLOWED_TAGS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'];
const HEADING_PATTERN = /^<h[1-3]>.*<\/h[1-3]>$/;
const ORDERED_LIST_ITEM_PATTERN = /^\d+\.\s+(.*)$/;
const BULLET_LIST_ITEM_PATTERN = /^-\s+(.*)$/;

// Sanitize HTML string to prevent XSS
function sanitizeHtml(html: string): string {
  // Create a temporary element to parse HTML
  if (typeof document === 'undefined') {
    // Server-side: basic sanitization
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '');
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        if (!ALLOWED_TAGS.includes(tagName)) {
          // Replace disallowed elements with their text content
          const text = document.createTextNode(element.textContent || '');
          node.replaceChild(text, child);
        } else {
          // Remove all attributes except href for links
          const attrs = Array.from(element.attributes);
          for (const attr of attrs) {
            if (tagName === 'a' && attr.name === 'href') {
              // Validate href - only allow http, https, mailto
              const href = attr.value.toLowerCase();
              if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
                element.removeAttribute(attr.name);
              }
            } else if (tagName === 'a' && (attr.name === 'target' || attr.name === 'rel')) {
              // Allow target and rel for links
              continue;
            } else {
              element.removeAttribute(attr.name);
            }
          }
          walk(child);
        }
      }
    }
  };

  walk(template.content);
  return template.innerHTML;
}

/**
 * Parse markdown text to sanitized HTML
 */
export function parseMarkdown(markdown: string): string {
  const html = markdown
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers (after escaping, so we control the tags)
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Links - carefully constructed
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      // Validate URL
      const safeUrl = url.trim();
      if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://') || safeUrl.startsWith('mailto:')) {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return text;
    });

  const blocks: string[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push(`<p>${paragraphLines.join('<br>')}</p>`);
    paragraphLines.length = 0;
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      return;
    }

    const items = listItems.map((item) => `<li>${item}</li>`).join('');
    blocks.push(`<${listType}>${items}</${listType}>`);
    listType = null;
    listItems.length = 0;
  };

  for (const rawLine of html.split('\n')) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (HEADING_PATTERN.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(line);
      continue;
    }

    const orderedListItem = line.match(ORDERED_LIST_ITEM_PATTERN);
    if (orderedListItem) {
      flushParagraph();
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(orderedListItem[1]);
      continue;
    }

    const bulletListItem = line.match(BULLET_LIST_ITEM_PATTERN);
    if (bulletListItem) {
      flushParagraph();
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(bulletListItem[1]);
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return sanitizeHtml(blocks.join('\n'));
}

export default parseMarkdown;

