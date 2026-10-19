import { describe, expect, it } from 'vitest';
import {
  filterTransactions,
  monthsEnding,
  parseData,
  sampleData,
  toCSV,
  totals,
  validTransaction,
} from './finance';
import type { Transaction } from './finance';
const t: Transaction = {
  id: '1',
  title: 'อาหาร',
  amount: 100,
  type: 'expense',
  category: 'food',
  date: '2026-10-12',
  note: '',
};
describe('financial calculations', () => {
  it('calculates income, expense, balance and savings independently', () => {
    expect(
      totals([t, { ...t, id: '2', amount: 1000, type: 'income', category: 'salary' }]),
    ).toEqual({ income: 1000, expense: 100, balance: 900, savings: 90 });
  });
  it('handles no income and overspending', () => {
    expect(totals([]).savings).toBe(0);
    expect(totals([t]).balance).toBe(-100);
    expect(
      totals([t, { ...t, id: '2', type: 'income', category: 'salary', amount: 50 }]).savings,
    ).toBe(-100);
  });
  it('uses cents to avoid summation errors', () => {
    expect(
      totals([
        { ...t, amount: 0.1 },
        { ...t, id: '2', amount: 0.2 },
      ]).expense,
    ).toBe(0.3);
    expect(
      totals([
        { ...t, amount: 0.1 },
        { ...t, id: '2', type: 'income', category: 'salary', amount: 0.3 },
      ]).balance,
    ).toBe(0.2);
  });
  it('rolls chart months across years', () => {
    expect(monthsEnding('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});
describe('transaction filtering', () => {
  const ts = [
    t,
    {
      ...t,
      id: '2',
      title: 'เงินเดือน',
      type: 'income' as const,
      category: 'salary' as const,
      date: '2026-10-01',
    },
    { ...t, id: '3', date: '2026-09-20' },
  ];
  it('combines month, text, type and category', () => {
    expect(filterTransactions(ts, '2026-10', 'อาหาร', 'expense', 'food')).toEqual([t]);
    expect(filterTransactions(ts, '2026-10', '', 'income')).toHaveLength(1);
    expect(filterTransactions(ts, '2026-10', '', 'all', 'travel')).toEqual([]);
  });
  it('matches notes and sorts newest first', () => {
    expect(filterTransactions([{ ...t, note: 'HELLO' }], '2026-10', 'hello')).toHaveLength(1);
    expect(filterTransactions(ts, '2026-10').map((x) => x.id)).toEqual(['1', '2']);
  });
});
describe('storage validation', () => {
  it('round trips realistic samples with unique IDs', () => {
    const data = sampleData(new Date(2026, 9, 19));
    expect(data.transactions.length).toBeGreaterThan(100);
    expect(parseData(JSON.stringify(data))).toEqual(data);
    expect(data.transactions.every(validTransaction)).toBe(true);
    expect(data.transactions.every((t) => t.date <= '2026-10-19')).toBe(true);
  });
  it('rejects corrupt JSON and invalid records', () => {
    expect(() => parseData('{')).toThrow();
    expect(() =>
      parseData(JSON.stringify({ version: 1, transactions: [{ ...t, amount: -1 }], budgets: {} })),
    ).toThrow();
    expect(validTransaction({ ...t, date: '2026-02-30' })).toBe(false);
    expect(validTransaction({ ...t, type: 'income' })).toBe(false);
    expect(validTransaction({ ...t, amount: Infinity })).toBe(false);
  });
  it('rejects duplicate IDs and invalid budgets', () => {
    expect(() =>
      parseData(JSON.stringify({ version: 1, transactions: [t, t], budgets: {} })),
    ).toThrow();
    expect(() =>
      parseData(
        JSON.stringify({ version: 1, transactions: [], budgets: { '2026-10': { food: -2 } } }),
      ),
    ).toThrow();
  });
});
describe('CSV export', () => {
  it('exports Thai UTF-8 BOM, correct quoting, and amounts', () => {
    const csv = toCSV([{ ...t, title: 'ข้าว, "อร่อย"', note: 'บรรทัด\nใหม่' }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"ข้าว, ""อร่อย"""');
    expect(csv).toContain('"100"');
    expect(csv).toContain('"บรรทัด\nใหม่"');
  });
  it('neutralizes spreadsheet formula injection', () => {
    expect(toCSV([{ ...t, title: '=1+1', note: '@SUM(A1)' }])).toContain('"\'=1+1"');
  });
});
