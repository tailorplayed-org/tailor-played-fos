import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, PencilSimple, Plus, Receipt, WarningCircle, CalendarBlank, ArrowBendDownRight } from '@phosphor-icons/react';
import { Button, Badge, Skeleton } from '@/components';
import { useWorkOrders, useWorkOrderActions, useTransactions, useTransactionActions } from './hooks';
import { StatusStepper, NutritionLabel, TransactionForm, WorkOrderForm, ScoopModal } from './components';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { useInventoryLogs } from '@/features/inventory/hooks/useInventoryLogs';
import { useScoopAction } from '@/hooks/useScoopAction';
import { formatCurrency } from '@/lib';
import type { WorkOrderStatus, CreateWorkOrderInput, CreateTransactionInput } from '@/types';
import styles from './WorkOrderDetailPage.module.scss';

const CATEGORY_BADGE_COLOR: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  DirectCost: 'error',
  Revenue: 'success',
  InventoryRestock: 'warning',
  Overhead: 'info',
  Personal: 'default',
};

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Hooks subscribe to Firestore — data flows into Zustand stores
  const { workOrders, loading: woLoading, error: woError } = useWorkOrders();
  const { transactions, loading: txnLoading } = useTransactions();
  const { inventory } = useInventory();
  const { logs: allInventoryLogs } = useInventoryLogs();

  // Derive specific WO and its transactions from hook data via useMemo
  // (avoids dual Zustand subscription issues with useSyncExternalStore)
  const workOrder = useMemo(
    () => workOrders.find((wo) => wo.id === (id ?? '')),
    [workOrders, id],
  );
  const woTransactions = useMemo(
    () => transactions.filter((txn) => txn.workOrderId === (id ?? '')),
    [transactions, id],
  );

  // Scoop logs for this work order
  const woInventoryLogs = useMemo(
    () => allInventoryLogs.filter((log) => log.workOrderRef === (id ?? '') && log.action === 'consume'),
    [allInventoryLogs, id],
  );

  // Map itemId → item name for NutritionLabel display
  const inventoryItemNames = useMemo(
    () => Object.fromEntries(inventory.map((i) => [i.id, i.name])),
    [inventory],
  );

  // Actions
  const { updateWorkOrder } = useWorkOrderActions();
  const { createTransaction } = useTransactionActions();
  const { executeScoop } = useScoopAction(inventory, workOrders);

  // Local state
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showScoopModal, setShowScoopModal] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Sort transactions newest first
  const sortedTransactions = useMemo(
    () => [...woTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [woTransactions],
  );

  const isLoading = woLoading || txnLoading;

  const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!workOrder || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await updateWorkOrder(
        workOrder.id,
        { status: newStatus },
        t('workOrders.toast.statusChanged', { status: t(`workOrders.status.${newStatus}`) }),
      );
    } catch {
      // Error toast already shown by useWorkOrderActions
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleEdit = async (data: CreateWorkOrderInput) => {
    if (!workOrder) return;
    try {
      await updateWorkOrder(workOrder.id, data);
      setShowEditForm(false);
    } catch {
      // Error toast already shown
    }
  };

  const handleCreateTransaction = async (data: CreateTransactionInput) => {
    try {
      await createTransaction(data);
      setShowTransactionForm(false);
    } catch {
      // Error toast already shown
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Not found: show after loading completes and WO not in store
  if (!isLoading && !workOrder && !woError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <WarningCircle size={48} className={styles.errorIcon} />
          <h1 className={styles.errorTitle}>{t('workOrderDetail.notFound')}</h1>
          <p className={styles.errorDescription}>{t('workOrderDetail.notFoundDescription')}</p>
          <button
            type="button"
            className={styles.errorLink}
            onClick={() => navigate('/work-orders')}
          >
            {t('workOrderDetail.backToWorkOrders')}
          </button>
        </div>
      </div>
    );
  }

  if (!workOrder) return null;

  return (
    <div className={styles.page}>
      {/* Back navigation */}
      <button
        type="button"
        className={styles.backNav}
        onClick={() => navigate('/work-orders')}
      >
        <ArrowLeft size={18} />
        <span>{t('workOrderDetail.backToList')}</span>
      </button>

      {/* Project Header */}
      <section className={styles.headerSection}>
        <div className={styles.headerTop}>
          <div className={styles.headerInfo}>
            <h1 className={styles.clientName}>{workOrder.clientName}</h1>
            {workOrder.projectDescription && (
              <p className={styles.description}>{workOrder.projectDescription}</p>
            )}
            {workOrder.deadline && (
              <div className={styles.deadline}>
                <CalendarBlank size={14} />
                <span>
                  {t('workOrderDetail.deadline', {
                    date: workOrder.deadline.toLocaleDateString(i18n.language, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }),
                  })}
                </span>
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setShowEditForm(true);
              setShowTransactionForm(false);
            }}
          >
            <PencilSimple size={18} />
            <span>{t('workOrderDetail.editWorkOrder')}</span>
          </Button>
        </div>
      </section>

      {/* Edit Form */}
      {showEditForm && (
        <section className={styles.formSection}>
          <WorkOrderForm
            onSubmit={handleEdit}
            onCancel={() => setShowEditForm(false)}
            isEdit
            defaultValues={{
              clientName: workOrder.clientName,
              projectDescription: workOrder.projectDescription,
              deadline: workOrder.deadline,
              status: workOrder.status,
            }}
          />
        </section>
      )}

      {/* Status Stepper */}
      <StatusStepper
        currentStatus={workOrder.status}
        onStatusChange={handleStatusChange}
        disabled={statusUpdating}
      />

      {/* Nutrition Label */}
      <NutritionLabel
        workOrder={workOrder}
        transactions={woTransactions}
        inventoryLogs={woInventoryLogs}
        inventoryItemNames={inventoryItemNames}
        loading={txnLoading}
      />

      {/* Transactions Section */}
      <section className={styles.transactionsSection}>
        <div className={styles.transactionsHeader}>
          <h2 className={styles.transactionsTitle}>{t('workOrderDetail.transactionsTitle')}</h2>
          <div className={styles.transactionsActions}>
            <Button
              size="sm"
              onClick={() => {
                setShowTransactionForm(true);
                setShowEditForm(false);
              }}
            >
              <Plus size={18} weight="bold" />
              <span>{t('workOrderDetail.addTransaction')}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowScoopModal(true)}
            >
              <ArrowBendDownRight size={18} weight="bold" />
              <span>{t('inventory.scoop.action')}</span>
            </Button>
          </div>
        </div>

        {/* Transaction Form */}
        {showTransactionForm && (
          <div className={styles.formSection}>
            <TransactionForm
              onSubmit={handleCreateTransaction}
              onCancel={() => setShowTransactionForm(false)}
              defaultWorkOrderId={id}
            />
          </div>
        )}

        {sortedTransactions.length > 0 ? (
          <ul className={styles.transactionsList}>
            {sortedTransactions.map((txn) => (
              <li key={txn.id} className={styles.transactionRow}>
                <span className={styles.transactionDate}>
                  {txn.date.toLocaleDateString(i18n.language)}
                </span>
                <span className={styles.transactionVendor}>{txn.vendorName}</span>
                <span className={styles.transactionAmount}>
                  {formatCurrency(txn.amountAgora, txn.currency)}
                </span>
                <span className={styles.transactionBadge}>
                  <Badge
                    label={t(`transactions.category.${txn.category}`)}
                    color={CATEGORY_BADGE_COLOR[txn.category] ?? 'default'}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          !showTransactionForm && (
            <div className={styles.emptyTransactions}>
              <Receipt size={32} className={styles.emptyIcon} />
              <p className={styles.emptyText}>{t('workOrderDetail.noTransactions')}</p>
              <p className={styles.emptyHint}>{t('workOrderDetail.noTransactionsHint')}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTransactionForm(true);
                  setShowEditForm(false);
                }}
              >
                <Plus size={18} weight="bold" />
                <span>{t('workOrderDetail.addTransaction')}</span>
              </Button>
            </div>
          )
        )}
      </section>

      {/* Scoop Modal */}
      {showScoopModal && (
        <ScoopModal
          open={showScoopModal}
          onClose={() => setShowScoopModal(false)}
          onSubmit={executeScoop}
          inventoryItems={inventory}
          workOrders={workOrders}
          preselectedWorkOrderId={id}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonPage} aria-busy="true">
      <Skeleton width={120} height={20} variant="text" />
      <div className={styles.skeletonHeader}>
        <Skeleton width="60%" height={28} variant="text" />
        <Skeleton width="40%" height={18} variant="text" />
        <Skeleton width="30%" height={16} variant="text" />
      </div>
      <Skeleton width="100%" height={48} variant="rect" />
      <div className={styles.skeletonTransactions}>
        <Skeleton width="50%" height={24} variant="text" />
        <Skeleton width="100%" height={40} variant="rect" />
        <Skeleton width="100%" height={40} variant="rect" />
        <Skeleton width="100%" height={40} variant="rect" />
      </div>
    </div>
  );
}
