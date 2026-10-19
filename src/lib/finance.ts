export const categories = {
  food: { label: 'อาหารและเครื่องดื่ม', color: '#ee9763', icon: 'food' },
  travel: { label: 'การเดินทาง', color: '#8182de', icon: 'travel' },
  shopping: { label: 'ช้อปปิ้ง', color: '#e4b753', icon: 'shopping' },
  bills: { label: 'บิลและที่อยู่อาศัย', color: '#5c9fbc', icon: 'bills' },
  health: { label: 'สุขภาพ', color: '#dc83a0', icon: 'health' },
  other: { label: 'อื่น ๆ', color: '#94a39c', icon: 'other' },
  salary: { label: 'เงินเดือน', color: '#34a785', icon: 'salary' },
  freelance: { label: 'รายได้เสริม', color: '#65b5a1', icon: 'salary' },
} as const;
export type Category = keyof typeof categories;
export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category;
  date: string;
  note: string;
};
export type Data = {
  version: 1;
  transactions: Transaction[];
  budgets: Record<string, Partial<Record<Category, number>>>;
};
export const expenseCategories = Object.keys(categories).filter(
  (k) => !['salary', 'freelance'].includes(k),
) as Category[];
export const incomeCategories: Category[] = ['salary', 'freelance'];
export const currency = (n: number) =>
  new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
export function localDate(d = new Date()) {
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
}
export function monthsEnding(month: string, count: number) {
  const [y, m] = month.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => monthKey(new Date(y, m - count + i, 1)));
}
export function totals(transactions: Transaction[]) {
  const income =
    transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Math.round(t.amount * 100), 0) / 100;
  const expense =
    transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Math.round(t.amount * 100), 0) / 100;
  return {
    income,
    expense,
    balance: Math.round(income * 100 - expense * 100) / 100,
    savings: income > 0 ? ((income - expense) / income) * 100 : 0,
  };
}
export function filterTransactions(
  ts: Transaction[],
  month: string,
  query = '',
  type = 'all',
  category = 'all',
) {
  return ts
    .filter(
      (t) =>
        (!month || t.date.startsWith(month)) &&
        `${t.title} ${t.note} ${categories[t.category].label}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (type === 'all' || t.type === type) &&
        (category === 'all' || t.category === category),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function validTransaction(t: unknown): t is Transaction {
  if (!t || typeof t !== 'object') return false;
  const x = t as Transaction;
  return (
    typeof x.id === 'string' &&
    typeof x.title === 'string' &&
    x.title.trim().length > 0 &&
    typeof x.note === 'string' &&
    Number.isFinite(x.amount) &&
    x.amount > 0 &&
    x.amount <= 1e12 &&
    ['income', 'expense'].includes(x.type) &&
    x.category in categories &&
    (x.type === 'income' ? incomeCategories : expenseCategories).includes(x.category) &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.date) &&
    !Number.isNaN(Date.parse(x.date)) &&
    new Date(x.date).toISOString().slice(0, 10) === x.date
  );
}
export function parseData(raw: string): Data {
  const d = JSON.parse(raw) as Data;
  if (
    d.version !== 1 ||
    !Array.isArray(d.transactions) ||
    !d.transactions.every(validTransaction) ||
    new Set(d.transactions.map((t) => t.id)).size !== d.transactions.length ||
    !d.budgets ||
    typeof d.budgets !== 'object' ||
    Array.isArray(d.budgets)
  )
    throw new Error('ข้อมูลที่บันทึกไว้ไม่ถูกต้อง');
  for (const [m, limits] of Object.entries(d.budgets)) {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(m) ||
      !limits ||
      typeof limits !== 'object' ||
      Array.isArray(limits) ||
      Object.entries(limits).some(
        ([k, v]) =>
          !expenseCategories.includes(k as Category) ||
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          v < 0 ||
          v > 1e12,
      )
    )
      throw new Error('ข้อมูลงบประมาณไม่ถูกต้อง');
  }
  return d;
}
export function toCSV(ts: Transaction[]) {
  const escape = (v: string | number) =>
    `"${String(v)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  return (
    '\uFEFF' +
    [
      ['วันที่', 'รายการ', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'หมายเหตุ'],
      ...ts.map((t) => [
        t.date,
        t.title,
        t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
        categories[t.category].label,
        t.amount,
        t.note,
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\r\n')
  );
}
export function sampleData(now = new Date()): Data {
  const transactions: Transaction[] = [];
  const budgets: Data['budgets'] = {};
  for (let offset = 0; offset < 12; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const m = monthKey(d);
    const day = (n: number) => `${m}-${String(n).padStart(2, '0')}`;
    const add = (
      title: string,
      amount: number,
      type: Transaction['type'],
      category: Category,
      n: number,
    ) =>
      transactions.push({
        id: `sample-${offset}-${transactions.length}`,
        title,
        amount,
        type,
        category,
        date: day(Math.min(n, offset === 0 ? now.getDate() : 28)),
        note: '',
      });
    add('เงินเดือน', 45000 + (offset % 3) * 1500, 'income', 'salary', 1);
    add('ออกแบบเว็บไซต์', 7500 + (offset % 4) * 1000, 'income', 'freelance', 8);
    add('ค่าเช่าคอนโด', 9500, 'expense', 'bills', 3);
    add('ค่าไฟฟ้าและอินเทอร์เน็ต', 1650, 'expense', 'bills', 5);
    add('ซื้อของใช้เข้าบ้าน', 1890 + (offset % 3) * 220, 'expense', 'shopping', 11);
    add('หนังสือและของแต่งห้อง', 1290, 'expense', 'shopping', 16);
    add('ตรวจสุขภาพและวิตามิน', 850, 'expense', 'health', 12);
    for (let i = 0; i < 8; i++)
      add(
        [
          'มื้อกลางวัน · อิ่มอร่อย',
          'กาแฟยามเช้า · ร้านประจำ',
          'มื้อเย็นกับครอบครัว',
          'ซื้อวัตถุดิบทำอาหาร',
        ][i % 4],
        [185, 95, 680, 420][i % 4] + offset * 9,
        'expense',
        'food',
        2 + i * 3,
      );
    add('เติมน้ำมันรถ', 1500, 'expense', 'travel', 9);
    add('BTS และ MRT', 720, 'expense', 'travel', 18);
    add('สมาชิก Spotify', 169, 'expense', 'other', 7);
    budgets[m] = {
      food: 6500,
      travel: 3000,
      shopping: 5000,
      bills: 12000,
      health: 2000,
      other: 1500,
    };
  }
  return { version: 1, transactions, budgets };
}
