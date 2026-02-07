import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardText, Plus, PencilSimple, WarningCircle, GameController, Receipt } from '@phosphor-icons/react';
import { Button, Card, StatusBadge, Skeleton } from '@/components';
import { useWorkOrders, useWorkOrderActions, useTransactions, useTransactionActions } from './hooks';
import { WorkOrderForm, StatusStepper, TransactionForm } from './components';
import { calculateMargin, getMarginStatus, formatCurrency } from '@/lib';
import type { WorkOrder, WorkOrderStatus, CreateWorkOrderInput, CreateTransactionInput } from '@/types';
import styles from './WorkOrdersPage.module.scss';

const STATUS_PRIORITY: Record<WorkOrderStatus, number> = {
  Production: 0,
  Design: 1,
  Lead: 2,
  Shipped: 3,
};

function sortWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return [...orders].sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export function WorkOrdersPage() {
  const { t } = useTranslation();
  const { workOrders, loading, error } = useWorkOrders();
  const { createWorkOrder, updateWorkOrder } = useWorkOrderActions();
  const { transactions } = useTransactions();
  const { createTransaction } = useTransactionActions();

  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const transactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.workOrderId) {
        counts[t.workOrderId] = (counts[t.workOrderId] || 0) + 1;
      }
    });
    return counts;
  }, [transactions]);

  const handleCreate = async (data: CreateWorkOrderInput) => {
    try {
      await createWorkOrder(data);
      setShowForm(false);
    } catch {
      // Error toast already shown by useWorkOrderActions — keep form open
    }
  };

  const handleUpdate = async (data: CreateWorkOrderInput) => {
    if (!editingOrder) return;
    try {
      await updateWorkOrder(editingOrder.id, data);
      setEditingOrder(null);
    } catch {
      // Error toast already shown by useWorkOrderActions — keep form open
    }
  };

  const handleCreateTransaction = async (data: CreateTransactionInput) => {
    try {
      await createTransaction(data);
      setShowTransactionForm(false);
    } catch {
      // Error toast already shown by useTransactionActions — keep form open
    }
  };

  const handleEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setShowForm(false);
    setShowTransactionForm(false);
    setExpandedOrderId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowTransactionForm(false);
    setEditingOrder(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: WorkOrderStatus) => {
    try {
      await updateWorkOrder(
        orderId,
        { status: newStatus },
        t('workOrders.toast.statusChanged', { status: t(`workOrders.status.${newStatus}`) }),
      );
      setExpandedOrderId(null);
    } catch {
      // Error toast already shown by useWorkOrderActions — status reverts via Firestore listener
    }
  };

  const toggleStepper = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const isFormVisible = showForm || showTransactionForm || editingOrder !== null;
  const sortedOrders = useMemo(() => sortWorkOrders(workOrders), [workOrders]);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState} role="alert">
          <WarningCircle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{t('workOrders.error.title')}</p>
          <p className={styles.errorDetail}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('workOrders.title')}</h1>
        {!isFormVisible && (
          <div className={styles.headerActions}>
            <Button onClick={() => { setShowTransactionForm(true); setShowForm(false); setEditingOrder(null); }}>
              <Receipt size={18} weight="bold" />
              <span>{t('transactions.addTransaction')}</span>
            </Button>
            <Button onClick={() => { setShowForm(true); setShowTransactionForm(false); setEditingOrder(null); }}>
              <Plus size={18} weight="bold" />
              <span>{t('workOrders.newWorkOrder')}</span>
            </Button>
          </div>
        )}
      </header>

      {(showForm || editingOrder !== null) && (
        <section className={styles.formSection} aria-label={editingOrder ? t('workOrders.editWorkOrder') : t('workOrders.newWorkOrder')}>
          <WorkOrderForm
            onSubmit={editingOrder ? handleUpdate : handleCreate}
            onCancel={handleCancel}
            isEdit={!!editingOrder}
            defaultValues={
              editingOrder
                ? {
                    clientName: editingOrder.clientName,
                    projectDescription: editingOrder.projectDescription,
                    deadline: editingOrder.deadline,
                    status: editingOrder.status,
                  }
                : undefined
            }
          />
        </section>
      )}

      {showTransactionForm && (
        <section className={styles.formSection} aria-label={t('transactions.form.title')}>
          <TransactionForm
            onSubmit={handleCreateTransaction}
            onCancel={handleCancel}
          />
        </section>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && workOrders.length === 0 && <EmptyState onCreateClick={() => setShowForm(true)} />}

      {!loading && sortedOrders.length > 0 && (
        <ul className={styles.list} role="list">
          {sortedOrders.map((order) => (
            <li key={order.id}>
              <WorkOrderCard
                order={order}
                transactionCount={transactionCounts[order.id] || 0}
                onEdit={() => handleEdit(order)}
                isExpanded={expandedOrderId === order.id}
                onToggleStepper={() => toggleStepper(order.id)}
                onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className={styles.emptyState}>
      <ClipboardText size={64} className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>{t('workOrders.emptyState.title')}</h2>
      <p className={styles.emptyDescription}>{t('workOrders.emptyState.description')}</p>
      <Button onClick={onCreateClick}>
        {t('workOrders.emptyState.cta')}
      </Button>
    </div>
  );
}

interface WorkOrderCardProps {
  order: WorkOrder;
  transactionCount: number;
  onEdit: () => void;
  isExpanded: boolean;
  onToggleStepper: () => void;
  onStatusChange: (newStatus: WorkOrderStatus) => void;
}

function WorkOrderCard({ order, transactionCount, onEdit, isExpanded, onToggleStepper, onStatusChange }: WorkOrderCardProps) {
  const { t } = useTranslation();

  const totalCost = order.directCostAgora + order.inventoryCostAgora + order.overheadAllocationAgora;
  const margin = calculateMargin(order.revenueTotalAgora, totalCost);
  const marginStatus = getMarginStatus(margin);
  const isShipped = order.status === 'Shipped';
  const hasRevenue = order.revenueTotalAgora > 0;
  const clampedMargin = Math.max(0, Math.min(100, margin));

  const cardClassName = [
    styles.card,
    isShipped ? styles.cardShipped : '',
    !isShipped && marginStatus === 'danger' && hasRevenue ? styles.cardDanger : '',
  ]
    .filter(Boolean)
    .join(' ');

  const marginColorClass =
    marginStatus === 'healthy'
      ? styles.marginHealthy
      : marginStatus === 'watch'
        ? styles.marginWatch
        : styles.marginDanger;

  return (
    <Card className={cardClassName}>
      <div className={styles.cardContent}>
        <div className={styles.iconBox}>
          <GameController size={24} weight="fill" />
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardHeader}>
            <h3 className={styles.clientName}>{order.clientName}</h3>
            <button
              type="button"
              className={styles.statusArea}
              onClick={onToggleStepper}
              aria-expanded={isExpanded}
              aria-label={t('workOrders.card.changeStatus')}
            >
              <StatusBadge status={order.status} />
            </button>
          </div>
          <p className={styles.description}>
            {order.projectDescription || t('workOrders.card.noDescription')}
          </p>
          {order.deadline && (
            <time className={styles.deadline} dateTime={order.deadline.toISOString()}>
              {order.deadline.toLocaleDateString()}
            </time>
          )}
        </div>

        <div className={styles.cardFinancials}>
          <span className={styles.revenue}>{formatCurrency(order.revenueTotalAgora)}</span>
          <span className={styles.costCount}>{transactionCount} {t('workOrders.card.transactions')}</span>
          <div className={styles.marginArea}>
            <span className={`${styles.marginValue} ${marginColorClass}`}>
              {hasRevenue ? `${Math.round(margin)}%` : t('workOrders.margin.noRevenue')}
            </span>
            {hasRevenue && (
              <div className={styles.marginBar}>
                <div
                  className={`${styles.marginBarFill} ${marginColorClass}`}
                  style={{ inlineSize: `${clampedMargin}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.cardActions}>
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`${t('workOrders.card.edit')} ${order.clientName}`}>
            <PencilSimple size={18} />
            <span className={styles.editLabel}>{t('workOrders.card.edit')}</span>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.stepperContainer}>
          <StatusStepper
            currentStatus={order.status}
            onStatusChange={onStatusChange}
          />
        </div>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.skeletonList} aria-busy="true">
      {[1, 2, 3].map((i) => (
        <Card key={i} className={styles.card}>
          <Skeleton width="60%" height={24} variant="text" />
          <Skeleton width="40%" height={18} variant="text" />
          <Skeleton width="100%" height={16} variant="text" />
        </Card>
      ))}
    </div>
  );
}
