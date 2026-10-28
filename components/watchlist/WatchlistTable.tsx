"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addToWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { notify } from "@/lib/notify";
import clsx from "clsx";
import { BellPlus, Star } from "lucide-react";
import Link from "next/link";
import { EmptyState as SignalistEmptyState } from "@/components/ui/empty-state";
import { formatMarketCapValue } from "@/lib/utils";

type WatchlistEntry = {
	_id?: string;
	symbol: string;
	company: string;
	addedAt?: string | Date;
	price?: number;
	changePercent?: number;
	marketCap?: number;
	volume?: number;
	isCrypto?: boolean;
	dayHigh?: number;
	dayLow?: number;
	aiScore?: number;
};

type WatchlistTableProps = {
	items: WatchlistEntry[];
	onAddAlert?: (entry: WatchlistEntry) => void;
};

const EmptyState = () => (
	<SignalistEmptyState
		title="No symbols yet"
		description="Search for a ticker above and add it. Price, daily move and AI score appear here, and you can set an alert from each row."
	/>
);

const formatNumber = (value?: number, opts: Intl.NumberFormatOptions = {}) => {
	if (value === undefined || value === null || Number.isNaN(value)) return '—';
	return new Intl.NumberFormat(undefined, opts).format(value);
};

const formatCurrency = (value?: number) => formatNumber(value, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const formatPrice = (value?: number) => {
	if (value === undefined || value === null || Number.isNaN(value)) return '—';
	return formatCurrency(value);
};

const WatchlistTable = ({ items, onAddAlert }: WatchlistTableProps) => {
	const [rows, setRows] = useState<WatchlistEntry[]>(items);
	const [, startTransition] = useTransition();
	const generation = useRef(0);

	useEffect(() => {
		setRows(items);
	}, [items]);

	const handleRemove = (symbol: string, company: string) => {
		const snapshot = rows;
		const key = crypto.randomUUID();
		const id = ++generation.current;
		setRows((prev) => prev.filter((row) => row.symbol !== symbol));
		const request = removeFromWatchlist(symbol, key);
		toast(`${symbol} removed from watchlist`, {
			action: {
				label: "Undo",
				onClick: () => {
					if (generation.current !== id) return;
					generation.current += 1;
					setRows(snapshot);
					void request.then((res) => {
						if (res.success) void addToWatchlist(symbol, company, crypto.randomUUID());
					});
				},
			},
		});
		startTransition(async () => {
			const res = await request;
			if (generation.current !== id) return;
			if (!res.success) {
				setRows(snapshot);
				notify.watchlistFailed("remove", res.message);
			}
		});
	};

	const content = useMemo(() => {
		if (!rows.length) return <EmptyState />;

		return (
			<div className="surface-card">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow className="border-b border-line hover:bg-transparent">
							<TableHead className="w-12"><span className="sr-only">Remove</span></TableHead>
							<TableHead>Symbol</TableHead>
							<TableHead className="text-right">Price</TableHead>
							<TableHead className="text-right">Today</TableHead>
							<TableHead className="hidden text-right lg:table-cell">Market cap</TableHead>
							<TableHead className="hidden text-right md:table-cell">Day range</TableHead>
							<TableHead className="hidden text-right sm:table-cell">AI score</TableHead>
							<TableHead className="hidden w-28 text-right sm:table-cell"><span className="sr-only">Alert</span></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => {
							const ch = row.changePercent;
							return (
								<TableRow key={row.symbol} className="group h-12 hover:bg-surface-2">
									<TableCell className="w-12 py-0 pr-0 pl-1">
										<button
											onClick={() => handleRemove(row.symbol, row.company)}
											aria-label={`Remove ${row.symbol} from watchlist`}
											className="press hit-slop inline-flex size-11 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
											title="Remove from watchlist"
										>
											<Star className="size-4 fill-current" />
										</button>
									</TableCell>
									<TableCell className="max-w-0 py-0">
										<Link href={`/stocks/${row.symbol}`} className="block min-w-0">
											<span className="num block text-sm font-semibold text-ink">{row.symbol}</span>
											<span className="block truncate text-xs text-ink-3" title={row.company}>{row.company}</span>
										</Link>
									</TableCell>
									<TableCell className="num py-0 text-right text-sm text-ink">{formatCurrency(row.price)}</TableCell>
									<TableCell
										className={clsx(
											'num py-0 text-right text-sm',
											typeof ch === 'number' ? (ch >= 0 ? 'text-up' : 'text-down') : 'text-ink-3'
										)}
									>
										{typeof ch === 'number' ? `${ch >= 0 ? '+' : '−'}${Math.abs(ch).toFixed(2)}%` : '—'}
									</TableCell>
									<TableCell className="num hidden py-0 text-right text-sm text-ink lg:table-cell">
										{row.marketCap != null ? formatMarketCapValue(row.marketCap * 1_000_000) : '—'}
									</TableCell>
									<TableCell className="num hidden py-0 text-right text-sm text-ink-2 md:table-cell">
										{row.dayLow != null && row.dayHigh != null
											? `${formatPrice(row.dayLow)} – ${formatPrice(row.dayHigh)}`
											: '—'}
									</TableCell>
									<TableCell className="num hidden py-0 text-right text-sm sm:table-cell">
										{row.aiScore != null ? (
											<span className={row.aiScore >= 65 ? 'text-up' : row.aiScore >= 45 ? 'text-ink' : 'text-down'}>
												{Math.round(row.aiScore)}
											</span>
										) : (
											<span className="text-ink-3">—</span>
										)}
									</TableCell>
									<TableCell className="hidden py-0 pr-2 text-right sm:table-cell">
										<Button variant="outline" size="sm" aria-label={`New alert for ${row.symbol}`} className="px-3" onClick={() => onAddAlert?.(row)}>
											<BellPlus className="size-3.5" />
											<span className="hidden sm:inline">Alert</span>
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		);
	}, [rows]);

	return content;
};

export default WatchlistTable;
