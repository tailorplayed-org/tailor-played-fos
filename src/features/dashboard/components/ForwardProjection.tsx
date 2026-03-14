import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, X, CheckCircle, Warning, XCircle, Package } from '@phosphor-icons/react';
import { formatCurrency, toMinorUnits } from '@/lib';
import {
  buildFinancialSnapshot,
  calculateProjection,
  type FinancialSnapshot,
  type ProjectionResult,
  type ProjectionAssessment,
} from '@/lib';
import styles from './ForwardProjection.module.scss';

export interface ForwardProjectionProps {
  netProfitAgora: number;
  taxJarAgora: number;
  monthlyOverheadAgora: number;
  pipelineRevenueAgora: number;
  onClose: () => void;
}

const ASSESSMENT_ICONS: Record<ProjectionAssessment, typeof CheckCircle> = {
  healthy: CheckCircle,
  tight: Warning,
  negative: XCircle,
};

const ASSESSMENT_STYLES: Record<ProjectionAssessment, string> = {
  healthy: styles.assessmentHealthy,
  tight: styles.assessmentTight,
  negative: styles.assessmentNegative,
};

export function ForwardProjection({
  netProfitAgora,
  taxJarAgora,
  monthlyOverheadAgora,
  pipelineRevenueAgora,
  onClose,
}: ForwardProjectionProps) {
  const { t } = useTranslation();
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isInventoryPurchase, setIsInventoryPurchase] = useState(false);

  const snapshot = useMemo<FinancialSnapshot>(
    () => buildFinancialSnapshot(netProfitAgora, taxJarAgora, monthlyOverheadAgora, pipelineRevenueAgora),
    [netProfitAgora, taxJarAgora, monthlyOverheadAgora, pipelineRevenueAgora],
  );

  const projection = useMemo<ProjectionResult | null>(() => {
    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) return null;
    const purchaseAgora = toMinorUnits(amount, 'ILS');
    return calculateProjection(snapshot, purchaseAgora, isInventoryPurchase);
  }, [snapshot, purchaseAmount, isInventoryPurchase]);

  const AssessmentIcon = projection ? ASSESSMENT_ICONS[projection.assessment] : null;

  return (
    <div className={styles.projectionPanel} data-testid="forward-projection">
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Calculator size={22} weight="fill" />
          <h2>{t('dashboard.projection.title')}</h2>
        </div>
        <button onClick={onClose} className={styles.closeButton} aria-label={t('actions.cancel')}>
          <X size={20} />
        </button>
      </div>

      <div className={styles.snapshotGrid}>
        <div className={styles.snapshotItem}>
          <span className={styles.snapshotLabel}>{t('dashboard.projection.netProfit')}</span>
          <span className={styles.snapshotValue}>{formatCurrency(snapshot.netProfitAgora)}</span>
        </div>
        <div className={styles.snapshotItem}>
          <span className={styles.snapshotLabel}>{t('dashboard.projection.taxJar')}</span>
          <span className={`${styles.snapshotValue} ${styles.locked}`}>{formatCurrency(snapshot.taxJarAgora)}</span>
        </div>
        <div className={styles.snapshotItem}>
          <span className={styles.snapshotLabel}>{t('dashboard.projection.overhead')}</span>
          <span className={styles.snapshotValue}>{formatCurrency(snapshot.monthlyOverheadAgora)}</span>
        </div>
        <div className={styles.snapshotItem}>
          <span className={styles.snapshotLabel}>{t('dashboard.projection.buffer')}</span>
          <span className={`${styles.snapshotValue} ${styles.bufferValue}`}>
            {formatCurrency(snapshot.availableBufferAgora)}
          </span>
        </div>
        <div className={styles.snapshotItem}>
          <span className={styles.snapshotLabel}>{t('dashboard.projection.pipeline')}</span>
          <span className={styles.snapshotValue}>{formatCurrency(snapshot.pipelineRevenueAgora)}</span>
        </div>
      </div>

      <div className={styles.inputSection}>
        <label htmlFor="purchase-amount" className={styles.inputLabel}>
          {t('dashboard.projection.inputLabel')}
        </label>
        <div className={styles.inputWrap}>
          <span className={styles.currencyPrefix}>₪</span>
          <input
            id="purchase-amount"
            type="number"
            min={0}
            step={100}
            value={purchaseAmount}
            onChange={(e) => setPurchaseAmount(e.target.value)}
            placeholder={t('dashboard.projection.inputPlaceholder')}
            className={styles.purchaseInput}
          />
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isInventoryPurchase}
            onChange={(e) => setIsInventoryPurchase(e.target.checked)}
            className={styles.checkbox}
          />
          <Package size={16} />
          <span>{t('dashboard.projection.inventoryPurchase')}</span>
        </label>
      </div>

      {projection && (
        <div className={`${styles.result} ${ASSESSMENT_STYLES[projection.assessment]}`}>
          <div className={styles.assessmentHeader}>
            {AssessmentIcon && <AssessmentIcon size={22} weight="fill" />}
            <h3 className={styles.assessmentTitle}>
              {t(`dashboard.projection.assessment.${projection.assessment}`)}
            </h3>
          </div>

          <div className={styles.resultDetails}>
            <div className={styles.resultRow}>
              <span>{t('dashboard.projection.bufferAfter')}</span>
              <span className={projection.bufferAfterPurchaseAgora < 0 ? styles.negativeAmount : ''}>
                {formatCurrency(projection.bufferAfterPurchaseAgora)}
              </span>
            </div>
            <div className={styles.resultRow}>
              <span>{t('dashboard.projection.coverageMonths')}</span>
              <span>
                {projection.monthlyCoverageMonths === Infinity
                  ? '∞'
                  : t('dashboard.projection.months', { count: String(projection.monthlyCoverageMonths) })}
              </span>
            </div>

            {projection.shortfallAgora > 0 && (
              <div className={`${styles.resultRow} ${styles.shortfall}`}>
                <span>{t('dashboard.projection.shortfall')}</span>
                <span>{formatCurrency(projection.shortfallAgora)}</span>
              </div>
            )}

            {projection.monthsUntilAbsorbed != null && (
              <div className={styles.resultRow}>
                <span>{t('dashboard.projection.recoveryTime')}</span>
                <span>{t('dashboard.projection.months', { count: String(projection.monthsUntilAbsorbed) })}</span>
              </div>
            )}
          </div>

          {projection.isInventoryPurchase && (
            <p className={styles.inventoryNote}>
              <Package size={16} />
              {t('dashboard.projection.inventoryNote')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
