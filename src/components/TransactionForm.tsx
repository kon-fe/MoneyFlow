import { useState } from 'react';
import {
  categories,
  expenseCategories,
  incomeCategories,
  localDate,
  validTransaction,
} from '../lib/finance';
import type { Transaction } from '../lib/finance';
import { Modal } from './Shared';
export default function TransactionForm({
  transaction,
  onSave,
  onClose,
}: {
  transaction?: Transaction;
  onSave: (t: Transaction) => boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Transaction>(
    transaction ?? {
      id: crypto.randomUUID(),
      title: '',
      amount: 0,
      type: 'expense',
      category: 'food',
      date: localDate(),
      note: '',
    },
  );
  const [error, setError] = useState('');
  return (
    <Modal title={transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!validTransaction(form)) {
            setError('กรุณากรอกข้อมูลให้ครบ และระบุจำนวนเงินมากกว่า 0');
            return;
          }
          if (onSave({ ...form, title: form.title.trim() })) onClose();
          else setError('บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บข้อมูลในเบราว์เซอร์');
        }}
      >
        <div className="segmented form-types">
          {(['expense', 'income'] as const).map((type) => (
            <button
              type="button"
              key={type}
              className={form.type === type ? 'active' : ''}
              onClick={() =>
                setForm({ ...form, type, category: type === 'income' ? 'salary' : 'food' })
              }
            >
              {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
            </button>
          ))}
        </div>
        <label>
          ชื่อรายการ
          <input
            autoFocus
            required
            maxLength={100}
            placeholder="เช่น มื้อกลางวัน หรือ เงินเดือน"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            จำนวนเงิน (บาท)
            <input
              required
              type="number"
              min="0.01"
              max="1000000000000"
              step="0.01"
              placeholder="0.00"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </label>
          <label>
            วันที่
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>
        </div>
        <label>
          หมวดหมู่
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as Transaction['category'] })
            }
          >
            {(form.type === 'income' ? incomeCategories : expenseCategories).map((c) => (
              <option key={c} value={c}>
                {categories[c].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          หมายเหตุ <span className="muted">(ไม่จำเป็น)</span>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="เพิ่มรายละเอียดเกี่ยวกับรายการนี้"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </label>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="button primary">
            บันทึกรายการ
          </button>
        </div>
      </form>
    </Modal>
  );
}
