import { Outlet } from 'react-router';
import { useDirection } from '@/hooks';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import styles from './PageShell.module.scss';

export function PageShell() {
  // Sets dir and lang attributes on <html> element reactively
  useDirection();

  return (
    <div className={styles.pageShell}>
      <TopNav />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
