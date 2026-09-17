import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import cn from '@/utils/cn';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '@/utils/format';
import { ORDER_STATUS } from '@/constants';
import useTheme from '@/hooks/useTheme';
import { EmptyState } from '@/components/ui/States';

/**
 * Chart tokens.
 *
 * `SERIES` is the single hue used wherever one measure is plotted — one series
 * needs no legend, the title names it. `STATUS_COLORS` maps each order status to
 * a fixed colour that matches its badge everywhere else in the console, so colour
 * follows the entity rather than its rank in the data.
 *
 * This set was checked with the palette validator against the white card surface:
 * every hue clears the lightness, chroma, CVD-separation and normal-vision gates.
 * Amber sits below 3:1 contrast, so every chart that uses it also carries direct
 * value labels — never colour alone.
 */
const SERIES = '#7c3aed';
const SERIES_SOFT = '#ddd6fe';

export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#f59e0b',
  [ORDER_STATUS.CONFIRMED]: '#7c3aed',
  [ORDER_STATUS.SHIPPED]: '#0284c7',
  [ORDER_STATUS.DELIVERED]: '#059669',
  [ORDER_STATUS.CANCELLED]: '#dc2626',
};

/*
 * Recharts paints with literal colours, not CSS classes, so the few tokens
 * that must differ per theme are resolved here. Dark surfaces get lighter
 * hues for the same reason the text palette does: contrast.
 */
const THEMES = {
  light: {
    series: SERIES,
    grid: '#e2e8f0',
    axis: '#94a3b8',
    cursorFill: 'rgba(15,23,42,0.04)',
    status: STATUS_COLORS,
    stock: { healthy: '#059669', low: '#f59e0b', out: '#dc2626' },
  },
  dark: {
    series: '#a78bfa',
    grid: '#2d3552',
    axis: '#8f9ab8',
    cursorFill: 'rgba(255,255,255,0.05)',
    status: {
      [ORDER_STATUS.PENDING]: '#fbbf24',
      [ORDER_STATUS.CONFIRMED]: '#a78bfa',
      [ORDER_STATUS.SHIPPED]: '#38bdf8',
      [ORDER_STATUS.DELIVERED]: '#34d399',
      [ORDER_STATUS.CANCELLED]: '#f87171',
    },
    stock: { healthy: '#34d399', low: '#fbbf24', out: '#f87171' },
  },
};

/** Chart colours for the active theme. */
export const useChartTheme = () => {
  const { isDark } = useTheme();
  return isDark ? THEMES.dark : THEMES.light;
};

// Recessive axes: no tick marks, no axis rule, muted ink.
const axisProps = (t) => ({
  tick: { fill: t.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
});

/*
 * Every mark below sets isAnimationActive={false}. These charts re-render
 * whenever a filter or date range changes, and replaying the entry animation on
 * each resize makes the dashboard feel unsettled — it also leaves marks stuck at
 * zero in any screenshot or print capture taken mid-animation.
 */

/** Shared tooltip shell — hover is on by default for every chart here. */
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink-200/80 bg-surface/95 px-3.5 py-2.5 shadow-popover backdrop-blur animate-fade-in">
      <p className="text-xs font-semibold text-ink-900">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.dataKey} className="flex items-center gap-2 text-xs text-ink-600">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: entry.color ?? entry.payload?.fill ?? SERIES }}
            />
            <span className="capitalize">{entry.name}:</span>
            <span className="font-semibold text-ink-900">
              {formatter ? formatter(entry.value, entry.dataKey) : formatNumber(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Card wrapper giving every chart the same title / subtitle / body rhythm. */
export const ChartCard = ({ title, subtitle, action, children, className, isEmpty, emptyMessage }) => (
  <section className={cn('card p-5 sm:p-6', className)}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>

    <div className="mt-5">
      {isEmpty ? (
        <EmptyState
          compact
          className="border-0 bg-transparent"
          title="No data yet"
          description={emptyMessage ?? 'This chart fills in as soon as there is activity.'}
        />
      ) : (
        children
      )}
    </div>
  </section>
);

/** Revenue over time — one measure, so one hue and no legend. */
export const RevenueAreaChart = ({ data = [], height = 280 }) => {
  const t = useChartTheme();
  return (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.series} stopOpacity={0.22} />
          <stop offset="100%" stopColor={t.series} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" {...axisProps(t)} interval="preserveStartEnd" minTickGap={24} />
      <YAxis {...axisProps(t)} width={64} tickFormatter={(value) => formatCurrencyCompact(value)} />
      <Tooltip
        cursor={{ stroke: t.series, strokeWidth: 1, strokeDasharray: '4 4' }}
        content={<ChartTooltip formatter={(value, key) => (key === 'orders' ? formatNumber(value) : formatCurrency(value))} />}
      />
      <Area
        type="monotone"
        dataKey="revenue"
        name="Revenue"
        stroke={t.series}
        strokeWidth={2}
        fill="url(#revenueFill)"
        dot={false}
        activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
        isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
  );
};

/**
 * Orders by status — horizontal bars so long status names stay readable.
 * Values are labelled directly, which is also the required relief for the
 * low-contrast amber.
 */
export const OrderStatusChart = ({ data = [], height = 260 }) => {
  const t = useChartTheme();
  return (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }} barCategoryGap={10}>
      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" {...axisProps(t)} allowDecimals={false} />
      <YAxis type="category" dataKey="status" {...axisProps(t)} width={84} />
      <Tooltip cursor={{ fill: t.cursorFill }} content={<ChartTooltip />} />
      <Bar dataKey="count" name="Orders" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false}>
        {data.map((entry) => (
          <Cell key={entry.status} fill={t.status[entry.status] ?? t.series} />
        ))}
        <LabelList
          dataKey="count"
          position="right"
          offset={8}
          className="fill-ink-700"
          style={{ fontSize: 12, fontWeight: 600 }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  );
};

/** Revenue by category — one measure across categories, so one hue. */
export const CategoryRevenueChart = ({ data = [], height = 280 }) => {
  const t = useChartTheme();
  return (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 0, left: 8 }} barCategoryGap={10}>
      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" {...axisProps(t)} tickFormatter={(value) => formatCurrencyCompact(value)} />
      <YAxis type="category" dataKey="category" {...axisProps(t)} width={110} />
      <Tooltip
        cursor={{ fill: t.cursorFill }}
        content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
      />
      <Bar dataKey="revenue" name="Revenue" fill={t.series} radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
        <LabelList
          dataKey="revenue"
          position="right"
          offset={8}
          className="fill-ink-700"
          style={{ fontSize: 12, fontWeight: 600 }}
          formatter={(value) => formatCurrencyCompact(value)}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  );
};

/** New customers per month — single measure over time. */
export const UserGrowthChart = ({ data = [], height = 260 }) => {
  const t = useChartTheme();
  return (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barCategoryGap={14}>
      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" {...axisProps(t)} />
      <YAxis {...axisProps(t)} width={40} allowDecimals={false} />
      <Tooltip cursor={{ fill: t.cursorFill }} content={<ChartTooltip />} />
      <Bar dataKey="newUsers" name="New customers" fill={t.series} radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false}>
        <LabelList
          dataKey="newUsers"
          position="top"
          offset={6}
          className="fill-ink-600"
          style={{ fontSize: 11, fontWeight: 600 }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  );
};

/** Units sold for the best sellers — single measure, ranked. */
export const TopProductsChart = ({ data = [], height = 300 }) => {
  const t = useChartTheme();
  return (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }} barCategoryGap={8}>
      <CartesianGrid stroke={t.grid} strokeDasharray="3 3" horizontal={false} />
      <XAxis type="number" {...axisProps(t)} allowDecimals={false} />
      <YAxis type="category" dataKey="label" {...axisProps(t)} width={150} />
      <Tooltip cursor={{ fill: t.cursorFill }} content={<ChartTooltip />} />
      <Bar dataKey="unitsSold" name="Units sold" fill={t.series} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
        <LabelList
          dataKey="unitsSold"
          position="right"
          offset={8}
          className="fill-ink-700"
          style={{ fontSize: 12, fontWeight: 600 }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  );
};

/**
 * Stock health as a labelled proportion bar. A legend plus a value on every
 * segment keeps identity off colour alone.
 */
export const InventoryBreakdown = ({ inStock = 0, lowStock = 0, outOfStock = 0 }) => {
  const total = inStock + lowStock + outOfStock;
  const t = useChartTheme();

  const segments = [
    { label: 'Healthy stock', value: inStock, color: t.stock.healthy },
    { label: 'Low stock', value: lowStock, color: t.stock.low },
    { label: 'Out of stock', value: outOfStock, color: t.stock.out },
  ];

  if (!total) {
    return <p className="py-6 text-center text-sm text-ink-400">No products in the catalogue yet.</p>;
  }

  return (
    <div>
      {/* 2px surface gaps keep adjacent fills from touching. */}
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <div
              key={segment.label}
              style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${segment.label}: ${segment.value}`}
            />
          ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: segment.color }} />
            <span className="flex-1 text-ink-600">{segment.label}</span>
            <span className="font-semibold text-ink-900">{formatNumber(segment.value)}</span>
            <span className="w-12 text-right text-xs text-ink-400">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { SERIES as CHART_SERIES_COLOR, SERIES_SOFT as CHART_SERIES_SOFT };
