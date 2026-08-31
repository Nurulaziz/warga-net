import { Fragment } from 'react';
import { Link } from 'react-router-dom';

function renderText(text: string, keyPrefix: string) {
  const parts: Array<{ type: 'text' | 'tag' | 'mention'; value: string }> = [];
  const regex = /(#[\p{L}\p{N}_]+)|(@[\p{L}\p{N} .\-']+)/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1]) {
      parts.push({ type: 'tag', value: match[1] });
    } else if (match[2]) {
      parts.push({ type: 'mention', value: match[2] });
    }
    lastIndex = match.index + match[0].length;
    i += 1;
    if (i > 500) break;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (part.type === 'tag') {
      return (
        <Link
          key={key}
          to={`/suara-warga/hashtag/${encodeURIComponent(part.value.slice(1).toLowerCase())}`}
          className="font-medium text-primary hover:underline"
        >
          {part.value}
        </Link>
      );
    }
    if (part.type === 'mention') {
      return (
        <span key={key} className="font-medium text-primary/90">
          {part.value}
        </span>
      );
    }
    return <Fragment key={key}>{part.value}</Fragment>;
  });
}

export function PostContent({
  content,
  className = '',
}: {
  content: string | null;
  className?: string;
}) {
  if (!content) return null;
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {renderText(content, 'pc')}
    </div>
  );
}
