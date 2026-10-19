import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  X,
  Utensils,
  Car,
  ShoppingBag,
  House,
  Heart,
  Ellipsis,
  BriefcaseBusiness,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { categories, currency } from '../lib/finance';
import type { Category, Transaction } from '../lib/finance';
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = {
    food: Utensils,
    travel: Car,
    shopping: ShoppingBag,
    bills: House,
    health: Heart,
    other: Ellipsis,
    salary: BriefcaseBusiness,
  }[categories[category].icon];
  return (
    <span
      className="category-icon"
      style={{ color: categories[category].color, background: `${categories[category].color}18` }}
    >
      <Icon size={18} />
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="ปิด" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>รายการ</th>
            <th>หมวดหมู่</th>
            <th>วันที่</th>
            <th className="amount-cell">จำนวนเงิน</th>
            <th>
              <span className="sr-only">จัดการ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>
                <div className="transaction-title">
                  <CategoryIcon category={t.category} />
                  <div>
                    <strong>{t.title}</strong>
                    <small>{t.type === 'income' ? 'รับเข้าบัญชี' : 'ชำระเงินแล้ว'}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className="category-pill">{categories[t.category].label}</span>
              </td>
              <td className="date-cell">
                {new Date(t.date + 'T12:00:00').toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })}
              </td>
              <td className={`amount-cell ${t.type === 'income' ? 'positive' : ''}`}>
                <span className="money-sign">{t.type === 'income' ? '+' : '−'}</span>
                {currency(t.amount)}
              </td>
              <td>
                <div className="row-actions">
                  <button onClick={() => onEdit(t)} aria-label={`แก้ไข ${t.title}`}>
                    แก้ไข
                  </button>
                  <button onClick={() => onDelete(t)} aria-label={`ลบ ${t.title}`}>
                    ลบ
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!transactions.length && (
        <div className="empty">
          <ShoppingBag size={32} />
          <h3>ยังไม่มีรายการในช่วงนี้</h3>
          <p>ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการแรกของคุณ</p>
        </div>
      )}
    </div>
  );
}
export function Direction({ income = false }: { income?: boolean }) {
  return income ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />;
}
