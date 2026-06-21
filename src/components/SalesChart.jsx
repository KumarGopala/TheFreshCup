import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatCompactINR } from '../lib/dashboard.js'

export default function SalesChart({ series, height = 220 }) {
  if (!series?.length) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
        No sales in this range
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 16, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompactINR}
            width={50}
          />
          <Tooltip
            cursor={{ fill: '#FEF3E2' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
            formatter={(value, name) => name === 'sales'
              ? ['₹' + Number(value).toLocaleString('en-IN'), 'Sales']
              : [value, name]}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="sales" fill="#C05621" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
