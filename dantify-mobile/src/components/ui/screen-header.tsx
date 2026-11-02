import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/app-button';
import { useStyles } from '@/styles/styles';

type Props = {
  title: string;
  subtitle?: string;
  count?: number;
  actionTitle?: string;
  onAction?: () => void;
};

export function ScreenHeader({
  title,
  subtitle,
  count,
  actionTitle,
  onAction,
}: Props) {
  const styles = useStyles();

  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="title">{title}</AppText>

          {count !== undefined && (
            <AppText variant="muted">({count})</AppText>
          )}
        </View>

        {subtitle ? (
          <AppText variant="subtitle">{subtitle}</AppText>
        ) : null}
      </View>

      {actionTitle && onAction && (
        <AppButton
          title={actionTitle}
          onPress={onAction}
          variant="small"
        />
      )}
    </View>
  );
}