import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans-thai';
import './styles.css';
const App = lazy(() => import('./App'));
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="boot-state" role="alert">
        <strong>เกิดข้อผิดพลาดในการแสดงผล</strong>
        <p>ข้อมูลที่บันทึกไว้ยังอยู่บนเบราว์เซอร์ กรุณาโหลดหน้าใหม่เพื่อลองอีกครั้ง</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          โหลดใหม่
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="boot-state" role="status">
            <span className="loading-ring" />
            <strong>MoneyFlow</strong>
            <p>กำลังเตรียมภาพรวมการเงินของคุณ...</p>
          </div>
        }
      >
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
