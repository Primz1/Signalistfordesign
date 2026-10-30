"use client";
import React, { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { notify } from "@/lib/notify";
import { trackEvent } from "@/components/providers/PostHogProvider";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  variant = "filled",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [, startTransition] = useTransition();
  const generation = useRef(0);

  const label = useMemo(() => {
    if (type === "icon") return "";
    return added ? "Remove from watchlist" : "Add to watchlist";
  }, [added, type]);

  const handleClick = () => {
    const sym = symbol.toUpperCase();
    const wasAdded = added;
    const key = crypto.randomUUID();
    const id = ++generation.current;
    setAdded(!wasAdded);
    onWatchlistChange?.(sym, !wasAdded);

    const request = wasAdded
      ? removeFromWatchlist(sym, key)
      : addToWatchlist(sym, company, key);

    toast(wasAdded ? `${sym} removed from watchlist` : `${sym} added to watchlist`, {
      action: {
        label: "Undo",
        onClick: () => {
          if (generation.current !== id) return;
          generation.current += 1;
          setAdded(wasAdded);
          onWatchlistChange?.(sym, wasAdded);
          void request.then((res) => {
            if (!res.success) return;
            if (wasAdded) void addToWatchlist(sym, company, crypto.randomUUID());
            else void removeFromWatchlist(sym, crypto.randomUUID());
          });
        },
      },
    });

    startTransition(async () => {
      const res = await request;
      if (generation.current !== id) return;
      if (!res.success) {
        setAdded(wasAdded);
        onWatchlistChange?.(sym, wasAdded);
        notify.watchlistFailed(wasAdded ? "remove" : "add", res.message);
        return;
      }
      trackEvent(wasAdded ? "watchlist_removed" : "watchlist_added", { symbol: sym });
    });
  };

  if (type === "icon") {
    return (
      <button
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn hit-slop ${added ? "watchlist-icon-added" : ""}`}
        onClick={handleClick}
      >
        {(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={added ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            className="watchlist-star"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
            />
          </svg>
        )}
      </button>
    );
  }

  const outlineClass = added
    ? "press inline-flex h-11 w-auto items-center gap-2 rounded-lg border border-down bg-transparent px-4 text-sm font-semibold text-down hover:bg-down/8"
    : "press inline-flex h-11 w-auto items-center gap-2 rounded-lg border border-line-strong bg-transparent px-4 text-sm font-semibold text-ink hover:bg-surface-2";

  const textClass = "text-btn gap-2 px-0";

  const className =
    variant === "outline" ? outlineClass : variant === "text" ? textClass : `watchlist-btn ${added ? "watchlist-remove" : ""}`;

  return (
    <button className={className} onClick={handleClick}>
      {(showTrashIcon || variant === "outline" || variant === "text") && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 6h18M8 6V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5V6m-1 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6m3 5v6m4-6v6"
          />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
