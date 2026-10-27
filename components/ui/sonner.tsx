'use client';

/**
 * P1 Toast Notification (Ark-UI demo) adapted to Sonner + Signalist dark surfaces.
 * Typed toasts: success / error / warning / info, toned border + icon.
 */
import {
  CircleCheck,
  Info,
  Loader2,
  OctagonX,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      className="toaster group"
      position="bottom-right"
      gap={16}
      expand={false}
      visibleToasts={4}
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            'group toast !flex !items-start !gap-3 !w-[min(22rem,calc(100vw-2rem))] !min-w-0 !rounded-lg !border !border-line-strong !bg-surface !p-4 !text-ink !shadow-none',
          title: '!text-sm !font-semibold !text-ink',
          description: '!mt-1 !text-xs !text-ink-2 !opacity-100',
          actionButton:
            '!bg-signal !text-signal-ink !text-xs !font-semibold',
          cancelButton: '!bg-surface-2 !text-ink-2 !text-xs',
          closeButton:
            '!border-line-strong !bg-surface-2 !text-ink-3 hover:!bg-line hover:!text-ink',
          success: '!border-up/40',
          error: '!border-down/50',
          warning: '!border-signal/40',
        },
      }}
      icons={{
        success: <CircleCheck className="mt-0.5 size-4 shrink-0 text-up" strokeWidth={2} />,
        error: <OctagonX className="mt-0.5 size-4 shrink-0 text-down" strokeWidth={2} />,
        warning: <TriangleAlert className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2} />,
        info: <Info className="mt-0.5 size-4 shrink-0 text-signal" strokeWidth={2} />,
        loading: <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-signal" strokeWidth={2} />,
        close: <X className="size-3" strokeWidth={2} />,
      }}
      style={
        {
          '--normal-bg': 'var(--sg-surface)',
          '--normal-text': 'var(--sg-ink)',
          '--normal-border': 'var(--sg-line-strong)',
          '--success-bg': 'var(--sg-surface)',
          '--error-bg': 'var(--sg-surface)',
          '--border-radius': '8px',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
