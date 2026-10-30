type SparklineProps = {
  /** Unique id for this sparkline's gradient def — pass something stable like a row key. */
  id: string;
  values: number[];
  width?: number;
  height?: number;
  color: string;
  className?: string;
  strokeWidth?: number;
  showDot?: boolean;
  /** Render the gradient area fill beneath the line. Defaults to on. */
  fill?: boolean;
};

/**
 * Deterministic inline SVG gradient area sparkline. Pure function of `values`
 * so it renders identically on server and client — no hooks, safe to use
 * inside server components.
 */
export function Sparkline({
  id,
  values,
  width = 120,
  height = 36,
  color,
  className,
  strokeWidth = 1.75,
  showDot = true,
  fill = true,
}: SparklineProps) {
  if (!values.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1 || 1);
  const points = values.map((v, i) => [i * stepX, height - ((v - min) / range) * height] as const);
  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const gradientId = `spark-grad-${id}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.45} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && (
        <circle cx={lastX} cy={lastY} r={2.75} fill={color}>
          <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}
