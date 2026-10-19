import { useState } from 'react';
import { categories, currency, expenseCategories } from '../lib/finance';
import type { Category } from '../lib/finance';
import { CategoryIcon, Modal } from './Shared';
export function BudgetProgress({
  category,
  spent,
  budget,
}: {
  category: Category;
  spent: number;
  budget: number;
}) {
  const percent = budget ? (spent / budget) * 100 : 0;
  return (
    <div className="budget-progress">
      <div>
        <span>{categories[category].label}</span>
        <small>
          <strong>{currency(spent)}</strong> / {budget ? currency(budget) : 'ไม่ระบุ'}
        </small>
      </div>
      <div className="progress-track">
        <span
          style={{
            width: `${Math.min(percent, 100)}%`,
            background: percent > 100 ? '#e36c64' : categories[category].color,
          }}
        />
      </div>
      {percent > 100 && <small className="error-text">เกินงบ {currency(spent - budget)}</small>}
    </div>
  );
}
export default function BudgetForm({
  month,
  limits,
  onClose,
  onSave,
}: {
  month: string;
  limits: Partial<Record<Category, number>>;
  onClose: () => void;
  onSave: (v: Partial<Record<Category, number>>) => boolean;
}) {
  const [values, setValues] = useState(limits);
  const [error, setError] = useState('');
  return (
    <Modal title="ตั้งงบประมาณรายเดือน" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!onSave(values))
            setError('บันทึกไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บข้อมูลในเบราว์เซอร์');
        }}
      >
        <p className="modal-description">
          เดือน
          {new Date(month + '-01').toLocaleDateString('th-TH', {
            month: 'long',
            year: 'numeric',
          })}{' '}
          · ระบุ 0 หากไม่ต้องการจำกัดงบ
        </p>
        <div className="budget-form">
          {expenseCategories.map((c) => (
            <label key={c}>
              <span>
                <CategoryIcon category={c} />
                {categories[c].label}
              </span>
              <input
                type="number"
                aria-label={`งบ${categories[c].label}`}
                min="0"
                max="1000000000000"
                step="0.01"
                value={values[c] ?? ''}
                placeholder="0"
                onChange={(e) => setValues({ ...values, [c]: Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <div className="modal-footer">
          <button className="button secondary" type="button" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="button primary">
            บันทึกงบประมาณ
          </button>
        </div>
      </form>
    </Modal>
  );
}
