# MoneyFlow

เว็บจัดการรายรับรายจ่ายส่วนตัวภาษาไทย สกุลเงินบาท พร้อม Dashboard สไตล์ Modern SaaS สำหรับเดสก์ท็อปและมือถือ ใช้งานได้โดยไม่ต้องมี Backend, บัญชีผู้ใช้ หรือ API Key

## เริ่มต้น

ใช้ Node.js 24 LTS และ npm (ระบุเวอร์ชันใน `.nvmrc`)

```bash
cd /workspace/MoneyFlow
npm ci
npm run dev
```

Development server ใช้พอร์ต 5173 และรับการเชื่อมต่อผ่าน `0.0.0.0` หาก npm เขียน cache ใน home directory ไม่ได้ ให้ใช้ `npm ci --cache /tmp/moneyflow-npm-cache` แทน

```bash
npm run build       # ตรวจ TypeScript และสร้าง dist/
npm run preview     # ทดลอง production build ที่พอร์ต 4173
npm test            # Unit tests
npm run test:e2e    # Browser tests ทั้ง desktop และ mobile
npm run format     # จัดรูปแบบโค้ด
npm run format:check
```

Browser tests ใช้ Chromium ที่ `/usr/bin/chromium` หากมี สามารถกำหนด `PLAYWRIGHT_CHROMIUM_PATH` เป็น path ของ Chromium เองได้ หากไม่มี system Chromium ให้ติดตั้ง browser ของ Playwright ด้วย `npx playwright install --with-deps chromium` ก่อนทดสอบ (Linux อาจต้องมีสิทธิ์ติดตั้ง system packages) ไม่ต้องติดตั้ง browser สำหรับการใช้งานหรือ build แอป

## ฟีเจอร์และวิธีใช้

- **ภาพรวม:** ดูรายรับ รายจ่าย ยอดคงเหลือสุทธิ และอัตราการออมของเดือนที่เลือก พร้อมเทียบรายรับ/รายจ่ายกับเดือนก่อน
- **กระแสเงินสด:** กราฟรายเดือนย้อนหลัง 3, 6 หรือ 12 เดือน สิ้นสุดที่เดือนที่เลือก และกราฟสัดส่วนค่าใช้จ่ายรายหมวด
- **ธุรกรรม:** เพิ่ม แก้ไข และลบพร้อมยืนยัน ระบุประเภท หมวดหมู่ วันที่ จำนวนเงิน และหมายเหตุ ตรวจสอบข้อมูลก่อนบันทึก รองรับทศนิยมสองตำแหน่ง
- **ค้นหาและกรอง:** เลือกเดือน ค้นหาชื่อ/หมายเหตุ/หมวดหมู่ กรองประเภทและหมวดหมู่ร่วมกัน โหลดรายการเพิ่มครั้งละ 20 รายการ
- **งบประมาณ:** ตั้งวงเงินแต่ละหมวดแยกตามเดือน พร้อมแถบการใช้จ่ายและแจ้งเตือนเกินงบ ระบุ 0 หรือเว้นว่างเพื่อไม่จำกัดวงเงิน
- **รายงาน:** ดูค่าใช้จ่าย สัดส่วน และเปอร์เซ็นต์การใช้งบในแต่ละหมวด
- **CSV:** ส่งออกเดือนที่เลือก; ในหน้าธุรกรรมจะใช้ตัวกรองปัจจุบันด้วย รองรับภาษาไทยด้วย UTF-8 BOM, escape เครื่องหมายคำพูด และป้องกัน formula injection
- **ธีม:** สลับ Light/Dark Mode และจดจำการตั้งค่า
- **ข้อมูลตัวอย่าง:** สร้างรายการสมจริง 12 เดือนและงบประมาณครั้งแรกเท่านั้น โดยอิงวันที่เปิดแอป
- **สถานะ UI:** มี loading ระหว่างโหลดแอป, empty state เมื่อไม่มีข้อมูล, error boundary และข้อความแจ้งเมื่ออ่านหรือเขียนข้อมูลไม่สำเร็จ รองรับ keyboard focus และ modal ที่กัก focus ด้วย native dialog

### ความหมายของตัวเลข

ยอดคงเหลือสุทธิ = รายรับของเดือน − รายจ่ายของเดือน ไม่ใช่ยอดยกมาจากเดือนก่อน อัตราการออม = ยอดคงเหลือสุทธิ ÷ รายรับ × 100; ถ้าไม่มีรายรับแสดง 0% และอาจติดลบเมื่อรายจ่ายเกินรายรับ รวมยอดด้วยหน่วยสตางค์เพื่อลดปัญหาทศนิยมของ JavaScript

### การจัดเก็บและข้อจำกัด

ข้อมูลเก็บที่ LocalStorage key `moneyflow:v1`; ธีมที่ `moneyflow:theme` ไม่มีการส่งข้อมูลการเงินไปเซิร์ฟเวอร์ และฟอนต์ถูก bundle มากับแอป ข้อมูลแยกตาม browser และ origin ไม่ซิงก์ข้ามอุปกรณ์ การล้าง site data หรือใช้ private mode อาจทำให้ข้อมูลหาย ควรส่งออก CSV สำรองเป็นระยะ เวอร์ชันนี้ยังไม่มีการนำเข้า CSV และ CSV ไม่รวมการตั้งค่างบประมาณ

หากพบข้อมูลจัดเก็บเสีย แอปจะไม่เขียนทับข้อมูลเดิม และจะแสดงข้อผิดพลาด หากพื้นที่จัดเก็บเต็ม การบันทึกจะไม่ปิดฟอร์มหรือแจ้งว่าสำเร็จ เก็บข้อมูลเดิมและกู้คืนผ่าน browser developer tools ก่อนล้าง site data ตามความเหมาะสม การรีเซ็ต key `moneyflow:v1` จะทำให้สร้างข้อมูลตัวอย่างใหม่และลบประวัติเดิม จึงไม่ควรทำหากยังไม่มีสำรอง

## โครงสร้าง

```text
src/
  App.tsx                         หน้าหลัก การนำทาง ตัวกรอง และ state ของแอป
  main.tsx                        Entry, loading และ error boundary
  styles.css                      Design tokens, responsive และธีม
  components/
    DashboardCharts.tsx           กราฟกระแสเงินสดและสัดส่วนรายจ่าย
    TransactionForm.tsx           ฟอร์มเพิ่ม/แก้ไขรายการ
    Budget.tsx                    ฟอร์มงบประมาณและ progress ที่ใช้ร่วมกัน
    Shared.tsx                    Modal, category icons และตารางรายการ
  lib/
    finance.ts                    Types, คำนวณ, validation, CSV และ sample data
    finance.test.ts               Unit tests
public/favicon.svg
tests/app.spec.ts                 Browser tests
```

เทคโนโลยี: React 19, TypeScript, Vite, Tailwind CSS 4 (Vite plugin), Recharts, Lucide React, Vitest และ Playwright ใช้ CSS tokens สำหรับธีมและจัดรูปแบบ component โดยแยก financial logic ออกจาก UI มี `package-lock.json` สำหรับติดตั้งซ้ำด้วย `npm ci` และแยก chart bundle เพื่อลดขนาดแต่ละ JavaScript chunk

## การตรวจสอบ

Unit tests ครอบคลุมยอดรวมและทศนิยม อัตราการออม การเลื่อนเดือนข้ามปี ตัวกรอง การตรวจสอบ transaction/budget ข้อมูลเสีย ID ซ้ำ sample data และ CSV

Browser tests ทำงานบน viewport 1440×1000 และ 390×844 ครอบคลุม CRUD และ persistence หลังรีโหลด การกรอง CSV download ธีม งบประมาณ ช่วงเวลากราฟ การนำทาง หน้าไม่มีข้อมูล ข้อมูลจัดเก็บเสีย และ write failure รวมถึงตรวจ runtime errors และ horizontal overflow บนหน้ารายงาน

ตรวจจริงด้วย Chromium เท่านั้น ยังไม่ได้ทดสอบ Safari, Firefox หรืออุปกรณ์มือถือจริง ชุดทดสอบไม่ได้ยืนยันการใช้งานกับ browser extensions ทุกชนิด และไม่มี backend หรือการทดสอบการซิงก์ข้อมูล
