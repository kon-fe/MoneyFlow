import { test, expect } from '@playwright/test';
async function navigate(page: import('@playwright/test').Page, name: string) {
  if (test.info().project.name === 'mobile')
    await page.getByRole('button', { name: 'เปิดเมนู', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
}
test('CRUD persists through reload and filters/export work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ภาพรวมการเงิน.' })).toBeVisible();
  await page.getByRole('button', { name: 'เพิ่มรายการ', exact: true }).click();
  await page.getByLabel('ชื่อรายการ').fill('ทดสอบรายการกาแฟ');
  await page.getByLabel('จำนวนเงิน (บาท)').fill('123.45');
  await page.getByRole('button', { name: 'บันทึกรายการ', exact: true }).click();
  await navigate(page, 'รายการธุรกรรม');
  await page.getByRole('textbox', { name: 'ค้นหารายการ' }).fill('ทดสอบรายการกาแฟ');
  await expect(
    page.getByRole('cell', { name: 'ทดสอบรายการกาแฟ ชำระเงินแล้ว', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'แก้ไข ทดสอบรายการกาแฟ', exact: true }).click();
  await page.getByLabel('จำนวนเงิน (บาท)').fill('234.56');
  await page.getByRole('button', { name: 'บันทึกรายการ', exact: true }).click();
  await expect(page.getByRole('cell', { name: '−฿234.56' })).toBeVisible();
  await page.reload();
  await navigate(page, 'รายการธุรกรรม');
  await page.getByRole('textbox', { name: 'ค้นหารายการ' }).fill('ทดสอบรายการกาแฟ');
  await expect(page.getByRole('cell', { name: '−฿234.56' })).toBeVisible();
  await page.getByLabel('กรองประเภท').selectOption('income');
  await expect(page.getByText('ยังไม่มีรายการในช่วงนี้')).toBeVisible();
  await page.getByLabel('กรองประเภท').selectOption('expense');
  {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'ส่งออกข้อมูล', exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/MoneyFlow-.*\.csv/);
  }
  await page.getByRole('button', { name: 'ลบ ทดสอบรายการกาแฟ', exact: true }).click();
  await page.getByRole('button', { name: 'ยืนยันการลบ', exact: true }).click();
  await expect(page.getByText('ยังไม่มีรายการในช่วงนี้')).toBeVisible();
});
test('budgets, themes, chart range and responsive layout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByLabel('ช่วงเวลากราฟ').selectOption('12');
  await page.getByRole('button', { name: 'เปิด Dark Mode', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'เปิด Light Mode', exact: true }).click();
  await navigate(page, 'งบประมาณ');
  await page.getByRole('button', { name: 'ตั้งงบประมาณ', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'งบอาหารและเครื่องดื่ม', exact: true }).fill('100');
  await page.getByRole('button', { name: 'บันทึกงบประมาณ', exact: true }).click();
  await expect(page.getByText(/เกินงบ/).first()).toBeVisible();
  await page.reload();
  await navigate(page, 'งบประมาณ');
  await page.getByRole('button', { name: 'ตั้งงบประมาณ', exact: true }).click();
  await expect(
    page.getByRole('spinbutton', { name: 'งบอาหารและเครื่องดื่ม', exact: true }),
  ).toHaveValue('100');
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await navigate(page, 'รายงานและสถิติ');
  await expect(
    page.getByRole('heading', { name: 'รายละเอียดค่าใช้จ่ายตามหมวดหมู่' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
test('empty month and corrupt storage have honest states', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('เลือกเดือน').fill('2001-01');
  await expect(page.getByText('ยังไม่มีรายจ่ายในเดือนนี้')).toBeVisible();
  await expect(page.getByText('ยังไม่มีรายการในช่วงนี้')).toBeVisible();
  await page.evaluate(() => localStorage.setItem('moneyflow:v1', 'broken data'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('ไม่สามารถอ่านข้อมูลเดิมได้');
  expect(await page.evaluate(() => localStorage.getItem('moneyflow:v1'))).toBe('broken data');
});
test('storage write failures do not falsely confirm saving', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'เพิ่มรายการ', exact: true }).click();
  await page.getByLabel('ชื่อรายการ').fill('บันทึกไม่ได้');
  await page.getByLabel('จำนวนเงิน (บาท)').fill('99');
  await page.getByRole('button', { name: 'บันทึกรายการ', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('บันทึกไม่สำเร็จ');
});
