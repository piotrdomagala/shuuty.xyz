/**
 * Safe markdown to HTML converter
 * Converts basic markdown syntax to HTML with XSS protection
 */

// Allowed HTML tags for sanitization
const ALLOWED_TAGS = ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a'];

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
  let html = markdown
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
    })
    // Numbered list items
    .replace(/^\d+\. (.*)$/gm, '<li>$1</li>')
    // Bullet list items
    .replace(/^- (.*)$/gm, '<li>$1</li>');

  // Wrap consecutive list items in ul
  html = html.replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>|$)/g, (match) => {
    return match;
  });
  
  // Wrap orphan li tags in ul
  html = html.replace(/(?<!<ul>)(<li>)/g, '<ul>$1');
  html = html.replace(/(<\/li>)(?![\s\S]*?<li>)(?!<\/ul>)/g, '$1</ul>');
  
  // Clean up multiple ul tags
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Split into paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol')) {
        return block;
      }
      // Wrap text blocks in paragraphs
      if (!block.startsWith('<p>')) {
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      }
      return block;
    })
    .filter(Boolean)
    .join('\n');

  return sanitizeHtml(html);
}

export default parseMarkdown;

