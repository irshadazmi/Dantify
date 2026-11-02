
import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useStyles } from '@/styles/styles';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
}

export function StatusBadge({
  label,
  variant,
}: StatusBadgeProps) {
  const styles = useStyles();

  const badgeStyles = {
    success: styles.statusPillSuccess,
    warning: styles.statusPillWarning,
    danger: styles.statusPillDanger,
    info: styles.statusPillInfo,
    neutral: styles.statusPillNeutral,
  };

  const textStyles = {
    success: styles.statusPillTextSuccess,
    warning: styles.statusPillTextWarning,
    danger: styles.statusPillTextDanger,
    info: styles.statusPillTextInfo,
    neutral: styles.statusPillTextNeutral,
  };

  return (
    <View style={[styles.statusPill, badgeStyles[variant]]}>
      <AppText style={[styles.statusPillText, textStyles[variant]]}>
        {label}
      </AppText>
    </View>
  );
}
