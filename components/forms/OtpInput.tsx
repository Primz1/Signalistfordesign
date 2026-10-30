'use client';

import { useRef } from 'react';

const LENGTH = 6;

/**
 * One-time-code slots. The first field advertises `autocomplete="one-time-code"`
 * so mobile keyboards can offer the SMS/mail code, and a paste fills every slot.
 */
export default function OtpInput({
  onComplete,
}: {
  onComplete?: (code: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const write = (digits: string, start: number) => {
    const chars = digits.replace(/\D/g, '').slice(0, LENGTH - start).split('');
    chars.forEach((char, index) => {
      const input = refs.current[start + index];
      if (input) input.value = char;
    });
    const next = Math.min(LENGTH - 1, start + chars.length);
    refs.current[next]?.focus();
    const code = refs.current.map((input) => input?.value ?? '').join('');
    if (code.length === LENGTH && refs.current.every((input) => input?.value)) {
      onComplete?.(code);
    }
  };

  return (
    <div className="flex gap-2" onPaste={(event) => {
      const text = event.clipboardData.getData('text');
      if (!/\d/.test(text)) return;
      event.preventDefault();
      write(text, 0);
    }}>
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={index === 0 ? LENGTH : 1}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          className="num h-11 w-11 rounded-lg border border-transparent bg-surface text-center text-base text-ink focus-visible:border-line-strong focus-visible:outline-none"
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, '');
            if (value.length > 1) {
              write(value, index);
              return;
            }
            event.target.value = value;
            if (value && index < LENGTH - 1) refs.current[index + 1]?.focus();
            const code = refs.current.map((input) => input?.value ?? '').join('');
            if (code.length === LENGTH) onComplete?.(code);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !event.currentTarget.value && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}
