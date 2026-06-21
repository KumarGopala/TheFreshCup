import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import RangePicker from '../components/RangePicker.jsx'
import SalesChart from '../components/SalesChart.jsx'
import SyncIndicator from '../components/SyncIndicator.jsx'
import { useBills } from '../hooks/useBills.js'
import { useMenu } from '../hooks/useMenu.js'
import { aggregate, rangeToday, formatCompactINR } from '../lib/dashboard.js'

export default function DashboardPage() {
  const [range, setRange] = useState(() => ({ ...rangeToday(), presetId: 'today' }))
  const { data: bills, loading, error } = useBills(range.from, range.to)
  const { data: menu } = useMenu()

  const staffById = useMemo(() => {
    const m = {}
    ;(menu?.staff || []).forEach(s => { m[s.id] = s.name || s.id })
    return m
  }, [menu])

  const agg = useMemo(
    () => aggregate(bills || { bills: [], items: [] }, { bucket: range.bucket }),
    [bills, range.bucket]
  )

  const showStaffBreakdown = range.presetId !== 'today' && agg.byStaff.length > 1

  return (
    <div className="min-h-screen bg-cream pb-8">
      <header className="bg-brand-600 text-white px-2 py-3 flex items-center gap-2 shadow sticky top-0 z-20">
        <Link to="/" className="text-2xl px-2 py-1">←</Link>
        <h1 className="font-bold text-lg flex-1">Dashboard</h1>
        <SyncIndicator />
      </header>

      <RangePicker value={range} onChange={setRange} />

      {loading && !bills ? (
        <CenterMsg icon="⏳" text="Loading…" />
      ) : error && !bills ? (
        <CenterMsg icon="⚠️" text={error} />
      ) : agg.count === 0 ? (
        <CenterMsg icon="📭" text="No bills in this range yet" />
      ) : (
        <main className="px-3 space-y-4">
          <SummaryCards agg={agg} />

          <Card title={range.presetId === 'today' ? 'Sales by hour' : 'Sales by day'}>
            <SalesChart series={agg.series} />
          </Card>

          <Card title="Payment split">
            <PaymentSplit agg={agg} />
          </Card>

          <Card title={`Top items (${agg.topProducts.length})`}>
            <TopProductsList products={agg.topProducts} />
          </Card>

          {showStaffBreakdown && (
            <Card title="By staff">
              <StaffList items={agg.byStaff} staffById={staffById} total={agg.totalSales} />
            </Card>
          )}

          <div className="text-center text-xs text-gray-400 pt-1 pb-4">
            {range.label} • {agg.count} bill{agg.count > 1 ? 's' : ''}
          </div>
        </main>
      )}
    </div>
  )
}

function CenterMsg({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="text-5xl mb-2">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="card p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function SummaryCards({ agg }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Sales"   value={formatCompactINR(agg.totalSales)} sub={agg.count + ' bills'} highlight />
      <Stat label="Avg ticket" value={'₹' + agg.avg}                sub={agg.count + ' bills'} />
    </div>
  )
}

function Stat({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-gray-100'}`}>
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className={`text-xs mt-1 ${highlight ? 'text-white/80' : 'text-gray-400'}`}>{sub}</div>}
    </div>
  )
}

function PaymentSplit({ agg }) {
  const total = agg.cashSales + agg.upiSales
  const cashPct = total ? Math.round((agg.cashSales / total) * 100) : 0
  const upiPct  = 100 - cashPct
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-green-50 border border-green-100 p-3">
          <div className="text-2xl">💵</div>
          <div className="text-lg font-bold text-green-700">₹{agg.cashSales.toLocaleString('en-IN')}</div>
          <div className="text-xs text-green-700/70">{agg.cashCount} bills • {cashPct}%</div>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
          <div className="text-2xl">📱</div>
          <div className="text-lg font-bold text-blue-700">₹{agg.upiSales.toLocaleString('en-IN')}</div>
          <div className="text-xs text-blue-700/70">{agg.upiCount} bills • {upiPct}%</div>
        </div>
      </div>
      {total > 0 && (
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-green-500" style={{ width: cashPct + '%' }} />
          <div className="bg-blue-500"  style={{ width: upiPct + '%' }} />
        </div>
      )}
    </div>
  )
}

function TopProductsList({ products }) {
  if (!products.length) return <div className="text-center text-sm text-gray-400 py-4">No items</div>
  const max = Math.max(...products.map(p => p.qty)) || 1
  return (
    <div className="space-y-2">
      {products.slice(0, 10).map((p, i) => (
        <div key={p.id} className="flex items-center gap-2">
          <div className="w-6 text-center text-xs font-bold text-gray-400">{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-gray-500 ml-2 shrink-0">₹{p.sales.toLocaleString('en-IN')}</div>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: ((p.qty / max) * 100) + '%' }} />
              </div>
              <div className="text-[11px] text-gray-400 w-12 text-right">{p.qty} sold</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StaffList({ items, staffById, total }) {
  if (!items.length) return null
  return (
    <div className="space-y-2">
      {items.map(s => {
        const pct = total ? Math.round((s.sales / total) * 100) : 0
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
              {(staffById[s.id] || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium truncate">{staffById[s.id] || s.id}</div>
                <div className="text-gray-500 shrink-0 ml-2">₹{s.sales.toLocaleString('en-IN')}</div>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-fresh" style={{ width: pct + '%' }} />
                </div>
                <div className="text-[11px] text-gray-400 w-12 text-right">{s.count} bills</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
