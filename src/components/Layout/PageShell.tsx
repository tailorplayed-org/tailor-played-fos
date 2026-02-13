import { useMemo } from 'react';
import { Outlet } from 'react-router';
import { useDirection } from '@/hooks';
import { useTransactionStore } from '@/stores';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import styles from './PageShell.module.scss';

export function PageShell() {
  // Sets dir and lang attributes on <html> element reactively
  useDirection();

  // Derive pending review count from shared store (populated by
  // Dashboard or Review page subscriptions). Uses targeted selector +
  // useMemo to avoid React 19 + Zustand re-render loops. Only
  // re-renders when `transactions` array changes (not on loading/error).
  const transactions = useTransactionStore((state) => state.transactions);
  const pendingCount = useMemo(
    () => transactions.filter((t) => t.status === 'pending_review').length,
    [transactions],
  );

  return (
    <div className={styles.pageShell}>
      <TopNav pendingCount={pendingCount} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
