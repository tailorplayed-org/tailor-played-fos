import { NavLink } from 'react-router';
import { ChartBar, ClipboardText, Tray, GearSix } from '@phosphor-icons/react';
import styles from './BottomNav.module.scss';

const navItems = [
  { id: 'home', to: '/', label: 'Home', icon: ChartBar, end: true, showActive: true },
  { id: 'orders', to: '/work-orders', label: 'Orders', icon: ClipboardText, end: false, showActive: true },
  { id: 'review', to: '/review', label: 'Review', icon: Tray, end: false, showActive: true },
  { id: 'more', to: '/', label: 'More', icon: GearSix, end: true, showActive: false },
];

export function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `${styles.navItem} ${isActive && item.showActive ? styles.navItemActive : ''}`
          }
        >
          <item.icon size={24} />
          <span className={styles.navLabel}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
