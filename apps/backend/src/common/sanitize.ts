// Sanitasi HTML sederhana — hapus tag script dan event handlers
// Untuk production yang lebih ketat, gunakan library seperti DOMPurify/sanitize-html

const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\s*on\w+\s*=\s*(['"])[^'"]*\1/gi;
const IFRAME_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_REGEX = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_REGEX = /<embed\b[^>]*>/gi;
const STYLE_EXPRESSION_REGEX = /expression\s*\(/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript\s*:/gi;

export function sanitizeHtml(input: string): string {
  if (!input) return input;

  let sanitized = input;

  // Hapus script tags
  sanitized = sanitized.replace(SCRIPT_REGEX, '');

  // Hapus event handlers (onclick, onerror, onload, dll)
  sanitized = sanitized.replace(EVENT_HANDLER_REGEX, '');

  // Hapus iframe, object, embed
  sanitized = sanitized.replace(IFRAME_REGEX, '');
  sanitized = sanitized.replace(OBJECT_REGEX, '');
  sanitized = sanitized.replace(EMBED_REGEX, '');

  // Hapus CSS expressions
  sanitized = sanitized.replace(STYLE_EXPRESSION_REGEX, '');

  // Hapus javascript: protocol
  sanitized = sanitized.replace(JAVASCRIPT_PROTOCOL_REGEX, '');

  return sanitized.trim();
}

// Sanitasi string biasa — escape HTML entities
export function escapeHtml(input: string): string {
  if (!input) return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
