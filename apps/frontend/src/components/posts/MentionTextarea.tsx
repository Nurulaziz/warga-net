import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, TextareaHTMLAttributes } from 'react';
import { AtSymbolIcon } from '@heroicons/react/24/outline';
import { fetchMentionSuggestions } from '@/services/posts';

type MentionUser = { id: string; fullName: string };

interface MentionTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onMention: (user: MentionUser) => void;
}

function activeMention(value: string, cursor: number) {
  const prefix = value.slice(0, cursor);
  const match = prefix.match(/(?:^|\s)@([\p{L}\p{N}_ .'-]{0,40})$/u);
  if (!match) return null;
  const at = prefix.lastIndexOf('@');
  return { start: at, query: match[1].replace(/_/g, ' ').trimStart() };
}

export function MentionTextarea({ value, onChange, onMention, className = '', ...props }: MentionTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [range, setRange] = useState<{ start: number; cursor: number; query: string } | null>(null);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  function refresh(nextValue: string, cursor: number) {
    const mention = activeMention(nextValue, cursor);
    setRange(mention ? { ...mention, cursor } : null);
  }

  useEffect(() => {
    if (!range) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetchMentionSuggestions(range.query)
        .then((users) => {
          setSuggestions(users);
          setActiveIndex(0);
        })
        .catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [range?.query]);

  function select(user: MentionUser) {
    if (!range) return;
    const handle = `@${user.fullName.trim().replace(/\s+/g, '_')}`;
    const next = `${value.slice(0, range.start)}${handle} ${value.slice(range.cursor)}`;
    const cursor = range.start + handle.length + 1;
    onChange(next);
    onMention(user);
    setRange(null);
    setSuggestions([]);
    window.requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((index) => (index + step + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      select(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setRange(null);
      setSuggestions([]);
    }
  }

  return (
    <div className="relative flex-1">
      <textarea
        {...props}
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          refresh(event.target.value, event.target.selectionStart);
        }}
        onClick={(event) => refresh(value, event.currentTarget.selectionStart)}
        onKeyUp={(event) => {
          if (!['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) {
            refresh(value, event.currentTarget.selectionStart);
          }
        }}
        onKeyDown={handleKeyDown}
        className={className}
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
      />
      {suggestions.length > 0 && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-sm border-2 border-ink bg-white shadow-[4px_4px_0_#171717] dark:border-gray-500 dark:bg-gray-800">
          <p className="border-b border-ink bg-[#fff8ec] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink dark:bg-gray-700 dark:text-white">Tag akun warga</p>
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(user)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold ${index === activeIndex ? 'bg-[#f1dfc4] text-ink' : 'text-ink hover:bg-[#fff8ec] dark:text-white dark:hover:bg-gray-700'}`}
            >
              <AtSymbolIcon className="h-4 w-4 text-brand-600" /> {user.fullName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
