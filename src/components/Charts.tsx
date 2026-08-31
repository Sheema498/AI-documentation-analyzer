interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  unit?: string;
}

export function BarChart({ data, height = 200, showValues = true, unit = '' }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / max) * (height - 40), 2);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            {showValues && (
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                {item.value}{unit}
              </span>
            )}
            <div
              className="w-full rounded-t-md transition-all duration-700 ease-out animate-draw-bar"
              style={{
                height: barHeight,
                background: item.color || 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
                animationDelay: `${i * 60}ms`,
              }}
            />
            <span className="text-[10px] text-slate-500 text-center leading-tight">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface HorizontalBarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  unit?: string;
}

export function HorizontalBar({ label, value, max, color, unit = '' }: HorizontalBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-24 truncate text-right">{label}</span>
      <div className="flex-1 h-6 bg-slate-800/60 rounded-md overflow-hidden">
        <div
          className="h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-2"
          style={{
            width: `${pct}%`,
            background: color || 'linear-gradient(90deg, #3b82f6, #06b6d4)',
          }}
        >
          <span className="text-[10px] text-white font-mono font-semibold tabular-nums">
            {value}{unit}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 20,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={thickness}
        />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circumference - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && (
            <span className="text-2xl font-bold font-mono tabular-nums">{centerValue}</span>
          )}
          {centerLabel && (
            <span className="text-xs text-slate-400 mt-0.5">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  color?: string;
}

export function Gauge({ value, min = 0, max = 100, label, color }: GaugeProps) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = pct * 180 - 90;
  const arcColor = color || (pct > 0.66 ? '#10b981' : pct > 0.33 ? '#f59e0b' : '#ef4444');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-20 overflow-hidden">
        <svg width="128" height="80" viewBox="0 0 128 80">
          <path
            d="M 8 72 A 56 56 0 0 1 120 72"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 8 72 A 56 56 0 0 1 120 72"
            fill="none"
            stroke={arcColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${pct * 176} 176`}
            className="transition-all duration-1000 ease-out"
          />
          <line
            x1="64"
            y1="72"
            x2={64 + 48 * Math.cos((angle - 90) * Math.PI / 180)}
            y2={72 + 48 * Math.sin((angle - 90) * Math.PI / 180)}
            stroke="#e2e8f0"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <circle cx="64" cy="72" r="4" fill="#e2e8f0" />
        </svg>
      </div>
      <span className="text-xl font-bold font-mono tabular-nums -mt-2">{value.toFixed(1)}</span>
      {label && <span className="text-xs text-slate-400 mt-0.5">{label}</span>}
    </div>
  );
}

interface WordCloudProps {
  words: { word: string; count: number }[];
  maxItems?: number;
}

export function WordCloud({ words, maxItems = 30 }: WordCloudProps) {
  const items = words.slice(0, maxItems);
  const maxCount = Math.max(...items.map((w) => w.count), 1);
  const minCount = Math.min(...items.map((w) => w.count), 1);

  const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
  const colors = [
    'text-slate-500', 'text-slate-400', 'text-blue-400', 'text-blue-300',
    'text-cyan-400', 'text-cyan-300', 'text-blue-200',
  ];

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      {items.map((item, i) => {
        const ratio = (item.count - minCount) / Math.max(maxCount - minCount, 1);
        const sizeIdx = Math.floor(ratio * (sizes.length - 1));
        const colorIdx = Math.floor(ratio * (colors.length - 1));
        return (
          <span
            key={i}
            className={`${sizes[sizeIdx]} ${colors[colorIdx]} font-medium transition-all duration-300 hover:scale-110 cursor-default animate-fade-in`}
            style={{ animationDelay: `${i * 20}ms`, opacity: 0 }}
            title={`${item.word}: ${item.count} occurrences`}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
}
