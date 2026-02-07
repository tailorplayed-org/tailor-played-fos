import { useTranslation } from 'react-i18next';
import { Badge } from './Badge';

export interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const { t } = useTranslation();
  const isHigh = confidence >= 85;
  const label = isHigh
    ? `${confidence}%`
    : `${confidence}% — ${t('components.confidenceBadge.checkMe')}`;

  return (
    <Badge
      label={label}
      color={isHigh ? 'success' : 'warning'}
      className={className}
    />
  );
}
