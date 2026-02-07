import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ChartBar, ClipboardText, Tray, GearSix } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import styles from './BottomNav.module.scss';

interface NavItem {
  id: string;
  to: string;
  labelKey: string;
  icon: Icon;
  end: boolean;
  showActive: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', to: '/', labelKey: 'nav.home', icon: ChartBar, end: true, showActive: true },
  { id: 'orders', to: '/work-orders', labelKey: 'nav.orders', icon: ClipboardText, end: false, showActive: true },
  { id: 'review', to: '/review', labelKey: 'nav.review', icon: Tray, end: false, showActive: true },
  { id: 'more', to: '/', labelKey: 'nav.more', icon: GearSix, end: true, showActive: false },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className={styles.bottomNav} aria-label={t('nav.mobileNavigation')}>
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
          <span className={styles.navLabel}>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
