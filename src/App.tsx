import BudgetForm, { BudgetProgress } from './components/Budget';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Wallet,
  Plus,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Sun,
  Moon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  SlidersHorizontal,
  Check,
  PiggyBank,
  CircleHelp,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import DashboardCharts from './components/DashboardCharts';
import {
  categories,
  currency,
  expenseCategories,
  filterTransactions,
  monthKey,
  monthsEnding,
  parseData,
  sampleData,
  toCSV,
  totals,
} from './lib/finance';
import type { Data, Transaction } from './lib/finance';
import { CategoryIcon, Modal, TransactionTable } from './components/Shared';
import TransactionForm from './components/TransactionForm';
const STORAGE = 'moneyflow:v1';
const navItems = [
  { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'transactions', label: 'รายการธุรกรรม', icon: ArrowLeftRight },
  { id: 'budgets', label: 'งบประมาณ', icon: Wallet },
  { id: 'reports', label: 'รายงานและสถิติ', icon: ChartNoAxesCombined },
];
function load(): { data: Data; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE);
    return { data: raw ? parseData(raw) : sampleData(), error: '' };
  } catch {
    return {
      data: { version: 1, transactions: [], budgets: {} },
      error:
        'ไม่สามารถอ่านข้อมูลเดิมได้ ข้อมูลเดิมยังไม่ถูกเขียนทับ กรุณาตรวจสอบพื้นที่จัดเก็บหรือกู้คืนจากข้อมูลสำรอง',
    };
  }
}
function App() {
  const [initial] = useState(load);
  const [data, setData] = useState(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [page, setPage] = useState('dashboard');
  const [month, setMonth] = useState(monthKey());
  const [range, setRange] = useState(6);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [limit, setLimit] = useState(20);
  const [editing, setEditing] = useState<Transaction | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<Transaction>();
  const [budgetModal, setBudgetModal] = useState(false);
  const [help, setHelp] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState('');
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem('moneyflow:theme') === 'dark';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('moneyflow:theme', dark ? 'dark' : 'light');
    } catch {
      /* Data storage errors are reported on save. */
    }
  }, [dark]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  const persist = (next: Data) => {
    if (initial.error) {
      setStorageError(initial.error);
      return false;
    }
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setData(next);
      setStorageError('');
      return true;
    } catch {
      setStorageError(
        'บันทึกไม่สำเร็จ พื้นที่จัดเก็บอาจเต็ม หรือเบราว์เซอร์ปิดกั้น LocalStorage กรุณาส่งออกข้อมูลสำรอง',
      );
      return false;
    }
  };
  useEffect(() => {
    if (!initial.error) {
      try {
        if (!localStorage.getItem(STORAGE))
          localStorage.setItem(STORAGE, JSON.stringify(initial.data));
      } catch {
        setStorageError('ไม่สามารถบันทึกข้อมูลได้ กรุณาอนุญาต LocalStorage ในเบราว์เซอร์');
      }
    }
  }, [initial]);
  const current = useMemo(
    () => filterTransactions(data.transactions, month),
    [data.transactions, month],
  );
  const stats = totals(current);
  const previousMonth = monthsEnding(month, 2)[0];
  const previous = totals(filterTransactions(data.transactions, previousMonth));
  const chartData = monthsEnding(month, range).map((m) => ({
    month: new Date(m + '-01T12:00:00').toLocaleDateString('th-TH', { month: 'short' }),
    ...totals(filterTransactions(data.transactions, m)),
  }));
  const spending = expenseCategories
    .map((c) => ({
      category: c,
      name: categories[c].label,
      value: current
        .filter((t) => t.type === 'expense' && t.category === c)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);
  const filtered = filterTransactions(data.transactions, month, query, type, category);
  const monthLabel = new Date(month + '-01T12:00:00').toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  });
  const limits = data.budgets[month] ?? {};
  const totalBudget = Object.values(limits).reduce((s, n) => s + (n ?? 0), 0);
  const exportCSV = () => {
    const list = page === 'transactions' ? filtered : current;
    if (!list.length) {
      setToast('ไม่มีรายการสำหรับส่งออก');
      return;
    }
    const url = URL.createObjectURL(new Blob([toCSV(list)], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoneyFlow-${month}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast('ส่งออก CSV เรียบร้อยแล้ว');
  };
  const changePage = (p: string) => {
    setPage(p);
    setMobile(false);
  };
  const trend = (value: number, old: number) =>
    old ? `${Math.abs(((value - old) / old) * 100).toFixed(1)}%` : '—';
  return (
    <div className="app-shell">
      {mobile && <div className="sidebar-scrim" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            changePage('dashboard');
          }}
        >
          <span className="brand-mark">
            <ChartNoAxesCombined size={23} />
          </span>
          Money<span>Flow</span>
          <i />
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="ปิดเมนู"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <div className="workspace-switch">
          <span className="workspace-avatar">P</span>
          <div>
            <strong>พื้นที่ส่วนตัว</strong>
            <small>Personal workspace</small>
          </div>
          <ShieldCheck size={16} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {navItems.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? 'selected' : ''}
              onClick={() => changePage(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <span className="tip-icon">
              <Sparkles size={19} />
            </span>
            <strong>ก้าวเล็ก ๆ สู่เป้าหมายใหญ่</strong>
            <p>
              วางแผนการใช้จ่ายวันนี้
              <br />
              เพื่ออิสรภาพทางการเงินในวันหน้า
            </p>
            <button onClick={() => changePage('budgets')}>
              เริ่มวางแผนงบประมาณ <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} /> ศูนย์ช่วยเหลือ
          </button>
          <div className="profile">
            <span className="profile-avatar">MF</span>
            <div>
              <strong>บัญชีส่วนตัว</strong>
              <small>การเงินในแบบของคุณ</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="เปิดเมนู"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>พื้นที่ส่วนตัว</span>
            <ChevronRight size={14} />
            <strong>{navItems.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="topbar-right">
            <span className="local-badge">
              <span />
              บันทึกบนอุปกรณ์ของคุณ
            </span>
            <span className="divider" />
            <button
              className="icon-button"
              aria-label={dark ? 'เปิด Light Mode' : 'เปิด Dark Mode'}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <span className="small-avatar">MF</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> YOUR MONEY, YOUR FLOW
              </div>
              <h1>
                {page === 'dashboard'
                  ? 'ภาพรวมการเงิน'
                  : page === 'transactions'
                    ? 'รายการธุรกรรม'
                    : page === 'budgets'
                      ? 'งบประมาณรายเดือน'
                      : 'รายงานและสถิติ'}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {page === 'dashboard'
                  ? 'ทุกความเคลื่อนไหวทางการเงิน ในมุมมองที่เข้าใจง่าย'
                  : page === 'transactions'
                    ? 'ติดตามและจัดการทุกการเคลื่อนไหวของเงินคุณ'
                    : page === 'budgets'
                      ? 'ใช้จ่ายอย่างมีแผน เพื่อเป้าหมายที่เป็นจริง'
                      : 'เปลี่ยนตัวเลขเป็นความเข้าใจ เพื่อการตัดสินใจที่ดีขึ้น'}
              </p>
            </div>
            <div className="heading-actions">
              <button className="button secondary" onClick={exportCSV}>
                <Download size={16} />
                ส่งออกข้อมูล
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setEditing(undefined);
                  setShowForm(true);
                }}
              >
                <Plus size={18} />
                เพิ่มรายการ
              </button>
            </div>
          </div>
          {storageError && (
            <div className="error-banner" role="alert">
              <TriangleAlert size={20} />
              <span>{storageError}</span>
            </div>
          )}
          <div className="period-bar">
            <div className="period-title">
              <span className="live-dot" />
              <strong>
                {page === 'budgets' ? 'วางแผนให้ทุกบาทมีความหมาย' : 'สุขภาพการเงินของคุณ'}
              </strong>
              <span className="period-subtitle">อัปเดตจากรายการที่บันทึก</span>
            </div>
            <div className="month-selector">
              <button aria-label="เดือนก่อนหน้า" onClick={() => setMonth(previousMonth)}>
                <ChevronLeft size={16} />
              </button>
              <label>
                <span>{monthLabel}</span>
                <input
                  aria-label="เลือกเดือน"
                  type="month"
                  min="2000-01"
                  max="2099-12"
                  value={month}
                  onChange={(e) => {
                    if (e.target.value) setMonth(e.target.value);
                  }}
                />
                <ChevronDown size={14} />
              </label>
              <button
                aria-label="เดือนถัดไป"
                onClick={() => {
                  const [y, m] = month.split('-').map(Number);
                  setMonth(monthKey(new Date(y, m, 1)));
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {(page === 'dashboard' || page === 'reports') && (
            <>
              <div className="stats-grid">
                {[
                  {
                    label: 'รายรับทั้งหมด',
                    value: stats.income,
                    old: previous.income,
                    icon: ArrowDownRight,
                    cls: 'income',
                    sub: 'เทียบกับเดือนก่อน',
                  },
                  {
                    label: 'รายจ่ายทั้งหมด',
                    value: stats.expense,
                    old: previous.expense,
                    icon: ArrowUpRight,
                    cls: 'expense',
                    sub: 'เทียบกับเดือนก่อน',
                  },
                  {
                    label: 'ยอดคงเหลือสุทธิ',
                    value: stats.balance,
                    old: previous.balance,
                    icon: Wallet,
                    cls: 'balance',
                    sub: 'รายรับ − รายจ่าย',
                  },
                  {
                    label: 'อัตราการออม',
                    value: stats.savings,
                    old: previous.savings,
                    icon: PiggyBank,
                    cls: 'savings',
                    sub: stats.savings >= 20 ? 'สูงกว่าเป้าหมายแนะนำ 20%' : 'เป้าหมายแนะนำ 20%',
                  },
                ].map((s) => (
                  <section className={`stat-card ${s.cls}`} key={s.cls}>
                    <div className="stat-top">
                      <span>{s.label}</span>
                      <span className="stat-icon">
                        <s.icon size={18} />
                      </span>
                    </div>
                    <div className="stat-value">
                      {s.cls === 'savings' ? (
                        <>
                          {s.value.toFixed(1)}
                          <span>%</span>
                        </>
                      ) : (
                        currency(s.value)
                      )}
                    </div>
                    <div className="stat-bottom">
                      {['income', 'expense'].includes(s.cls) ? (
                        <>
                          <span className={`trend ${s.value >= s.old ? 'up' : 'down'}`}>
                            {s.value >= s.old ? (
                              <ArrowUpRight size={12} />
                            ) : (
                              <ArrowDownRight size={12} />
                            )}{' '}
                            {trend(s.value, s.old)}
                          </span>
                          <span>{s.sub}</span>
                        </>
                      ) : (
                        <>
                          <span className="tiny-dot" />
                          {s.sub}
                        </>
                      )}
                    </div>
                  </section>
                ))}
              </div>
              <DashboardCharts
                chartData={chartData}
                range={range}
                setRange={setRange}
                spending={spending}
                stats={stats}
              />
            </>
          )}
          {page === 'dashboard' && (
            <div className="lower-grid">
              <section className="panel recent">
                <div className="panel-heading">
                  <div>
                    <h2>
                      รายการล่าสุด <span className="count-badge">{current.length}</span>
                    </h2>
                    <p>ความเคลื่อนไหวล่าสุดของเดือนนี้</p>
                  </div>
                  <button className="text-button" onClick={() => changePage('transactions')}>
                    ดูทั้งหมด <ArrowUpRight size={15} />
                  </button>
                </div>
                <TransactionTable
                  transactions={current.slice(0, 5)}
                  onEdit={(t) => {
                    setEditing(t);
                    setShowForm(true);
                  }}
                  onDelete={setDeleting}
                />
              </section>
              <section className="panel budget-preview">
                <div className="panel-heading">
                  <div>
                    <h2>งบประมาณเดือนนี้</h2>
                    <p>ใช้จ่ายอย่างพอดี มีเงินเหลือเก็บ</p>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="แก้ไขงบประมาณ"
                    onClick={() => setBudgetModal(true)}
                  >
                    <SlidersHorizontal size={17} />
                  </button>
                </div>
                <div className="budget-total">
                  <span>
                    ใช้ไปแล้ว <strong>{currency(stats.expense)}</strong>
                  </span>
                  <small>จาก {currency(totalBudget)}</small>
                </div>
                {expenseCategories.slice(0, 3).map((c) => (
                  <BudgetProgress
                    key={c}
                    category={c}
                    spent={spending.find((s) => s.category === c)?.value ?? 0}
                    budget={limits[c] ?? 0}
                  />
                ))}
                <button className="budget-link" onClick={() => changePage('budgets')}>
                  จัดการงบประมาณ <ChevronRight size={15} />
                </button>
              </section>
            </div>
          )}
          {page === 'transactions' && (
            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    ธุรกรรมทั้งหมด <span className="count-badge">{filtered.length}</span>
                  </h2>
                  <p>รายการของเดือน{monthLabel}</p>
                </div>
              </div>
              <div className="filters">
                <div className="search-input">
                  <Search size={17} />
                  <input
                    aria-label="ค้นหารายการ"
                    placeholder="ค้นหารายการ หมวดหมู่ หรือหมายเหตุ..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setLimit(20);
                    }}
                  />
                </div>
                <select
                  aria-label="กรองประเภท"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setLimit(20);
                  }}
                >
                  <option value="all">ทุกประเภท</option>
                  <option value="income">รายรับ</option>
                  <option value="expense">รายจ่าย</option>
                </select>
                <select
                  aria-label="กรองหมวดหมู่"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setLimit(20);
                  }}
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  {Object.entries(categories).map(([k, v]) => (
                    <option value={k} key={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <TransactionTable
                transactions={filtered.slice(0, limit)}
                onEdit={(t) => {
                  setEditing(t);
                  setShowForm(true);
                }}
                onDelete={setDeleting}
              />
              <div className="table-footer">
                <span>
                  แสดง {Math.min(limit, filtered.length)} จาก {filtered.length} รายการ
                </span>
                {limit < filtered.length && (
                  <button className="button secondary" onClick={() => setLimit(limit + 20)}>
                    โหลดเพิ่มเติม
                  </button>
                )}
              </div>
            </section>
          )}
          {page === 'budgets' && (
            <>
              <div className="budget-banner">
                <div>
                  <span className="eyebrow">MONTHLY BUDGET</span>
                  <h2>ทุกเป้าหมาย เริ่มต้นด้วยแผนที่ดี</h2>
                  <p>
                    งบประมาณรวม {currency(totalBudget)} · ใช้ไปแล้ว {currency(stats.expense)}
                  </p>
                </div>
                <button className="button primary" onClick={() => setBudgetModal(true)}>
                  <SlidersHorizontal size={16} />
                  ตั้งงบประมาณ
                </button>
              </div>
              <div className="budget-grid">
                {expenseCategories.map((c) => (
                  <section className="panel budget-detail" key={c}>
                    <CategoryIcon category={c} />
                    <h2>{categories[c].label}</h2>
                    <BudgetProgress
                      category={c}
                      spent={spending.find((s) => s.category === c)?.value ?? 0}
                      budget={limits[c] ?? 0}
                    />
                    <p>
                      {limits[c]
                        ? `คงเหลือ ${currency((limits[c] ?? 0) - (spending.find((s) => s.category === c)?.value ?? 0))}`
                        : 'ยังไม่ได้ตั้งงบประมาณ'}
                    </p>
                    <button className="text-button" onClick={() => setBudgetModal(true)}>
                      แก้ไขงบประมาณ <ArrowUpRight size={14} />
                    </button>
                  </section>
                ))}
              </div>
            </>
          )}
          {page === 'reports' && (
            <section className="panel report-panel">
              <div className="panel-heading">
                <div>
                  <h2>รายละเอียดค่าใช้จ่ายตามหมวดหมู่</h2>
                  <p>เปรียบเทียบกับงบประมาณในเดือน{monthLabel}</p>
                </div>
                <TrendingUp size={23} />
              </div>
              {spending.length ? (
                spending.map((s) => (
                  <div className="report-row" key={s.category}>
                    <CategoryIcon category={s.category} />
                    <strong>{s.name}</strong>
                    <span>{((s.value / stats.expense) * 100).toFixed(1)}%</span>
                    <b>{currency(s.value)}</b>
                    <span
                      className={
                        s.value > (limits[s.category] ?? Infinity) ? 'error-text' : 'positive'
                      }
                    >
                      {limits[s.category]
                        ? `${((s.value / limits[s.category]!) * 100).toFixed(0)}% ของงบ`
                        : 'ยังไม่ตั้งงบ'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty">ยังไม่มีข้อมูลรายจ่ายสำหรับเดือนนี้</div>
              )}
            </section>
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} /> ข้อมูลของคุณเป็นส่วนตัว และจัดเก็บบนเบราว์เซอร์นี้เท่านั้น
            </span>
            <span>
              Made for a better financial life <span className="footer-star">✧</span>
            </span>
          </footer>
        </main>
      </div>
      {showForm && (
        <TransactionForm
          transaction={editing}
          onClose={() => setShowForm(false)}
          onSave={(t) => {
            const ok = persist({
              ...data,
              transactions: editing
                ? data.transactions.map((x) => (x.id === t.id ? t : x))
                : [t, ...data.transactions],
            });
            if (ok) {
              setMonth(t.date.slice(0, 7));
              setToast(editing ? 'แก้ไขรายการเรียบร้อยแล้ว' : 'เพิ่มรายการเรียบร้อยแล้ว');
            }
            return ok;
          }}
        />
      )}
      {deleting && (
        <Modal title="ลบรายการนี้?" onClose={() => setDeleting(undefined)}>
          <p className="modal-description">
            คุณต้องการลบ “{deleting.title}” จำนวน {currency(deleting.amount)} ใช่ไหม?
            เมื่อลบแล้วจะไม่สามารถย้อนกลับได้
          </p>
          {storageError && (
            <p role="alert" className="error-text">
              {storageError}
            </p>
          )}
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setDeleting(undefined)}>
              ยกเลิก
            </button>
            <button
              className="button danger"
              onClick={() => {
                if (
                  persist({
                    ...data,
                    transactions: data.transactions.filter((t) => t.id !== deleting.id),
                  })
                ) {
                  setDeleting(undefined);
                  setToast('ลบรายการเรียบร้อยแล้ว');
                }
              }}
            >
              ยืนยันการลบ
            </button>
          </div>
        </Modal>
      )}
      {budgetModal && (
        <BudgetForm
          month={month}
          limits={limits}
          onClose={() => setBudgetModal(false)}
          onSave={(next) => {
            if (persist({ ...data, budgets: { ...data.budgets, [month]: next } })) {
              setBudgetModal(false);
              setToast('บันทึกงบประมาณเรียบร้อยแล้ว');
              return true;
            }
            return false;
          }}
        />
      )}
      {help && (
        <Modal title="ยินดีต้อนรับสู่ MoneyFlow" onClose={() => setHelp(false)}>
          <div className="help-content">
            <p>
              เริ่มต้นด้วยข้อมูลตัวอย่างย้อนหลัง 12 เดือน กด “เพิ่มรายการ”
              เพื่อบันทึกรายรับหรือรายจ่าย และเลือกเดือนเพื่อดูข้อมูลย้อนหลัง
            </p>
            <h3>วางแผนและติดตาม</h3>
            <p>
              ตั้งวงเงินแต่ละหมวดในหน้า “งบประมาณ” และค้นหารายการในหน้า “รายการธุรกรรม” ส่งออก CSV
              จะดาวน์โหลดเฉพาะเดือนและตัวกรองปัจจุบัน
            </p>
            <h3>ความเป็นส่วนตัวและข้อมูลสำรอง</h3>
            <p>
              ข้อมูลถูกเก็บใน LocalStorage ของเบราว์เซอร์นี้ ไม่มีการส่งไปเซิร์ฟเวอร์
              ข้อมูลจะไม่ซิงก์ข้ามอุปกรณ์ และอาจหายเมื่อคุณล้างข้อมูลเบราว์เซอร์ ควรส่งออก CSV
              สำรองเป็นประจำ (เวอร์ชันนี้ยังไม่รองรับการนำเข้า)
            </p>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => setHelp(false)}>
              เข้าใจแล้ว
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
export default App;
