import { NavLink } from 'react-router';
import { Bell } from '@phosphor-icons/react';
import styles from './TopNav.module.scss';

interface TopNavProps {
  /** Number of pending review items to display in badge */
  pendingCount?: number;
}

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/work-orders', label: 'Work Orders', end: false },
  { to: '/inventory', label: 'Inventory', end: false },
  { to: '/overhead', label: 'Overhead', end: false },
] as const;

export function TopNav({ pendingCount = 0 }: TopNavProps) {
  return (
    <nav className={styles.topNav} aria-label="Main navigation">
      {/* Logo */}
      <NavLink to="/" className={styles.logo} aria-label="TailorPlayed home">
        <img
          src="/images/logo.svg"
          alt="TailorPlayed"
          className={styles.logoImg}
        />
        <span className={styles.logoText}>FOS</span>
      </NavLink>

      {/* Segmented Pill Tabs — hidden on mobile via CSS */}
      <div className={styles.navTabs}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Pending Review Badge */}
      <NavLink
        to="/review"
        className={`${styles.pendingBadge} ${pendingCount === 0 ? styles.pendingBadgeHidden : ''}`}
        aria-label={`${pendingCount} pending reviews`}
      >
        <Bell size={18} weight="bold" />
        {pendingCount}
      </NavLink>
    </nav>
  );
}
