import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { categories, currency } from '../lib/finance';
import type { Category } from '../lib/finance';
type Props = {
  chartData: { month: string; income: number; expense: number }[];
  range: number;
  setRange: (range: number) => void;
  spending: { category: Category; name: string; value: number }[];
  stats: { expense: number };
};
export default function DashboardCharts({ chartData, range, setRange, spending, stats }: Props) {
  return (
    <div className="charts-grid">
      <section className="panel cashflow">
        <div className="panel-heading">
          <div>
            <h2>กระแสเงินสด</h2>
            <p>มองเห็นรายรับและรายจ่ายในแต่ละเดือน</p>
          </div>
          <select
            aria-label="ช่วงเวลากราฟ"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            <option value={6}>6 เดือนล่าสุด</option>
            <option value={3}>3 เดือนล่าสุด</option>
            <option value={12}>12 เดือนล่าสุด</option>
          </select>
        </div>
        <div className="chart-legend">
          <span>
            <i style={{ background: '#168266' }} />
            รายรับ
          </span>
          <span>
            <i style={{ background: '#9291cf' }} />
            รายจ่าย
          </span>
          <span className="chart-unit">หน่วย: บาท</span>
        </div>
        <div className="area-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#249c7c" stopOpacity={0.17} />
                  <stop offset="100%" stopColor="#249c7c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9391cf" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#9391cf" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted)' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--muted)' }}
                tickFormatter={(n) => `${n / 1000}k`}
              />
              <Tooltip
                formatter={(v, n) => [currency(Number(v)), n === 'income' ? 'รายรับ' : 'รายจ่าย']}
                contentStyle={{
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  background: 'var(--panel)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#18876a"
                fill="url(#incomeFill)"
                strokeWidth={2.5}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#9391cf"
                fill="url(#expenseFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel spending">
        <div className="panel-heading">
          <div>
            <h2>สัดส่วนรายจ่าย</h2>
            <p>เงินของคุณไปอยู่ที่ไหนบ้าง?</p>
          </div>
          <span className="mini-dots">•••</span>
        </div>
        <div className="donut-container">
          {spending.length ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spending}
                    innerRadius={65}
                    outerRadius={84}
                    paddingAngle={4}
                    cornerRadius={4}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {spending.map((s) => (
                      <Cell key={s.category} fill={categories[s.category].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => currency(Number(v))}
                    contentStyle={{
                      borderRadius: 12,
                      background: 'var(--panel)',
                      border: '1px solid var(--line)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span>รายจ่ายทั้งหมด</span>
                <strong>{currency(stats.expense)}</strong>
                <small>{spending.length} หมวดหมู่</small>
              </div>
            </>
          ) : (
            <div className="empty">ยังไม่มีรายจ่ายในเดือนนี้</div>
          )}
        </div>
        <div className="spending-legend">
          {spending.slice(0, 4).map((s) => (
            <div key={s.category}>
              <span>
                <i style={{ background: categories[s.category].color }} />
                {s.name}
              </span>
              <strong>
                {((s.value / stats.expense) * 100).toFixed(0)}
                <small>%</small>
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
