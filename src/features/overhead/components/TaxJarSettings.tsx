import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from '@phosphor-icons/react';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components';
import { formatCurrency } from '@/lib';
import { calculateTaxReserve, calculateTaxBreakdown } from '@/lib';
import { useSystemConfigStore } from '@/stores';
import { toast } from '@/stores/useUIStore';
import { db } from '@/services';
import styles from './TaxJarSettings.module.scss';

interface TaxJarSettingsProps {
  currentNetProfitAgora: number | null;
  onClose: () => void;
}

export function TaxJarSettings({ currentNetProfitAgora, onClose }: TaxJarSettingsProps) {
  const { t } = useTranslation();
  const configStore = useSystemConfigStore();

  const [localMethod, setLocalMethod] = useState<'flat' | 'bracket'>('flat');
  const [localRate, setLocalRate] = useState(35);
  const [saving, setSaving] = useState(false);

  // Initialize local state from store config
  useEffect(() => {
    if (configStore.config) {
      setLocalMethod(configStore.config.taxMethod);
      setLocalRate(Math.round(configStore.config.flatRate * 100));
    }
  }, [configStore.config]);

  // Preview computation
  const previewTaxAgora = useMemo(() => {
    if (currentNetProfitAgora == null || currentNetProfitAgora <= 0) return null;
    return calculateTaxReserve(currentNetProfitAgora, localMethod, localRate / 100);
  }, [currentNetProfitAgora, localMethod, localRate]);

  const breakdown = useMemo(() => {
    if (currentNetProfitAgora == null || currentNetProfitAgora <= 0) return null;
    return calculateTaxBreakdown(currentNetProfitAgora, localMethod, localRate / 100);
  }, [currentNetProfitAgora, localMethod, localRate]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'system_config', 'app');
      await setDoc(docRef, {
        taxMethod: localMethod,
        flatRate: localRate / 100,
      }, { merge: true });
      toast.success(t('settings.taxJar.saveSuccess'));
    } catch {
      toast.error(t('settings.taxJar.saveError'));
    } finally {
      setSaving(false);
    }
  }, [localMethod, localRate, t]);

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsHeader}>
        <h3>{t('settings.taxJar.title')}</h3>
        <button onClick={onClose} className={styles.closeButton} aria-label={t('actions.cancel')}>
          <X size={20} />
        </button>
      </div>

      {/* Method Toggle */}
      <div className={styles.methodToggle}>
        <span className={styles.toggleLabel}>{t('settings.taxJar.method')}</span>
        <div className={styles.toggleGroup} role="radiogroup" aria-label={t('settings.taxJar.method')}>
          <button
            role="radio"
            aria-checked={localMethod === 'flat'}
            className={`${styles.toggleOption} ${localMethod === 'flat' ? styles.toggleActive : ''}`}
            onClick={() => setLocalMethod('flat')}
          >
            {t('settings.taxJar.flat')}
          </button>
          <button
            role="radio"
            aria-checked={localMethod === 'bracket'}
            className={`${styles.toggleOption} ${localMethod === 'bracket' ? styles.toggleActive : ''}`}
            onClick={() => setLocalMethod('bracket')}
          >
            {t('settings.taxJar.bracket')}
          </button>
        </div>
      </div>

      {/* Flat Rate Input — only shown in flat mode */}
      {localMethod === 'flat' && (
        <div className={styles.rateInput}>
          <label htmlFor="flat-rate">{t('settings.taxJar.flatRateLabel')}</label>
          <div className={styles.rateInputWrap}>
            <input
              id="flat-rate"
              type="number"
              min={1}
              max={100}
              value={localRate}
              onChange={(e) => setLocalRate(Math.min(100, Math.max(1, Number(e.target.value))))}
              className={styles.rateField}
            />
            <span className={styles.rateSuffix}>%</span>
          </div>
        </div>
      )}

      {/* Preview */}
      <div className={styles.preview}>
        <span className={styles.previewLabel}>{t('settings.taxJar.preview')}</span>
        <span className={styles.previewAmount}>
          {previewTaxAgora != null ? formatCurrency(previewTaxAgora) : '—'}
        </span>
        {localMethod === 'flat' && (
          <span className={styles.previewHint}>
            {t('settings.taxJar.flatHint', { rate: String(localRate) })}
          </span>
        )}
      </div>

      {/* Bracket Breakdown — only shown in bracket mode */}
      {localMethod === 'bracket' && breakdown && breakdown.rows.length > 0 && (
        <div className={styles.bracketBreakdown}>
          <h4 className={styles.breakdownTitle}>{t('settings.taxJar.bracketBreakdown')}</h4>
          <table className={styles.bracketTable}>
            <thead>
              <tr>
                <th>{t('settings.taxJar.bracketRange')}</th>
                <th>{t('settings.taxJar.bracketTax')}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.label}</td>
                  <td>{formatCurrency(row.taxAgora)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.breakdownTotal}>
            {t('settings.taxJar.monthlyReserve')}: {formatCurrency(breakdown.totalTaxAgora)}
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? t('settings.taxJar.saving') : t('settings.taxJar.save')}
      </Button>
    </div>
  );
}
