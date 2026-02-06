import { Outlet } from 'react-router';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import styles from './PageShell.module.scss';

export function PageShell() {
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
