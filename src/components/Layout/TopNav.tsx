import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Bell } from '@phosphor-icons/react';
import styles from './TopNav.module.scss';

interface TopNavProps {
  /** Number of pending review items to display in badge */
  pendingCount?: number;
}

export function TopNav({ pendingCount = 0 }: TopNavProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(nextLang);
  };

  const navItems = [
    { to: '/', label: t('nav.dashboard'), end: true },
    { to: '/work-orders', label: t('nav.workOrders'), end: false },
    { to: '/inventory', label: t('nav.inventory'), end: false },
    { to: '/overhead', label: t('nav.overhead'), end: false },
  ];

  return (
    <nav className={styles.topNav} aria-label={t('nav.mainNavigation')}>
      {/* Logo */}
      <NavLink to="/" className={styles.logo} aria-label={t('nav.tailorPlayedHome')}>
        <img
          src="/images/logo.svg"
          alt="TailorPlayed"
          className={styles.logoImg}
        />
        <span className={styles.logoText}>{t('labels.fos')}</span>
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

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className={styles.langToggle}
        aria-label={t('language.toggle')}
        type="button"
      >
        {i18n.language === 'he' ? 'EN' : 'עב'}
      </button>

      {/* Pending Review Badge */}
      <NavLink
        to="/review"
        className={`${styles.pendingBadge} ${pendingCount === 0 ? styles.pendingBadgeHidden : ''}`}
        aria-label={t('nav.pendingReviews', { count: pendingCount })}
      >
        <Bell size={18} weight="bold" />
        {pendingCount}
      </NavLink>
    </nav>
  );
}
